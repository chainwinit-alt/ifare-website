<template>
  <div class="dynamic-slug-page">
    <DynamicPageRenderer v-if="page" :page="page" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import DynamicPageRenderer from '~/components/DynamicPage/DynamicPageRenderer.vue';
import { useDynamicPages } from '~/composables/useDynamicPages';

const route = useRoute();
const slug = computed(() => String(route.params.slug || ''));
const { getPageBySlug, isPublishable } = useDynamicPages();

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

useHead(() => ({
  title: page.value?.title || '頁面',
  meta: page.value?.metaDescription
    ? [{ name: 'description', content: page.value.metaDescription }]
    : [],
}));
</script>

<style lang="scss" scoped>
.dynamic-slug-page {
  min-height: 60vh;
  padding: 0 24px 80px;
  background: linear-gradient(180deg, #FFF7F0 0%, #FFFFFF 480px);
}
</style>
