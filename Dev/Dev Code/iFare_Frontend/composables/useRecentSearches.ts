/**
 * 目前狀態：尚未接線（截至 2026-08-26）
 * 全站 pages / components / layouts / app.vue / error.vue 全域搜尋皆無呼叫端，
 * 下面 UIUX #5 描述的「搜尋首頁快速回填 chips」目前並沒有任何頁面在用，
 * load / add / remove / clear 都不會被觸發，localStorage 裡也不會有資料。
 *
 * 保留原因：使用者決定保留。UIUX #5 是規劃中尚未接上的需求，不是廢棄程式碼，
 * 日後 i-Fare 搜尋首頁要接回最近搜尋時可直接沿用，請勿因為「查無呼叫端」就刪掉。
 */

/**
 * 2026-05-25 UIUX #5 — 最近搜尋紀錄
 *
 * 儲存使用者最近 5 筆搜尋條件到 localStorage,在 ifare 搜尋首頁顯示快速回填 chips。
 * 同樣的搜尋條件不會重複,新搜尋自動移到最前。
 */

const STORAGE_KEY = 'ifare:recent-searches:v1';
const MAX_ITEMS = 5;

export interface RecentSearch {
  /** 顯示用的 label,例如「老人福利 · 65 歲以上 · 台北市」或「育兒津貼」 */
  label: string;
  /** query string params 用於回填 + push 路由 */
  query: {
    policy?: string;
    recipient?: string;
    area?: string;
    query?: string;
    event?: string;
    CodePolicy?: string;
    CodeRecipient?: string;
    CodeDomicile?: string;
    Query?: string;
    LifeEvent?: string;
  };
  /** label 給 select 顯示用(避免回填時找不到 id 對應的中文名) */
  labels?: {
    policy?: string;
    recipient?: string;
    area?: string;
  };
  /** 記錄時間 */
  timestamp: number;
}

function readAll(): RecentSearch[] {
  if (!import.meta.client) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(items: RecentSearch[]) {
  if (!import.meta.client) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    /* localStorage 滿了或被禁用,靜默失敗 */
  }
}

/** 比對兩筆搜尋是否等同(用 query 內容比) */
function isSameSearch(a: RecentSearch, b: RecentSearch): boolean {
  const ka = JSON.stringify(a.query);
  const kb = JSON.stringify(b.query);
  return ka === kb;
}

export function useRecentSearches() {
  const items = useState<RecentSearch[]>('ifare-recent-searches', () => []);

  /** 從 localStorage 讀入(用於 onMounted 或 page enter) */
  function load() {
    items.value = readAll();
  }

  /** 加一筆新搜尋(自動 dedup + 移到最前) */
  function add(record: Omit<RecentSearch, 'timestamp'>) {
    if (!record.label || !record.label.trim()) return;
    const next: RecentSearch = { ...record, timestamp: Date.now() };
    const list = readAll().filter((it) => !isSameSearch(it, next));
    list.unshift(next);
    const trimmed = list.slice(0, MAX_ITEMS);
    writeAll(trimmed);
    items.value = trimmed;
  }

  /** 移除單筆 */
  function remove(index: number) {
    const list = readAll();
    list.splice(index, 1);
    writeAll(list);
    items.value = list;
  }

  /** 清空全部 */
  function clear() {
    writeAll([]);
    items.value = [];
  }

  return { items, load, add, remove, clear };
}
