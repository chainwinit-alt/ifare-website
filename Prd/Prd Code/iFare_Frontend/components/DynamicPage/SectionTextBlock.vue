<template>
  <section class="section-dyn-text">
    <h2 v-if="section.title" class="text-block-title">{{ section.title }}</h2>
    <p
      v-for="(p, i) in section.paragraphs"
      :key="i"
      class="text-block-paragraph"
    >{{ p || ' ' }}</p>
  </section>
</template>

<script setup lang="ts">
import type { TextSectionSection } from '~/types/dynamic-page';

defineProps<{ section: TextSectionSection }>();
</script>

<style lang="scss" scoped>
$c-orange: #EA5504;
$c-black: #171818;

.section-dyn-text {
  margin: 32px 0;
  max-width: 720px;
}

.text-block-title {
  position: relative;
  margin: 0 0 18px;
  padding-left: 14px;
  font-family: 'Noto Serif TC', sans-serif;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.4;
  color: $c-black;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 6px;
    bottom: 6px;
    width: 4px;
    background: $c-orange;
    border-radius: 2px;
  }
}

.text-block-paragraph {
  margin: 0 0 14px;
  font-size: 15px;
  line-height: 1.85;
  color: rgba($c-black, 0.85);
  white-space: pre-wrap;
}
</style>
