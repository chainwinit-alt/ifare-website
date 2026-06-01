/**
 * PageBuilder 前端同步（Day2 升級 — #66 v2 / 2026-05-25 awaitable 化）
 *
 * 後台所有 mutation（insert/update/remove/importJson）會走 writeAll()，
 * 寫完 localStorage 後呼叫此函式把整個 pages 陣列 PUT 到前端 Nuxt server，
 * 前端 server 寫進 server/data/dynamic-pages.json，前端 pages/[slug].vue
 * 透過 useAsyncData 讀取，達成「後台儲存 → 前端可見」。
 *
 * 2026-05-25 起改為 async + return SyncResult：
 *   - writeAll 內部仍 fire-and-forget（只把 promise 記到 lastSyncPromise）
 *   - AddEditView.onSave 可 await waitForLastSync 拿到 ok/error 顯示降級提示
 *   - 不會 throw —— 失敗回 { ok: false, error }，讓 caller 自行決定 UX
 */

import type { DynamicPage } from '@/composables/useDynamicPages';
import { FRONTEND_DYNAMIC_API_TOKEN, FRONTEND_SYNC_URL } from '@/config/adminEnv';

export interface SyncResult {
  ok: boolean;
  error?: string;
}

export async function syncPagesToFrontend(pages: DynamicPage[]): Promise<SyncResult> {
  if (!FRONTEND_SYNC_URL) {
    return { ok: false, error: 'VITE_FRONTEND_SYNC_URL or VITE_FRONTEND_BASE is not configured' };
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (FRONTEND_DYNAMIC_API_TOKEN) {
    headers['X-iFare-Sync-Token'] = FRONTEND_DYNAMIC_API_TOKEN;
  }

  try {
    const res = await fetch(FRONTEND_SYNC_URL, {
      method: 'PUT',
      headers,
      body: JSON.stringify(pages),
    });
    if (!res.ok) {
      return { ok: false, error: `${res.status} ${res.statusText || '同步失敗'}` };
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : '無法連線到前端 dev server';
    console.warn('[frontend-sync] 同步到前端失敗，localStorage 仍寫入成功', err);
    return { ok: false, error: message };
  }
}
