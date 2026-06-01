/**
 * 2026-05-25 UIUX #34 — 已讀標記
 *
 * 使用者點開過的 news/article 詳情頁,在列表頁顯示「已讀」標籤。
 * 純 localStorage,不需登入。每種類型最多記 200 筆(避免無限堆積)。
 */

const MAX_PER_KIND = 200;

export type ReadKind = 'news' | 'articles-welfare' | 'articles-lazy';

function storageKey(kind: ReadKind): string {
  return `ifare:read-marks:${kind}:v1`;
}

function readSet(kind: ReadKind): Set<string> {
  if (!import.meta.client) return new Set();
  try {
    const raw = localStorage.getItem(storageKey(kind));
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr.map(String) : []);
  } catch {
    return new Set();
  }
}

function writeSet(kind: ReadKind, set: Set<string>) {
  if (!import.meta.client) return;
  try {
    // 保留最新 200 筆(insertion order),用 array 寫回
    const arr = Array.from(set).slice(-MAX_PER_KIND);
    localStorage.setItem(storageKey(kind), JSON.stringify(arr));
  } catch {
    /* ignore */
  }
}

export function useReadMarks(kind: ReadKind) {
  const stateKey = `read-marks:${kind}`;
  const read = useState<Set<string>>(stateKey, () => new Set());

  function load() {
    read.value = readSet(kind);
  }

  function markRead(id: string | number) {
    const key = String(id);
    if (!key) return;
    const set = readSet(kind);
    set.add(key);
    writeSet(kind, set);
    read.value = new Set(set);
  }

  function isRead(id: string | number): boolean {
    return read.value.has(String(id));
  }

  function clearAll() {
    writeSet(kind, new Set());
    read.value = new Set();
  }

  return { read, load, markRead, isRead, clearAll };
}
