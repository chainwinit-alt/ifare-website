// 芒寶答案卡 — 資料來源
//
// 優先向後台 API 取卡片（基金會人員可自行維護），失敗時退回內建預設卡片。
// 這個函式永遠不會拋錯：答案卡是芒寶的保底層，不能因為後台連不上就整個啞掉。

import { DEFAULT_CARDS } from './defaultCards';
import type { ChatbotCard, SiteLinkKey } from './types';

const CACHE_TTL_MS = 5 * 60 * 1000;
const FETCH_TIMEOUT_MS = 4000;
const VALID_LINK_KEYS = new Set<SiteLinkKey>([
  'home',
  'about',
  'news',
  'articles',
  'collaborator',
  'ifare',
]);

type CacheEntry = {
  cards: ChatbotCard[];
  expiresAt: number;
  source: 'api' | 'default';
};

let cache: CacheEntry | null = null;
let inFlight: Promise<ChatbotCard[]> | null = null;

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(item => String(item || '').trim()).filter(Boolean);
  }
  // 後台若以「逗號或換行分隔的單一字串」儲存關鍵字，這裡一併吃下
  return String(value || '')
    .split(/[,，\n]/)
    .map(item => item.trim())
    .filter(Boolean);
}

function normalizeLinkKeys(value: unknown): SiteLinkKey[] {
  return [
    ...new Set(
      toStringArray(value).filter((item): item is SiteLinkKey =>
        VALID_LINK_KEYS.has(item as SiteLinkKey),
      ),
    ),
  ].slice(0, 2);
}

/** 把後台回傳的原始資料轉成卡片；欄位不完整的列會被丟掉而不是讓整批失敗 */
function normalizeCard(raw: any): ChatbotCard | null {
  const id = String(raw?.id ?? raw?.Id ?? raw?.cardKey ?? raw?.CardKey ?? '').trim();
  const answer = String(raw?.answer ?? raw?.Answer ?? '').trim();
  if (!id || !answer) return null;

  const keywords = toStringArray(raw?.keywords ?? raw?.Keywords);
  if (!keywords.length) return null;

  // 後端 DataState 是中文常數（啟用／停用／刪除／不限…），不是 0/1 或 true/false。
  // 前台 API 已只回傳啟用中的卡片，這裡是防禦性判斷：只有明確標為停用或刪除才排除。
  const state = String(raw?.state ?? raw?.State ?? '').trim();
  const enabledRaw = raw?.enabled ?? raw?.Enabled;
  const disabledStates = ['停用', '刪除', 'disabled', 'delete', '0', 'false', 'n'];
  const enabled =
    typeof enabledRaw === 'boolean'
      ? enabledRaw
      : state
        ? !disabledStates.includes(state.toLowerCase())
        : true;

  const priority = Number(raw?.priority ?? raw?.Priority);
  const sort = Number(raw?.sort ?? raw?.Sort);

  return {
    id,
    title: String(raw?.title ?? raw?.Title ?? id).trim(),
    keywords,
    answer,
    linkKeys: normalizeLinkKeys(raw?.linkKeys ?? raw?.LinkKeys),
    priority: Number.isFinite(priority) && priority > 0 ? priority : 1,
    enabled,
    sort: Number.isFinite(sort) ? sort : undefined,
  };
}

/**
 * ABP 會把回應包成 { result: <AppService 回傳值> }，
 * 而我們的 DTO 本身又有一層 Result 陣列，所以實際路徑是 payload.result.result。
 * 這裡把各種可能的包裝層級都列出來，取第一個是陣列的。
 */
function extractList(payload: any): any[] {
  const candidates = [
    payload?.result?.result,
    payload?.result?.Result,
    payload?.result?.dataList,
    payload?.result?.items,
    payload?.Result,
    payload?.result,
    payload?.dataList,
    payload?.items,
    payload,
  ];
  return candidates.find(Array.isArray) || [];
}

async function fetchCardsFromApi(baseUrl: string): Promise<ChatbotCard[]> {
  const normalizedBase = baseUrl.replace(/\/$/, '');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(`${normalizedBase}/ChatbotCard/GetEnabledCards`, {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`ChatbotCard API responded with ${response.status}.`);
    }

    const payload = await response.json();
    const cards = extractList(payload)
      .map(normalizeCard)
      .filter((card): card is ChatbotCard => Boolean(card))
      .filter(card => card.enabled !== false);

    if (!cards.length) throw new Error('ChatbotCard API returned no usable cards.');
    return cards;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * 取得目前生效的答案卡。
 * @param baseUrl 後台 API base（runtimeConfig.frontendApiServerBase）
 */
export async function loadCards(baseUrl: string): Promise<ChatbotCard[]> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache.cards;
  if (inFlight) return inFlight;

  if (!baseUrl) {
    cache = { cards: DEFAULT_CARDS, expiresAt: now + CACHE_TTL_MS, source: 'default' };
    return DEFAULT_CARDS;
  }

  inFlight = (async () => {
    try {
      const cards = await fetchCardsFromApi(baseUrl);
      cache = { cards, expiresAt: Date.now() + CACHE_TTL_MS, source: 'api' };
      return cards;
    } catch (error: any) {
      // 後台還沒建好、或暫時連不上：沿用上一份成功的資料，否則用內建預設卡
      const fallback = cache?.source === 'api' ? cache.cards : DEFAULT_CARDS;
      cache = {
        cards: fallback,
        // 失敗時縮短快取，讓後台恢復後能較快接手
        expiresAt: Date.now() + 60 * 1000,
        source: cache?.source === 'api' ? 'api' : 'default',
      };
      console.warn('[chatbot][cards] 改用內建預設卡片：', error?.message || error);
      return fallback;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

/** 供測試與後台儲存後主動失效使用 */
export function invalidateCardCache() {
  cache = null;
}

/** 目前卡片來自後台或內建，供健康檢查與觀測用 */
export function getCardSource(): 'api' | 'default' | 'unknown' {
  return cache?.source ?? 'unknown';
}
