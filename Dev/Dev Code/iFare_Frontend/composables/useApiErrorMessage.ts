type ApiErrorLike = {
  category?: string;
  status?: number;
  message?: string;
} | null | undefined;

export function useApiErrorMessage() {
  function getApiErrorMessage(error: ApiErrorLike, fallback: string) {
    const category = error?.category ?? 'unknown';
    const status = error?.status ?? 0;

    if (category === 'timeout') {
      return '請求逾時，伺服器可能正在忙碌，請稍後再試一次。';
    }

    if (category === 'network') {
      return '網路連線異常，請確認網路後重新載入。';
    }

    if (category === 'server' || status >= 500) {
      return '伺服器目前暫時無法回應，請稍後再試。';
    }

    if (category === 'client') {
      if (status === 401 || status === 403) {
        return '目前沒有權限存取這筆資料，請稍後重新整理或聯絡管理者。';
      }
      if (status === 404) {
        return '找不到對應資料，請重新整理後再試。';
      }

      return error?.message || '請求格式有誤，請稍後再試。';
    }

    return error?.message || fallback;
  }

  return {
    getApiErrorMessage,
  };
}
