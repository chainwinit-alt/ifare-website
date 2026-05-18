/**
 * 前端讀取 PageBuilder 動態頁面（PoC）
 *
 * PoC 階段資料來源：localStorage key `iFare_dynamic_pages_v2`
 *   - 後台 (iFare_Backend) 於 PageBuilder 編輯後存入同名 key
 *   - 跨域不共享 → demo 流程：後台「複製 JSON」→ 前端 devtools localStorage.setItem
 * 之後接後端 API：把 readPages() 內部改成 useFetch，呼叫端不用變。
 */

import type { DynamicPage } from '~/types/dynamic-page';

const STORAGE_KEY = 'iFare_dynamic_pages_v2';

function readPages(): DynamicPage[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as DynamicPage[]) : [];
  } catch {
    return [];
  }
}

export function useDynamicPages() {
  function getPageBySlug(slug: string): DynamicPage | null {
    const target = slug.replace(/^\//, '');
    return readPages().find((page) => page.slug === target) ?? null;
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
