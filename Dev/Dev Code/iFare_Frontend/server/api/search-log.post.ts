/**
 * 搜尋查詢記錄（純觀測端點）
 *
 * 【為什麼要有這支】
 * 想知道民眾實際搜什麼、系統把它理解成什麼、查到幾筆、有沒有 0 筆。
 * 這份資料只拿來決定後續該補哪些同義詞、以及值不值得投入語意檢索。
 * 全程只做字串處理與寫檔，零外部成本、不呼叫任何 AI。
 *
 * 【隱私原則｜本檔最重要的一條】
 * 只記錄「查詢內容」與「結果統計」，
 * 絕對不記錄 IP、User-Agent、cookie、session id，或任何可識別個人的資訊。
 * 每筆記錄都無從對回是誰送的，也刻意不放任何能把多筆記錄串成同一個人的欄位。
 *
 * 查詢字串本身可能夾帶個人情境（「我媽媽 80 歲」這類），所以規則再收一層：
 * 查詢文字只保留下來改善搜尋，不另外附加任何身分資訊；
 * filters 也只白名單挑那五個已知欄位，呼叫端多塞的欄位一律丟掉，
 * 免得日後前端不小心把別的東西一起送過來就落地。
 *
 * 【失敗處理】
 * 這是純觀測功能，不該影響任何人的搜尋：整段包 try/catch，
 * 寫檔失敗只在伺服器 console.warn，對外一律回 { ok: true }。
 */
import fs from "node:fs/promises";
import path from "node:path";
// 限流沿用共用工具：getClientKey 取反向代理附加的可信來源、createRateLimiter 會清過期項並設硬上限。
// 注意：這個 key 只活在限流器的記憶體 Map 裡，絕不會寫進 log（見上方隱私原則）。
import { createRateLimiter, getClientKey } from "~/server/utils/rateLimit";

// 與 dynamic-assets 一致，一律以 process.cwd() 為基準解析資料夾
const LOG_DIR = path.resolve(process.cwd(), "server/data/search-logs");

// 各欄位的長度上限：查詢句本來就不會太長，超過的部分對「該補哪些同義詞」也沒有分析價值，
// 早點截掉可以順便擋住有人拿這支端點當免費儲存空間。
const MAX_QUERY_LENGTH = 100;
const MAX_RESOLVED_QUERY_LENGTH = 60;
const MAX_FIELD_LENGTH = 40;

// 每個 IP 每分鐘的請求上限。一次搜尋只會送一筆，60 次對正常使用綽綽有餘，
// 主要是擋腳本連打把磁碟灌爆。這支不碰 LLM，所以額度可以開得比其他端點寬。
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW_MS = 60_000;
const searchLogRateLimiter = createRateLimiter({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
});

/** 進來的 body 全部當成不可信輸入，型別一律 unknown，由下面的 sanitize 收斂 */
interface SearchLogPayload {
  query?: unknown;
  resolvedQuery?: unknown;
  beneficiary?: unknown;
  resultCount?: unknown;
  hasKeyword?: unknown;
  filters?: unknown;
}

/**
 * 字串欄位收斂：只收字串與數字，其餘（物件、陣列、null）一律當空值。
 * 用 String(value ?? "") 會把物件變成 "[object Object]" 落地，那是雜訊不是資料。
 * 連續空白（含換行、Tab）壓成一個空格，讓 JSON Lines 的「一行一筆」看起來乾淨。
 */
function sanitizeText(value: unknown, maxLength: number) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value).replace(/\s+/gu, " ").trim().slice(0, maxLength);
}

/**
 * 筆數收斂：非有限數字（NaN、Infinity、字串、undefined）一律當 0。
 * 順手取整數並夾在 0 以上——筆數不可能是負數或小數，讓後續統計不必再防一次。
 */
function sanitizeCount(value: unknown) {
  const count = Number(value);
  if (!Number.isFinite(count)) return 0;
  return Math.max(0, Math.trunc(count));
}

/**
 * 檔名的日期一律用台北時間切。
 * ts 欄位存的是 ISO（UTC）不受影響，但「哪一天大家在搜什麼」是給人看的，
 * 用 UTC 切會讓每天早上八點前的查詢被算到前一天去。
 * 固定加 +08:00 再讀 UTC 欄位，不管伺服器時區設成什麼都切在同一個位置。
 */
const TAIPEI_OFFSET_MS = 8 * 60 * 60 * 1000;

function getLogFileName(now: Date) {
  const taipei = new Date(now.getTime() + TAIPEI_OFFSET_MS);
  const year = taipei.getUTCFullYear();
  const month = String(taipei.getUTCMonth() + 1).padStart(2, "0");
  const date = String(taipei.getUTCDate()).padStart(2, "0");
  return `search-${year}${month}${date}.jsonl`;
}

export default defineEventHandler(async (event) => {
  // 限流放在最前面（讀 body 之前）。超限「靜默忽略」：不回 429、也不設 Retry-After——
  // 前端是 fire-and-forget、根本不看回應，回錯誤只會在瀏覽器 console 製造噪音。
  const rl = searchLogRateLimiter(getClientKey(event));
  if (!rl.allowed) return { ok: true };

  try {
    const body = (await readBody<SearchLogPayload>(event)) || {};

    // filters 只白名單取這五個欄位，其餘一律不落地（見檔頭隱私原則）
    const filters =
      body.filters && typeof body.filters === "object" && !Array.isArray(body.filters)
        ? (body.filters as Record<string, unknown>)
        : {};

    const now = new Date();
    const record = {
      ts: now.toISOString(),
      // 使用者原始輸入
      query: sanitizeText(body.query, MAX_QUERY_LENGTH),
      // AI 理解後實際拿去查的詞，用來比對「理解對不對」
      resolvedQuery: sanitizeText(body.resolvedQuery, MAX_RESOLVED_QUERY_LENGTH),
      // 受助對象（self/child/elder/family/unknown）
      beneficiary: sanitizeText(body.beneficiary, MAX_FIELD_LENGTH),
      resultCount: sanitizeCount(body.resultCount),
      // 布林只認真正的 true，避免 "false" 這種字串被當成真
      hasKeyword: body.hasKeyword === true,
      filters: {
        area: sanitizeText(filters.area, MAX_FIELD_LENGTH),
        recipient: sanitizeText(filters.recipient, MAX_FIELD_LENGTH),
        income: sanitizeText(filters.income, MAX_FIELD_LENGTH),
        identity: sanitizeText(filters.identity, MAX_FIELD_LENGTH),
        policy: sanitizeText(filters.policy, MAX_FIELD_LENGTH),
      },
    };

    // 按日期分檔，避免單檔無限成長；JSON Lines 一行一筆，用 append 就好，
    // 不必先讀回整個檔案再寫回去（那才是併發下真的會掉資料的寫法）。
    await fs.mkdir(LOG_DIR, { recursive: true });
    await fs.appendFile(
      path.join(LOG_DIR, getLogFileName(now)),
      `${JSON.stringify(record)}\n`,
      "utf8"
    );
  } catch (error) {
    // 磁碟滿、權限不足、body 壞掉——通通只留一行伺服器警告就算了。
    console.warn("[iFare][search-log]", error);
  }

  // 不論寫檔成功與否都回 ok：純觀測功能，任何失敗都不該讓使用者的搜尋看起來出錯。
  return { ok: true };
});
