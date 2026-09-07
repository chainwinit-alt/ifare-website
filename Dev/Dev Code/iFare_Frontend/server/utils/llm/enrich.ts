import type { LlmSummaryCaseItem } from "./types";

// 每次摘要固定併發打三筆政策明細；沒有逾時的 $fetch 在後端變慢或半掛時會無限期卡住，
// 配合 LLM 端點會形成對內部 API 的放大式 DoS，這裡設逾時當保險絲。
// 取 8 秒的參照：chatbot 的 cardStore.ts / siteKnowledge.ts 用 4 秒、chatbot.post.ts
// 的 LLM 呼叫用 15 秒；明細查詢比單卡查詢重、但仍應遠快於 LLM，取中間值 8 秒。
const DETAIL_FETCH_TIMEOUT_MS = 8000;

interface FarePolicyDetailApiResponse {
  result?: {
    result?: {
      id?: number;
      title?: string;
      qualification?: string | null;
      welfareInfo?: string | null;
      evidence?: string | null;
      officeUnitInfo?: string | null;
      officeUnitTel?: string | null;
      competentAuthority?: string | null;
      remark?: string | null;
    } | null;
  } | null;
}

function stripHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 後端有些欄位（實測是 welfareInfo）存的是 percent-encoded 的 HTML，
 * 政策明細頁本來就會 decodeURIComponent 再顯示（見 pages/ifare/info.vue）。
 * 送進 LLM 的這條路以前少了這一步，模型收到的是 %3Cp%3E%E4%B8%80... 這種字串——
 * 它多半猜得回來，但那是運氣，而且同樣的內容要多吃三倍 token。
 * 沒有 percent 編碼的欄位（例如 evidence）不動，壞掉的編碼也原樣退回。
 */
function decodePercentEncoding(value: string) {
  const escapes = value.match(/%[0-9A-Fa-f]{2}/g);
  // 整段幾乎都是編碼內容才解（編碼過的中文每個字佔 9 個字元，比例會很高）。
  // 純文字裡偶爾出現的 % 不能碰，否則「補助80%2倍」這種寫法會被解成別的字。
  if (!escapes || escapes.length * 3 < value.length * 0.3) return value;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeDetailText(value?: string | null) {
  if (!value) return "";
  return stripHtml(decodePercentEncoding(value));
}

function buildSourceSummary(detail: NonNullable<FarePolicyDetailApiResponse["result"]>["result"]) {
  if (!detail) return "";

  const parts = [
    detail.title ? `案例名稱：${detail.title}` : "",
    detail.qualification ? `適用條件：${normalizeDetailText(detail.qualification)}` : "",
    detail.welfareInfo ? `福利內容：${normalizeDetailText(detail.welfareInfo)}` : "",
    detail.evidence ? `申請證明：${normalizeDetailText(detail.evidence)}` : "",
    detail.officeUnitInfo ? `承辦單位資訊：${normalizeDetailText(detail.officeUnitInfo)}` : "",
    detail.officeUnitTel ? `聯絡電話：${normalizeDetailText(detail.officeUnitTel)}` : "",
    detail.competentAuthority ? `主管機關：${normalizeDetailText(detail.competentAuthority)}` : "",
    detail.remark ? `備註：${normalizeDetailText(detail.remark)}` : "",
  ].filter(Boolean);

  return parts.join("\n");
}

/**
 * 逾時中止用的 AbortSignal。優先用 AbortSignal.timeout（Node 17.3+／現代執行環境內建，
 * 內部計時器會自動清掉）；舊環境沒有時退回 AbortController + setTimeout 的等效寫法，
 * 並 unref 掉計時器，避免請求提早完成後還把行程吊著。
 */
function createTimeoutSignal(ms: number) {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  if (typeof (timer as { unref?: () => void })?.unref === "function") {
    (timer as { unref: () => void }).unref();
  }
  return controller.signal;
}

export async function enrichSummaryCases(
  cases: LlmSummaryCaseItem[],
  frontendApiServerBase: string,
  take = 6
) {
  const targetCases = cases.slice(0, take);
  if (!targetCases.length) return cases;

  const normalizedBase = frontendApiServerBase.replace(/\/$/, "");

  const enriched = await Promise.all(
    targetCases.map(async (item) => {
      try {
        const response = await $fetch<FarePolicyDetailApiResponse>(
          `${normalizedBase}/FarePolicy/GetIFarePolicyDetail`,
          {
            query: {
              farePolicyID: item.id,
            },
            // 逾時就中止這一筆請求；失敗會落到下面的 catch 退回原 item，
            // 維持「單筆逾時／失敗不影響其他筆」的行為。
            signal: createTimeoutSignal(DETAIL_FETCH_TIMEOUT_MS),
          }
        );

        const detail = response?.result?.result;
        if (!detail) return item;

        return {
          ...item,
          qualification: normalizeDetailText(detail.qualification) || item.qualification,
          welfareInfo: normalizeDetailText(detail.welfareInfo),
          evidence: normalizeDetailText(detail.evidence),
          officeUnitInfo: normalizeDetailText(detail.officeUnitInfo),
          officeUnitTel: normalizeDetailText(detail.officeUnitTel),
          competentAuthority: normalizeDetailText(detail.competentAuthority),
          remark: normalizeDetailText(detail.remark),
          sourceSummary: buildSourceSummary(detail),
        };
      } catch (error) {
        console.warn("[LLM][enrich]", { id: item.id, error });
        return item;
      }
    })
  );

  const enrichedById = new Map(enriched.map((item) => [item.id, item]));
  return cases.map((item) => enrichedById.get(item.id) || item);
}
