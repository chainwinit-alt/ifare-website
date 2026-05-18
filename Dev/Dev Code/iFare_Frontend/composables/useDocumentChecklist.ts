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
