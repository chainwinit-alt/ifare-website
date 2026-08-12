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
  function normalizeSlug(slug: string): string {
    return String(slug || '').replace(/^\/+|\/+$/g, '');
  }

  async function getAllPages(): Promise<DynamicPage[]> {
    // 2026-06-08 UIUX #190 — 以 nuxtApp 快取 in-flight promise，避免同次導航多個元件
    // (AppHeader / [...slug] / DynamicChildLinks 及 getPageBySlug/getChildPages 內部呼叫) 各自重抓 /api/dynamic-pages。
    // server 端 nuxtApp 為 request 範圍、client 端為 app 範圍；失敗時清快取以利重試。
    const nuxtApp = useNuxtApp() as any;
    if (!nuxtApp._dynamicPagesPromise) {
      nuxtApp._dynamicPagesPromise = $fetch<DynamicPage[]>('/api/dynamic-pages')
        .then((all) => (Array.isArray(all) ? all : []));
      nuxtApp._dynamicPagesPromise.catch(() => { nuxtApp._dynamicPagesPromise = null; });
    }
    return nuxtApp._dynamicPagesPromise;
  }

  async function getPageBySlug(slug: string): Promise<DynamicPage | null> {
    const target = normalizeSlug(slug);
    if (!target) return null;
    const all = await getAllPages();
    return all.find((page) => normalizeSlug(page.slug) === target) ?? null;
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

  async function getChildPages(parentKey?: string, parentId?: string): Promise<DynamicPage[]> {
    const all = await getAllPages();
    return all
      .filter((page) => {
        if (!isPublishable(page)) return false;
        if (page.showOnParent === false) return false;
        if (parentId) return page.parentType === 'dynamic' && page.parentId === parentId;
        if (parentKey) return page.parentType === 'system' && page.parentKey === parentKey;
        return false;
      })
      .sort((a, b) => {
        const order = (a.navOrder || 0) - (b.navOrder || 0);
        if (order !== 0) return order;
        return (b.updateDate || '').localeCompare(a.updateDate || '');
      });
  }

  return { getAllPages, getPageBySlug, getChildPages, isPublishable };
}
