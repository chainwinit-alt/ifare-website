<template>
  <div class="dynamic-slug-page">
    <nav v-if="page && parentLocation" class="dynamic-slug-page__placement" aria-label="頁面顯示位置">
      <span>{{ parentLocationText }}</span>
      <NuxtLink :to="parentLocation.path">{{ parentLocation.label }}</NuxtLink>
    </nav>
    <DynamicPageRenderer v-if="page" :page="page" />
    <DynamicChildLinks
      v-if="page"
      :parent-id="page.id"
      :parent-label="page.title"
      :title="`更多${page.title}`"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import DynamicChildLinks from '~/components/DynamicChildLinks.vue';
import DynamicPageRenderer from '~/components/DynamicPage/DynamicPageRenderer.vue';
import { useDynamicPages } from '~/composables/useDynamicPages';

interface ParentLocation {
  label: string;
  path: string;
}

const SYSTEM_PARENT_LINKS: Record<string, ParentLocation> = {
  about: { label: '關於長穩', path: '/about' },
  news: { label: '最新消息', path: '/news' },
  articles: { label: '福利專欄', path: '/articles' },
  collaborator: { label: '公益夥伴', path: '/collaborator' },
  // 未來規劃暫時註解，避免動態頁顯示到此父頁。
  // future: { label: '未來規劃', path: '/future' },
  ifare: { label: 'i-Fare', path: '/ifare' },
};

const route = useRoute();
const slug = computed(() => {
  const value = route.params.slug;
  return Array.isArray(value) ? value.join('/') : String(value || '');
});
const { getAllPages, getPageBySlug, isPublishable } = useDynamicPages();

const { data: page } = await useAsyncData(
  'dynamic-page',
  async () => {
    const result = await getPageBySlug(slug.value);
    return isPublishable(result) ? result : null;
  },
  { watch: [slug] },
);

if (!page.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page not found',
    fatal: false,
  });
}

const { data: parentLocation } = await useAsyncData(
  'dynamic-page-parent-location',
  async () => {
    const current = page.value ?? await getPageBySlug(slug.value);
    if (!current) return null;

    if (current.parentType === 'system' && current.parentKey) {
      return SYSTEM_PARENT_LINKS[current.parentKey] ?? null;
    }

    if (current.parentType === 'dynamic' && current.parentId) {
      const allPages = await getAllPages();
      const parent = allPages.find((item) => item.id === current.parentId);
      if (!parent) return null;

      return {
        label: parent.navTitle || parent.title || parent.slug,
        path: `/${parent.slug}`,
      };
    }

    return null;
  },
  { watch: [slug] },
);

const parentLocationText = computed(() => page.value?.showOnParent === false ? '歸屬於' : '顯示於');
useContentSocialTitle(() => page.value?.title);

useHead(() => ({
  title: page.value?.title || '頁面',
  meta: page.value?.metaDescription
    ? [
        { name: 'description', content: page.value.metaDescription },
        { property: 'og:description', content: page.value.metaDescription },
        { name: 'twitter:description', content: page.value.metaDescription },
      ]
    : [],
}));
</script>

<style lang="scss" scoped>
.dynamic-slug-page {
  min-height: 60vh;
  padding: 0 24px 80px;
  background: linear-gradient(180deg, #FFF7F0 0%, #FFFFFF 480px);
}

.dynamic-slug-page__placement {
  width: min(1120px, 100%);
  margin: 0 auto 16px;
  padding-top: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(23, 24, 24, 0.62);
  font-size: 14px;
  line-height: 1.6;
}

.dynamic-slug-page__placement a {
  color: #ea5504;
  font-weight: 700;
  text-decoration: none;
}

.dynamic-slug-page__placement a:hover {
  text-decoration: underline;
}
</style>
