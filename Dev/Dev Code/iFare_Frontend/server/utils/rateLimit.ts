import type { H3Event } from "h3";

/**
 * 取用戶端識別（給限流當 key）。
 *
 * 本站部署在 IIS 反向代理之後（IIS → 127.0.0.1:3000），所以 socket 位址永遠是
 * loopback，必須看 X-Forwarded-For。但 XFF 的「第一段」是用戶端自己送來的、可任意
 * 偽造——舊寫法取第一段，等於每換一個假 IP 就繞過一次限流。反向代理會把它實際看到
 * 的來源「附加在最後」，所以取最後一段才是可信的。
 *
 * 前提：只有一層我們自己的反向代理。若日後有多層代理，要改成從右邊數第 N 段。
 */
export function getClientKey(event: H3Event): string {
  const forwardedFor = String(getHeader(event, "x-forwarded-for") || "");
  if (forwardedFor.trim()) {
    const parts = forwardedFor
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }

  const realIp = String(getHeader(event, "x-real-ip") || "").trim();
  if (realIp) return realIp;

  return event.node?.req?.socket?.remoteAddress || "unknown";
}

export interface RateLimitResult {
  allowed: boolean;
  /** 超限時建議的重試秒數（未超限為 0） */
  retryAfter: number;
  /** 這個視窗內還剩幾次 */
  remaining: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/** 單一行程能追蹤的 key 上限，避免大量不同 key（含偽造來源）把 Map 撐爆 */
const MAX_TRACKED_KEYS = 5000;

/**
 * 固定視窗限流器（行程內記憶體）。
 *
 * 跟舊的行內實作差在兩點：(1) 會在每個視窗週期清掉過期項，並在超過硬上限時淘汰最舊的，
 * 不再只增不減；(2) 搭配 getClientKey 用可信來源當 key。多實例部署時仍是各行程獨立，
 * 要跨實例得換成共用儲存（Redis 等），但單實例下這樣就能擋住腳本連打。
 */
export function createRateLimiter(options: { windowMs: number; max: number }) {
  const { windowMs, max } = options;
  const store = new Map<string, RateLimitEntry>();
  let lastSweepAt = 0;

  function sweep(now: number) {
    if (now - lastSweepAt < windowMs) return;
    lastSweepAt = now;

    for (const [key, entry] of store) {
      if (entry.resetAt <= now) store.delete(key);
    }

    // 即使全部都還沒過期，也不讓 Map 無限成長：淘汰插入順序最舊的那些
    if (store.size > MAX_TRACKED_KEYS) {
      const excess = store.size - MAX_TRACKED_KEYS;
      let removed = 0;
      for (const key of store.keys()) {
        if (removed >= excess) break;
        store.delete(key);
        removed += 1;
      }
    }
  }

  return function check(key: string): RateLimitResult {
    const now = Date.now();
    sweep(now);

    const current = store.get(key);
    if (!current || current.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, retryAfter: 0, remaining: max - 1 };
    }

    current.count += 1;
    if (current.count <= max) {
      return { allowed: true, retryAfter: 0, remaining: max - current.count };
    }

    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
      remaining: 0,
    };
  };
}
