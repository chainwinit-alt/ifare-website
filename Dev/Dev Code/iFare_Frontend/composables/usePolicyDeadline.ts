/**
 * 目前狀態：尚未接線（截至 2026-08-26）
 * 全站 pages / components / layouts / app.vue / error.vue 全域搜尋皆無呼叫端，
 * 這支 composable 目前不會被執行。
 *
 * 它原本要做什麼：把政策的申請截止日（支援 2026/1/5、2026-01-05、2026.1.5 字串或 Date 物件）
 * 換算成「還剩幾天」。刻意只在 0～30 天內回傳結果，已過期或還很遠一律回 null，
 * 讓畫面只在真的快到期時才出現倒數標籤，不會整頁都是提醒；
 * 再依 7 天 / 14 天切成 urgent / soon / normal 三級，供 UI 決定標籤顏色。
 *
 * 保留原因：使用者決定保留。這是規劃中尚未接上的功能，不是廢棄程式碼，
 * 日後政策卡或詳情頁要加倒數標籤時可直接沿用，請勿因為「查無呼叫端」就刪掉。
 */
export interface PolicyDeadlineInfo {
  daysLeft: number;
  label: string;
  level: 'urgent' | 'soon' | 'normal';
}

function parsePolicyDate(value: string | Date | null | undefined) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const matched = value.trim().match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
  if (!matched) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const [, year, month, day] = matched;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function usePolicyDeadline() {
  const getDeadlineInfo = (value: string | Date | null | undefined): PolicyDeadlineInfo | null => {
    const deadline = parsePolicyDate(value);
    if (!deadline) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);

    const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / 86400000);
    if (daysLeft < 0 || daysLeft > 30) return null;

    return {
      daysLeft,
      label: daysLeft === 0 ? '今日截止' : `剩 ${daysLeft} 天截止`,
      level: daysLeft <= 7 ? 'urgent' : daysLeft <= 14 ? 'soon' : 'normal',
    };
  };

  return {
    getDeadlineInfo,
  };
}
