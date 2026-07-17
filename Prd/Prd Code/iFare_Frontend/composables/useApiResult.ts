type ApiEnvelope<T = unknown> = {
  result?: {
    result?: T;
  } | null;
} | null | undefined;

export function useApiResult() {
  function getApiResultValue<T>(response: ApiEnvelope<T>) {
    return (response?.result?.result ?? null) as T | null;
  }

  function getApiResultArray<T>(response: ApiEnvelope<T[]>) {
    const value = getApiResultValue(response);
    return Array.isArray(value) ? value : [];
  }

  function getApiResultItem<T>(response: ApiEnvelope<T | T[]>) {
    const value = getApiResultValue(response);

    if (Array.isArray(value)) {
      return (value[0] ?? null) as T | null;
    }

    if (value && typeof value === 'object') {
      return value as T;
    }

    return null;
  }

  return {
    getApiResultValue,
    getApiResultArray,
    getApiResultItem,
  };
}
