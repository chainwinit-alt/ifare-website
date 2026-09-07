const SITE_NAME = '長穩社福慈善基金會';
const DEFAULT_DESCRIPTION = '認識長穩社福慈善基金會，掌握最新消息、福利專欄與公益夥伴資訊，透過 i-Fare 查找福利政策。';

const PAGE_META: Record<string, { title: string; description: string; article?: boolean }> = {
  '/': { title: SITE_NAME, description: DEFAULT_DESCRIPTION },
  '/about': { title: '關於長穩', description: '認識長穩社福慈善基金會的成立背景、使命與宗旨，以及環境保育、人才培育、社會關懷三大核心行動。' },
  '/news': { title: '最新消息', description: '掌握長穩社福慈善基金會的最新消息、活動公告與服務動態。' },
  '/news/info': { title: '最新消息文章', description: '閱讀長穩社福慈善基金會的消息與活動內容，了解公告詳情及相關資訊。', article: true },
  '/articles': { title: '福利專欄', description: '閱讀福利專欄與懶人包，了解福利政策、補助資訊及相關服務。' },
  '/articles/welfare': { title: '福利專欄文章', description: '閱讀本站福利專欄，了解文章介紹的福利資訊、政策說明及相關資源。', article: true },
  '/articles/lazy': { title: '福利懶人包', description: '查看本站整理的福利懶人包與相關說明，掌握福利資訊重點。', article: true },
  '/collaborator': { title: '公益夥伴', description: '認識長穩基金會的公益夥伴，查詢相關機構與服務資訊。' },
  '/ifare': { title: 'i-Fare 福利好幫手', description: '依受助者情況、年齡、戶籍地與關鍵字查找福利政策，了解申請資格與洽辦資訊。' },
  '/ifare/result': { title: 'i-Fare 政策搜尋結果', description: '檢視福利政策搜尋結果，查看政策的適用地區、資格條件與詳細內容。' },
  '/ifare/info': { title: 'i-Fare 福利政策內容', description: '查看福利政策的適用對象、申請資格與洽辦資訊，實際規定請以主管機關公告為準。', article: true },
  '/ifare/contact': { title: 'i-Fare 洽辦單位', description: '查看福利政策洽辦單位的聯絡電話、地址與相關服務資訊。' },
  '/future': { title: '未來規劃', description: '了解長穩社福慈善基金會的未來規劃與服務方向。' },
  '/preview': { title: '頁面預覽', description: '長穩社福慈善基金會網站內容預覽。' },
};

export function useSiteSocialMeta(siteUrl: string) {
  const route = useRoute();
  const origin = new URL(siteUrl || useRequestURL().origin).origin;
  const imageUrl = `${origin}/og-logo-safe-20260903.png`;

  useHead(() => {
    const pathname = route.path.replace(/\/+$/, '') || '/';
    const page: (typeof PAGE_META)[string] = PAGE_META[pathname] || {
      title: typeof route.meta.title === 'string' ? route.meta.title : SITE_NAME,
      description: DEFAULT_DESCRIPTION,
    };
    const title = page.title === SITE_NAME ? SITE_NAME : `${page.title}｜${SITE_NAME}`;
    const url = new URL(origin);
    url.pathname = pathname;
    // Keep content IDs and search filters, but not reload or tracking parameters.
    for (const [key, value] of Object.entries(route.query)) {
      if (['reload', 'preview', 'fbclid', 'gclid'].includes(key) || key.startsWith('utm_')) continue;
      for (const item of Array.isArray(value) ? value : [value]) {
        if (item != null) url.searchParams.append(key, String(item));
      }
    }
    return {
      meta: [
        { name: 'description', content: page.description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: page.description },
        { property: 'og:type', content: page.article ? 'article' : 'website' },
        { property: 'og:site_name', content: SITE_NAME },
        { property: 'og:locale', content: 'zh_TW' },
        { property: 'og:url', content: url.href },
        { property: 'og:image', content: imageUrl },
        ...(imageUrl.startsWith('https://') ? [{ property: 'og:image:secure_url', content: imageUrl }] : []),
        { property: 'og:image:type', content: 'image/png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: `${SITE_NAME} Logo` },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: page.description },
        { name: 'twitter:image', content: imageUrl },
        { name: 'twitter:image:alt', content: `${SITE_NAME} Logo` },
        ...(pathname === '/preview' ? [{ name: 'robots', content: 'noindex, nofollow' }] : []),
      ],
      link: [{ rel: 'canonical', href: url.href }],
    };
  });
}

// Reuse already-loaded page data without adding a request just for social tags.
export function useContentSocialTitle(getTitle: () => unknown) {
  useHead(() => {
    const title = String(getTitle() || '').trim();
    return title ? {
      title,
      meta: [
        { property: 'og:title', content: title },
        { name: 'twitter:title', content: title },
      ],
    } : {};
  });
}
