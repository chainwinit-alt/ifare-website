// AI 摘要卡的分頁快取（摘要本文、引導欄位、追問對話）。
// key 由篩選條件算出來，值存在 sessionStorage，所以只活在這一個分頁裡。
export const IFARE_SUMMARY_CACHE_PREFIX = "ifare-summary-cache:";

/** 清掉這一分頁所有的摘要快取（含追問對話） */
export function clearIFareSummaryCaches() {
  if (typeof sessionStorage === "undefined") return;
  Object.keys(sessionStorage)
    .filter((key) => key.startsWith(IFARE_SUMMARY_CACHE_PREFIX))
    .forEach((key) => sessionStorage.removeItem(key));
}

// ---------------------------------------------------------------------------
// 「這次是不是按了重新整理」
//
// 不能用 performance 的導覽類型：i-Fare 連到政策明細時會整頁重載（政策卡連結上的
// reload 參數就是為此），所以「點進明細」與「按上一頁回來」都會回報 reload，
// 跟真的按重新整理長得一模一樣——實測就是這樣，條件會被誤清。
//
// 改成比對網址：plugins/ifareNavigation.client.ts 會在每次離開頁面時記下當時的
// 網址，這次載入的網址與它相同 = 使用者在原地重新整理；不同 = 從別的頁面過來的。
// ---------------------------------------------------------------------------
export const IFARE_LAST_UNLOAD_URL_KEY = "ifare-last-unload-url";

let reloadConsumed = false;

/**
 * 使用者是不是「在這一頁按了重新整理」。同一份文件只會回報一次 true。
 *
 * 分享出去的連結、從政策明細返回結果頁都不算——那些情況把條件清掉，
 * 會讓人找不到剛剛在看的東西。
 */
export function consumeReloadNavigation() {
  if (reloadConsumed) return false;
  reloadConsumed = true;

  if (typeof sessionStorage === "undefined" || typeof location === "undefined") return false;

  // 網址與上一次離開時相同，代表使用者停在原地。但「原地」還有另一種可能：
  // 從別的頁按上一頁整頁載回這一頁時，網址也會對上。所以要再看導覽類型。
  const lastUnloadUrl = sessionStorage.getItem(IFARE_LAST_UNLOAD_URL_KEY);
  if (!lastUnloadUrl || lastUnloadUrl !== location.href) return false;

  // 站內連結已經全部改成 SPA 導覽（不再帶 reload 參數強制整頁重載），
  // 導覽類型因此重新變得可信：只有真的按了重新整理才會是 reload。
  // back_forward 代表使用者按的是上一頁，那時清空條件會讓他找不到剛剛在看的東西。
  if (typeof performance === "undefined") return true;
  const entries = performance.getEntriesByType?.("navigation") as
    | PerformanceNavigationTiming[]
    | undefined;
  if (entries && entries.length) return entries[0].type === "reload";

  // 舊瀏覽器沒有 navigation timing level 2，退回已淘汰的 performance.navigation
  const legacy = (performance as any).navigation;
  return legacy ? legacy.type === 1 : true;
}
