<template>
  <!-- 對齊 about.vue purpose-list 卡片設計（icon 上、標題、描述）-->
  <section class="section-dyn-fourcard">
    <h2 v-if="section.title" class="fc-section-title">{{ section.title }}</h2>
    <ul class="fc-list">
      <li
        v-for="(card, i) in section.cards"
        :key="i"
        class="fc-item"
      >
        <span class="fc-icon" aria-hidden="true" v-html="iconSvg(card.icon)"></span>
        <h4 class="fc-item-title">{{ card.title || '(未填標題)' }}</h4>
        <p class="fc-item-desc">{{ card.description || '' }}</p>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { ICON_SVG, type FourCardSection, type IconKey } from '~/types/dynamic-page';

defineProps<{ section: FourCardSection }>();

function iconSvg(key: IconKey): string {
  return ICON_SVG[key] ?? '';
}
</script>

<style lang="scss" scoped>
$c-orange: #EA5504;
$c-orange-light: #FFE6D5;
$c-black: #171818;

.section-dyn-fourcard {
  margin: 48px 0;
}

.fc-section-title {
  text-align: center;
  margin: 0 0 24px;
  font-family: 'Noto Serif TC', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: $c-black;
}

.fc-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: nowrap;
  justify-content: center;
  gap: 16px;
  max-width: 920px;
  width: 100%;
}

.fc-item {
  flex: 1 1 0;
  min-width: 0;
  padding: 20px 18px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  background: rgba(#FFFFFF, 0.7);
  border: 1px solid rgba($c-black, 0.06);
  border-radius: 12px;
  cursor: default;
  will-change: transform;
  box-shadow:
    0 8px 24px -8px rgba($c-black, 0.08),
    inset 0 1px 0 rgba(#FFFFFF, 0.6);
  transition:
    transform 0.32s cubic-bezier(0.32, 0.72, 0, 1),
    box-shadow 0.32s cubic-bezier(0.32, 0.72, 0, 1),
    border-color 0.32s cubic-bezier(0.32, 0.72, 0, 1),
    background 0.32s cubic-bezier(0.32, 0.72, 0, 1);

  &:hover {
    transform: translateY(-4px) scale(1.02);
    background: #FFFFFF;
    border-color: rgba($c-orange, 0.3);
    box-shadow:
      0 16px 36px -10px rgba($c-orange, 0.18),
      inset 0 1px 0 rgba(#FFFFFF, 0.8);

    .fc-icon {
      transform: translateY(-2px) scale(1.05);
      background: $c-orange;
      color: #FFFFFF;
    }
  }
}

.fc-icon {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: $c-orange-light;
  color: $c-orange;
  border-radius: 12px;
  transition: transform 0.25s ease, background 0.25s ease, color 0.25s ease;

  :deep(svg) { width: 22px; height: 22px; }
}

.fc-item-title {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 600;
  color: $c-black;
  line-height: 1.4;
}

.fc-item-desc {
  margin: 0;
  font-size: 14px;
  color: rgba($c-black, 0.7);
  line-height: 1.7;
}

@media (max-width: 768px) {
  .fc-list {
    flex-direction: column;
    flex-wrap: nowrap;
    gap: 14px;
  }
  .fc-item {
    flex-direction: row;
    align-items: flex-start;
  }
}
</style>
