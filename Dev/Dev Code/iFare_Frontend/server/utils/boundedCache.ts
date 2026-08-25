/**
 * 有上限的 TTL 快取（行程內記憶體）。
 *
 * 給那些以「整包請求內容」當 key 的伺服器端快取用（search-intent、collaborator-search）。
 * 舊寫法是裸 Map，沒有筆數上限、沒有過期清掃——不同 query 連打就只增不減直到 OOM。
 * 這裡用 Map 的插入順序當近似 LRU：每次命中先 delete 再 set 把它移到最後，寫入時若超過
 * 上限就淘汰最前面（最久沒被用到）的。與 utils/llm/freeTier.ts 既有的做法一致。
 */
export interface BoundedTtlCache<T> {
  get(key: string): T | undefined;
  set(key: string, value: T): void;
  delete(key: string): void;
  readonly size: number;
}

export function createBoundedTtlCache<T>(options: {
  max: number;
  ttlMs: number;
}): BoundedTtlCache<T> {
  const { max, ttlMs } = options;
  const store = new Map<string, { value: T; expiresAt: number }>();

  return {
    get(key) {
      const entry = store.get(key);
      if (!entry) return undefined;
      if (entry.expiresAt <= Date.now()) {
        store.delete(key);
        return undefined;
      }
      // 命中就移到最後，維持「最久未使用在最前」的順序
      store.delete(key);
      store.set(key, entry);
      return entry.value;
    },

    set(key, value) {
      if (store.has(key)) store.delete(key);
      store.set(key, { value, expiresAt: Date.now() + ttlMs });

      while (store.size > max) {
        const oldest = store.keys().next().value;
        if (oldest === undefined) break;
        store.delete(oldest);
      }
    },

    delete(key) {
      store.delete(key);
    },

    get size() {
      return store.size;
    },
  };
}
