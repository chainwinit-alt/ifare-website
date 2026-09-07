/**
 * 目前狀態：尚未接線（截至 2026-08-26）
 * 全站 pages / components / layouts / app.vue / error.vue 全域搜尋皆無呼叫端，
 * 這支 composable 目前不會被執行。
 *
 * 它原本要做什麼：估算一篇 HTML 內文的閱讀時間（分鐘）。
 * 先去掉標籤與所有空白只算「看得見的中文字數」，以每分鐘 280 字換算，
 * 再把內文圖片各加計 0.2 分鐘（呼叫端沒給 imageCount 就自己數 <img>），
 * 最後無條件進位且下限 1 分鐘，避免短文顯示成「0 分鐘」。
 *
 * 保留原因：使用者決定保留。這是規劃中尚未接上的功能，不是廢棄程式碼，
 * 日後福利專欄／最新消息要顯示「閱讀時間 N 分鐘」時可直接沿用，
 * 請勿因為「查無呼叫端」就刪掉。
 */
const TEXT_CHARS_PER_MINUTE = 280;
const IMAGE_EQUIVALENT_MINUTES = 0.2;

function getVisibleTextLength(content: string) {
  return content
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, '')
    .length;
}

export function useReadingTime() {
  const estimateReadingMinutes = (content: string, imageCount?: number) => {
    const safeContent = content || '';
    const inlineImageCount = imageCount ?? (safeContent.match(/<img\b/gi)?.length || 0);
    const visibleTextLength = getVisibleTextLength(safeContent);
    const estimatedMinutes =
      visibleTextLength / TEXT_CHARS_PER_MINUTE + inlineImageCount * IMAGE_EQUIVALENT_MINUTES;

    return Math.max(1, Math.ceil(estimatedMinutes));
  };

  return {
    estimateReadingMinutes,
  };
}
