/**
 * 目前狀態：尚未接線（截至 2026-08-26）
 * 全站 pages / components / layouts / app.vue / error.vue 全域搜尋皆無呼叫端，
 * 這支 composable 目前不會被執行。
 *
 * 它原本要做什麼：把後台以 HTML 撰寫的「應備文件」欄位，拆成可逐項打勾的清單。
 * 因為後台內容格式不固定，這裡先把 <br> / </p> / <li> 還原成換行再去掉標籤與 &nbsp; 等實體，
 * 接著用換行、全形「；」與半形「;」斷行，並剝掉「一、」「1.」「-」「•」這類項目符號，
 * 讓每一行都是乾淨的文件名稱；最後去重並最多取 20 筆，
 * 避免後台貼了一大段說明時把畫面撐爆。
 *
 * 保留原因：使用者決定保留。這是規劃中尚未接上的功能，不是廢棄程式碼，
 * 日後政策詳情頁要做「應備文件檢核表」時可直接沿用，請勿因為「查無呼叫端」就刪掉。
 */
export interface DocumentChecklistItem {
  id: string;
  text: string;
}

function stripHtml(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n')
    .replace(/<\/li>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .trim();
}

export function useDocumentChecklist() {
  const parseDocumentChecklist = (value: string | null | undefined): DocumentChecklistItem[] => {
    const text = stripHtml(value ?? '');
    if (!text) return [];

    const candidates = text
      .split(/\n|；|;/)
      .map((line) =>
        line
          .replace(/^[\s　]*[0-9一二三四五六七八九十]+[、.)．]/, '')
          .replace(/^[\s　]*[-*•]/, '')
          .trim(),
      )
      .filter((line) => line.length >= 2);

    const uniqueItems = Array.from(new Set(candidates));
    return uniqueItems.slice(0, 20).map((text, index) => ({
      id: `document-${index}`,
      text,
    }));
  };

  return {
    parseDocumentChecklist,
  };
}
