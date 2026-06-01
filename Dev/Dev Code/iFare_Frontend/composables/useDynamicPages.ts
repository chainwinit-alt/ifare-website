/**
 * 前端讀取 PageBuilder 動態頁面（PoC v2 — 自動同步）
 *
 * 資料來源：GET /api/dynamic-pages（Nuxt server route 讀 server/data/dynamic-pages.json）
 *   - 後台 (5173) 儲存 → fire-and-forget PUT 到此 endpoint → 寫檔
 *   - 前端 (3000) 讀同檔，SSR 階段就能拿到資料
 * 之後接 .NET API：只要把 $fetch URL 改成後端就好，呼叫端不用變。
 */

import type { DynamicPage } from '~/types/dynamic-page';

export function useDynamicPages() {
  async function getPageBySlug(slug: string): Promise<DynamicPage | null> {
    const target = slug.replace(/^\//, '');
    if (!target) return null;
    const all = await $fetch<DynamicPage[]>('/api/dynamic-pages');
    return all.find((page) => page.slug === target) ?? null;
  }

  function isPublishable(page: DynamicPage | null): page is DynamicPage {
    if (!page) return false;
    if (page.status !== 'published') return false;
    const now = Date.now();
    if (page.publishTime) {
      const start = new Date(page.publishTime).getTime();
      if (!Number.isNaN(start) && now < start) return false;
    }
    if (page.unpublishTime) {
      const end = new Date(page.unpublishTime).getTime();
      if (!Number.isNaN(end) && now >= end) return false;
    }
    return true;
  }

  return { getPageBySlug, isPublishable };
}
