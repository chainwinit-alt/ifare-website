/**
 * PageBuilder 前端同步（Day2 升級 — #66 v2）
 *
 * 後台所有 mutation（insert/update/remove/importJson）會走 writeAll()，
 * 寫完 localStorage 後 fire-and-forget 呼叫此函式把整個 pages 陣列 PUT 到
 * 前端 Nuxt server，前端 server 寫進 server/data/dynamic-pages.json，
 * 前端 pages/[slug].vue 透過 useAsyncData 讀取，達成「後台儲存 → 前端可見」。
 *
 * 失敗 console.warn 不 throw —— 儲存體驗不該被前端是否啟動拖累。
 */

import type { DynamicPage } from '@/composables/useDynamicPages';

const FRONTEND_SYNC_URL =
  (import.meta.env.VITE_FRONTEND_SYNC_URL as string | undefined) ||
  'http://localhost:3000/api/dynamic-pages';

export function syncPagesToFrontend(pages: DynamicPage[]): void {
  // fire-and-forget — 不 await，不阻塞 caller
  fetch(FRONTEND_SYNC_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pages),
  }).catch((err) => {
    console.warn('[frontend-sync] 同步到前端失敗，localStorage 仍寫入成功', err);
  });
}
