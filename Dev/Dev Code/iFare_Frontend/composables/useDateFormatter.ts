const displayDateFormatter = new Intl.DateTimeFormat('zh-TW', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function normalizeDateInput(value: string | Date): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return null;
  }

  const matched = normalizedValue.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
  if (matched) {
    const [, year, month, day] = matched;
    const normalizedDate = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(normalizedDate.getTime()) ? null : normalizedDate;
  }

  const parsedDate = new Date(normalizedValue);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

export function useDateFormatter() {
  const formatDisplayDate = (value: string | Date | null | undefined) => {
    if (!value) {
      return '';
    }

    const normalizedDate = normalizeDateInput(value);
    if (!normalizedDate) {
      return typeof value === 'string' ? value : '';
    }

    return displayDateFormatter
      .formatToParts(normalizedDate)
      .filter((part) => part.type !== 'literal')
      .map((part) => part.value)
      .join('.');
  };

  return {
    formatDisplayDate,
  };
}
