const LINE_SHARE_URL = 'https://social-plugins.line.me/lineit/share';

function buildLineShareUrl(url: string) {
  return `${LINE_SHARE_URL}?url=${encodeURIComponent(url)}`;
}

export function useShareToLine() {
  const requestUrl = useRequestURL();

  async function shareCurrentUrlToLine() {
    const currentUrl = import.meta.client ? window.location.href : requestUrl.href;
    const shareUrl = buildLineShareUrl(currentUrl);

    try {
      if (import.meta.client) {
        const popup = window.open(shareUrl, '_blank', 'noopener,noreferrer');
        if (popup) return;
        throw new Error('LINE share popup was blocked');
      }

      await navigateTo(shareUrl, { external: true });
    } catch (error) {
      console.error('[share-to-line] failed', error);
      if (import.meta.client) {
        // 2026-05-25 UIUX #62 / #48 — 改 toast,附下一步建議
        useToast().error('LINE 分享失敗', {
          description: '可能是網路中斷或彈出視窗被阻擋。請檢查網路後重試。',
          duration: 6000,
        });
      }
    }
  }

  return {
    shareCurrentUrlToLine,
  };
}
