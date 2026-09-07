import { IFARE_LAST_UNLOAD_URL_KEY } from "~/utils/ifareSummaryCache";

/**
 * 記下「離開這一頁時的網址」，用來分辨重新整理與站內往返。
 *
 * i-Fare 站內連到政策明細時會整頁重載（政策卡連結上的 reload 參數就是為此），
 * 所以 performance 回報的導覽類型在「點進明細」與「按上一頁回來」時都是 reload，
 * 分不出使用者到底按了什麼。改用這個判斷：載入的網址與上一次離開的網址相同 =
 * 重新整理；不同 = 從別的頁面過來的。
 *
 * 放在 plugin 而不是結果頁，是因為離開政策明細頁時也要記，不然從明細返回結果頁
 * 會比對到更早以前留下的結果頁網址，被誤判成重新整理。
 */
export default defineNuxtPlugin(() => {
  if (!process.client) return;

  const remember = () => {
    try {
      sessionStorage.setItem(IFARE_LAST_UNLOAD_URL_KEY, location.href);
    } catch {
      // 無痕模式等情境下 sessionStorage 可能不能寫；記不到就退回「不當成重新整理」
    }
  };

  window.addEventListener("pagehide", remember);
});
