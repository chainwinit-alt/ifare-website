<template>
  <div class="dynamic-slug-page">
    <ClientOnly>
      <template #fallback>
        <div class="dyn-loading">載入中…</div>
      </template>

      <template v-if="page && publishable">
        <DynamicPageRenderer :page="page" />
      </template>
      <template v-else>
        <div class="dyn-missing">
          <h2>找不到這個頁面</h2>
          <p>
            這個網址（<code>/{{ slug }}</code>）目前沒有對應的已發布頁面。<br>
            若是後台剛新增的測試頁，請參考
            <code>docs/iFare_PageBuilder_前端顯示PoC_2026-05-18.md</code>
            的步驟把 JSON 同步到本機 localStorage。
          </p>
          <NuxtLink to="/" class="back-home">回首頁</NuxtLink>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import DynamicPageRenderer from '~/components/DynamicPage/DynamicPageRenderer.vue';
import { useDynamicPages } from '~/composables/useDynamicPages';
import type { DynamicPage } from '~/types/dynamic-page';

const route = useRoute();
const slug = computed(() => String(route.params.slug || ''));
const page = ref<DynamicPage | null>(null);
const { getPageBySlug, isPublishable } = useDynamicPages();
const publishable = computed(() => isPublishable(page.value));

function refresh() {
  page.value = getPageBySlug(slug.value);
}

onMounted(refresh);
watch(slug, refresh);

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

.dyn-loading,
.dyn-missing {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 96px 16px;
  text-align: center;
  color: rgba(0, 0, 0, 0.6);
}

.dyn-missing {
  h2 {
    margin: 0 0 16px;
    font-size: 22px;
    color: #171818;
  }

  p {
    margin: 0 0 24px;
    font-size: 14px;
    line-height: 1.7;
    color: rgba(0, 0, 0, 0.55);
    max-width: 560px;

    code {
      background: rgba(0, 0, 0, 0.06);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 13px;
    }
  }

  .back-home {
    display: inline-block;
    padding: 10px 24px;
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: 999px;
    font-size: 14px;
    color: #171818;
    text-decoration: none;
    transition: background 0.2s;

    &:hover {
      background: rgba(0, 0, 0, 0.04);
    }
  }
}
</style>
