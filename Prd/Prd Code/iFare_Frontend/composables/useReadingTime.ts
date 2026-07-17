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
