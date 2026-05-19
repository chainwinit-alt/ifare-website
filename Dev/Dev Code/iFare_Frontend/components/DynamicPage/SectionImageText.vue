<template>
  <section
    class="section-dyn-image-text"
    :class="{ 'image-right': section.imagePosition === 'right' }"
  >
    <div class="it-image">
      <img
        v-if="resolvedImageSrc && !imageLoadFailed"
        :src="resolvedImageSrc"
        :alt="section.imageAlt"
        loading="lazy"
        @error="imageLoadFailed = true"
      />
      <div v-else class="it-image-placeholder">
        {{ section.imageSrc ? '圖片路徑無法載入' : '(尚未指定圖片)' }}
      </div>
    </div>
    <div class="it-content">
      <h2 class="it-title">{{ section.title || '(未填標題)' }}</h2>
      <p class="it-paragraph">{{ section.content || '' }}</p>
      <NuxtLink
        v-if="section.ctaText && section.ctaUrl"
        :to="section.ctaUrl"
        class="it-cta"
      >
        <span>{{ section.ctaText }}</span>
        <i class="ic-arrow-right-orange link-url" aria-hidden="true"></i>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { ImageTextSection } from '~/types/dynamic-page';
import { resolveDynamicImageSrc } from '~/utils/dynamicImage';

const props = defineProps<{ section: ImageTextSection }>();
const imageLoadFailed = ref(false);
const resolvedImageSrc = computed(() => resolveDynamicImageSrc(props.section.imageSrc));

watch(
  () => props.section.imageSrc,
  () => {
    imageLoadFailed.value = false;
  },
);
</script>

<style lang="scss" scoped>
$c-orange: #EA5504;
$c-orange-dark: #C84804;
$c-black: #171818;

.section-dyn-image-text {
  margin: 48px 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 36px;
  align-items: center;
  max-width: 920px;

  &.image-right {
    .it-image { order: 2; }
    .it-content { order: 1; }
  }
}

.it-image {
  img {
    width: 100%;
    max-height: 360px;
    object-fit: cover;
    border-radius: 12px;
    box-shadow: 0 12px 32px -8px rgba($c-black, 0.18);
  }
}

.it-image-placeholder {
  padding: 64px 16px;
  background: rgba($c-black, 0.04);
  border: 1px dashed rgba($c-black, 0.15);
  color: rgba($c-black, 0.4);
  text-align: center;
  border-radius: 12px;
}

.it-content {
  .it-title {
    margin: 0 0 14px;
    font-family: 'Noto Serif TC', sans-serif;
    font-size: 24px;
    font-weight: 700;
    color: $c-black;
    line-height: 1.3;
  }

  .it-paragraph {
    margin: 0 0 18px;
    font-size: 15px;
    line-height: 1.85;
    color: rgba($c-black, 0.85);
    white-space: pre-wrap;
  }

  .it-cta {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding-bottom: 6px;
    color: $c-orange;
    font-size: 15px;
    font-weight: 500;
    text-decoration: none;
    border-bottom: 2px solid $c-orange;
    transition: gap 0.25s ease, color 0.25s ease;

    .ic-arrow-right-orange {
      display: inline-block;
      width: 18px;
      height: 14px;
    }

    &:hover {
      gap: 16px;
      color: $c-orange-dark;
    }
  }
}

@media (max-width: 768px) {
  .section-dyn-image-text {
    grid-template-columns: 1fr;
    gap: 20px;

    &.image-right {
      .it-image { order: 1; }
      .it-content { order: 2; }
    }
  }
}
</style>
