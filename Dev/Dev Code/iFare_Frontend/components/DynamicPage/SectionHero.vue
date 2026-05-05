<template>
  <!-- iFare frontend SectionHero — 用站內既有的 .title-component 全域 class 渲染 -->
  <section class="section-dyn-hero">
    <div class="title-component">
      <i class="ic-title-pattern" aria-hidden="true"></i>
      <h1 class="comp-title">{{ section.title || '(未填標題)' }}</h1>
      <span v-if="section.shadowText" class="comp-shadow">{{ section.shadowText }}</span>
    </div>
    <p v-if="section.subtitle" class="hero-subtitle">{{ section.subtitle }}</p>
  </section>
</template>

<script setup lang="ts">
import type { HeroSection } from '~/types/dynamic-page';

defineProps<{ section: HeroSection }>();
</script>

<style lang="scss" scoped>
.section-dyn-hero {
  margin: 64px 0 56px;
}

.hero-subtitle {
  margin: 24px 0 0;
  font-size: 16px;
  color: rgba(0, 0, 0, 0.65);
  line-height: 1.6;
}
</style>
