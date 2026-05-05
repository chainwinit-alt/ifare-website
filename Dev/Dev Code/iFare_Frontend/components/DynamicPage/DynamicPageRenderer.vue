<template>
  <!-- 主分派器：依 section.type 渲染對應元件 -->
  <div class="dynamic-page-renderer">
    <template v-for="s in page.sections" :key="s.id">
      <SectionHero v-if="s.type === 'hero'" :section="s" />
      <SectionTextBlock v-else-if="s.type === 'text-section'" :section="s" />
      <SectionFourCard v-else-if="s.type === 'four-card'" :section="s" />
      <SectionImageText v-else-if="s.type === 'image-text'" :section="s" />
      <SectionCtaCard v-else-if="s.type === 'cta-card'" :section="s" />
    </template>

    <div v-if="page.sections.length === 0" class="dyn-empty">
      尚未新增任何區段
    </div>
  </div>
</template>

<script setup lang="ts">
import SectionHero from './SectionHero.vue';
import SectionTextBlock from './SectionTextBlock.vue';
import SectionFourCard from './SectionFourCard.vue';
import SectionImageText from './SectionImageText.vue';
import SectionCtaCard from './SectionCtaCard.vue';
import type { DynamicPage } from '~/types/dynamic-page';

defineProps<{ page: DynamicPage }>();
</script>

<style lang="scss" scoped>
.dynamic-page-renderer {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.dyn-empty {
  padding: 96px 16px;
  text-align: center;
  color: rgba(0, 0, 0, 0.4);
  font-size: 14px;
}
</style>
