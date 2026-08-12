<template>
  <!--
    2026-05-25 UIUX #33 — 文章/消息頁面閱讀進度條
    fixed 在頁面頂部,根據 scroll 位置動態填色寬度
  -->
  <div
    v-if="progress > 0"
    class="reading-progress"
    role="progressbar"
    aria-label="閱讀進度"
    :aria-valuenow="Math.round(progress)"
    aria-valuemin="0"
    aria-valuemax="100"
  >
    <div class="reading-progress__bar" :style="{ width: `${progress}%` }"></div>
  </div>
</template>

<script setup lang="ts">
const progress = ref(0);

function compute() {
  if (typeof window === 'undefined') return;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  if (docHeight <= 0) {
    progress.value = 0;
    return;
  }
  const scrolled = window.scrollY || document.documentElement.scrollTop || 0;
  const pct = Math.max(0, Math.min(100, (scrolled / docHeight) * 100));
  progress.value = pct;
}

let rafHandle: number | null = null;
function onScrollRaf() {
  if (rafHandle != null) return;
  rafHandle = requestAnimationFrame(() => {
    compute();
    rafHandle = null;
  });
}

onMounted(() => {
  compute();
  window.addEventListener('scroll', onScrollRaf, { passive: true });
  window.addEventListener('resize', onScrollRaf, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScrollRaf);
  window.removeEventListener('resize', onScrollRaf);
  if (rafHandle != null) cancelAnimationFrame(rafHandle);
});
</script>

<style lang="scss" scoped>
.reading-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: transparent;
  z-index: 9998;
  pointer-events: none;
}

.reading-progress__bar {
  height: 100%;
  background: linear-gradient(90deg, $color-brand-primary 0%, $color-brand-primary-dark 100%);
  transition: width 0.12s ease-out;
  box-shadow: 0 0 6px rgba(234, 85, 4, 0.4);
}

@media (prefers-reduced-motion: reduce) {
  .reading-progress__bar {
    transition: none;
  }
}
</style>
