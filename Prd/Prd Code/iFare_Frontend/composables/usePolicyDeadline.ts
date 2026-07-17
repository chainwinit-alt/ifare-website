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
