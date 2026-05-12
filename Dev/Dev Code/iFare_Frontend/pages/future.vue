<template>
  <div class="app-body" name="future">
    <CompBreadCrumb />

    <div class="section-list bg-section-list future-page">
      <section class="section section-future-placeholder bg-section">
        <span class="future-kicker">COMING SOON</span>
        <h1 class="future-title">未來規劃頁面建置中</h1>
        <p class="future-description">
          相關內容目前仍在整理與建置，完成後會於此頁面更新。
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: '未來規劃',
  meta: [
    {
      name: 'description',
      content: '未來規劃頁面目前建置中，相關內容將於整理完成後更新。',
    },
  ],
});

definePageMeta({
  title: '未來規劃',
  toLinkName: '首頁',
  toLink: '/',
});
</script>

<style scoped lang="scss">
.future-page {
  display: grid;
}

.section-future-placeholder {
  display: grid;
  gap: 16px;
  justify-items: center;
  text-align: center;
  padding: 72px 24px;
}

.future-kicker {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(234, 85, 4, 0.1);
  color: #ea5504;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.future-title {
  margin: 0;
  color: #171818;
  font-size: clamp(2rem, 4vw, 3.25rem);
  line-height: 1.2;
}

.future-description {
  max-width: 560px;
  margin: 0;
  color: rgba(23, 24, 24, 0.72);
  font-size: 16px;
  line-height: 1.9;
}

@media (max-width: 768px) {
  .section-future-placeholder {
    padding: 56px 20px;
  }
}
</style>
