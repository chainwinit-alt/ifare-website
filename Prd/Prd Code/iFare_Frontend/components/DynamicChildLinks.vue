<template>
  <section v-if="childPages.length" class="dynamic-child-links" aria-label="延伸頁面">
    <div class="dynamic-child-links__head">
      <span class="dynamic-child-links__eyebrow">更多內容</span>
      <h2>{{ title }}</h2>
      <p v-if="parentLabel" class="dynamic-child-links__parent">顯示於：{{ parentLabel }}</p>
    </div>

    <div class="dynamic-child-links__grid">
      <NuxtLink
        v-for="page in childPages"
        :key="page.id"
        class="dynamic-child-links__item"
        :to="`/${page.slug}`"
      >
        <span v-if="parentLabel" class="dynamic-child-links__badge">{{ parentLabel }} / 子頁</span>
        <span class="dynamic-child-links__title">{{ page.navTitle || page.title || page.slug }}</span>
        <span v-if="page.metaDescription" class="dynamic-child-links__desc">
          {{ page.metaDescription }}
        </span>
        <span class="dynamic-child-links__more">查看內容</span>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDynamicPages } from '~/composables/useDynamicPages';

const props = withDefaults(
  defineProps<{
    parentKey?: string;
    parentId?: string;
    parentLabel?: string;
    title?: string;
  }>(),
  {
    parentKey: '',
    parentId: '',
    parentLabel: '',
    title: '延伸頁面',
  },
);

const { getChildPages } = useDynamicPages();

const { data } = await useAsyncData(
  `dynamic-child-links-${props.parentKey || props.parentId || 'none'}`,
  () => getChildPages(props.parentKey, props.parentId),
);

const childPages = computed(() => data.value || []);
</script>

<style lang="scss" scoped>
.dynamic-child-links {
  width: min(1120px, calc(100% - 40px));
  margin: 32px auto 56px;
}

.dynamic-child-links__head {
  margin-bottom: 20px;
}

.dynamic-child-links__eyebrow {
  display: inline-block;
  margin-bottom: 6px;
  color: #ea5504;
  font-size: 13px;
  font-weight: 700;
}

.dynamic-child-links__head h2 {
  margin: 0;
  color: #171818;
  font-size: 28px;
  line-height: 1.35;
}

.dynamic-child-links__parent {
  margin: 8px 0 0;
  color: rgba(23, 24, 24, 0.62);
  font-size: 14px;
  line-height: 1.6;
}

.dynamic-child-links__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.dynamic-child-links__item {
  min-height: 148px;
  padding: 22px;
  border: 1px solid rgba(23, 24, 24, 0.1);
  border-radius: 8px;
  background: #ffffff;
  color: inherit;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
}

.dynamic-child-links__item:hover {
  border-color: rgba(234, 85, 4, 0.45);
  box-shadow: 0 14px 30px -24px rgba(23, 24, 24, 0.4);
  transform: translateY(-2px);
}

.dynamic-child-links__badge {
  width: fit-content;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(234, 85, 4, 0.1);
  color: #ea5504;
  font-size: 12px;
  font-weight: 700;
}

.dynamic-child-links__title {
  color: #171818;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.45;
}

.dynamic-child-links__desc {
  color: rgba(23, 24, 24, 0.68);
  font-size: 14px;
  line-height: 1.7;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dynamic-child-links__more {
  margin-top: auto;
  color: #ea5504;
  font-size: 14px;
  font-weight: 700;
}

@media (max-width: 768px) {
  .dynamic-child-links {
    width: calc(100% - 32px);
    margin: 28px auto 44px;
  }

  .dynamic-child-links__head h2 {
    font-size: 22px;
  }
}
</style>
