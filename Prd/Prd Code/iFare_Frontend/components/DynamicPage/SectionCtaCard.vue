<template>
  <!-- 對齊 about 底部 .card-advance 樣式 -->
  <section class="section-dyn-cta">
    <div class="cta-card">
      <div
        v-for="(card, i) in section.cards"
        :key="i"
        class="cta-card-item"
      >
        <span class="cta-info">{{ card.title || '(未填說明)' }}</span>
        <NuxtLink :to="card.ctaUrl || '/'" class="cta-link">
          <span>{{ card.ctaText || '(未填按鈕)' }}</span>
          <i class="ic-arrow-right-primary-dark link-url" aria-hidden="true"></i>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { CtaCardSection } from '~/types/dynamic-page';

defineProps<{ section: CtaCardSection }>();
</script>

<style lang="scss" scoped>
$c-orange: #EA5504;
$c-orange-dark: #C84804;
$c-primary: #00ADB2;
$c-primary-dark: #007D81;
$c-white: #FFFFFF;
$c-black: #171818;

.section-dyn-cta {
  display: flex;
  justify-content: center;
  margin: 48px 0;
}

.cta-card {
  display: inline-flex;
  flex-direction: row;
  justify-content: center;
  gap: 56px;
  padding: 48px 44px 44px;
  border-radius: 8px;
  border: 2px solid $c-white;
  background:
    linear-gradient(95deg, rgba($c-white, 0.05) 0%, rgba($c-orange, 0.05) 100%),
    $c-white;
  box-shadow: 0 8px 24px -8px rgba($c-black, 0.1);
  max-width: 920px;
  width: 100%;
  box-sizing: border-box;
}

.cta-card-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 200px;
}

.cta-info {
  font-size: 14px;
  color: rgba($c-black, 0.85);
  line-height: 1.6;
  min-height: 44px;
}

.cta-link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 6px;
  color: $c-primary-dark;
  font-size: 15px;
  font-weight: 500;
  text-decoration: none;
  border-bottom: 1.5px solid $c-primary-dark;
  align-self: flex-start;
  transition: gap 0.25s ease, color 0.25s ease;

  .ic-arrow-right-primary-dark {
    display: inline-block;
    width: 18px;
    height: 14px;
  }

  &:hover {
    gap: 16px;
    color: $c-primary;
  }

  // 第二個卡片用橘色（對齊 about 設計：第一個 i-Fare 青、第二個 news 橘）
  .cta-card-item:nth-child(even) & {
    color: $c-orange;
    border-bottom-color: $c-orange;
    &:hover { color: $c-orange-dark; }
  }
}

@media (max-width: 768px) {
  .cta-card {
    flex-direction: column;
    padding: 28px 24px 24px;
    gap: 28px;
  }
}
</style>
