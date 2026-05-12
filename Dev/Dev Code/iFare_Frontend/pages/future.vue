<template>
  <div class="app-body" name="future">
    <CompBreadCrumb />

    <div class="section-list bg-section-list future-page">
      <section class="section section-future-placeholder bg-section">
        <span class="future-kicker">COMING SOON</span>
        <h1 class="future-title">
          <span class="future-title-line">未來規劃頁面</span>
          <span class="future-title-line future-title-line-mobile">建置中</span>
        </h1>
        <p class="future-description">
          相關內容目前仍在整理與建置，完成後會於此頁面更新。
        </p>
      </section>

      <section class="section section-future-actions bg-section" aria-labelledby="future-actions-title">
        <div class="future-actions-card">
          <div class="future-actions-copy">
            <span class="future-actions-kicker">先看現有內容</span>
            <h2 id="future-actions-title" class="future-actions-title">
              如果你現在想先了解基金會服務，可以先從這裡開始
            </h2>
            <p class="future-actions-description">
              這頁還在整理中，但你可以先查看近期消息，或先認識基金會的服務方向與陪伴方式。
            </p>
          </div>

          <div class="future-actions-grid">
            <NuxtLink to="/news" class="future-action-link transition-general">
              <strong>查看最新消息</strong>
              <span>先了解近期公告、活動與更新。</span>
            </NuxtLink>

            <NuxtLink to="/about" class="future-action-link transition-general">
              <strong>認識基金會</strong>
              <span>先看服務理念、陪伴方式與團隊介紹。</span>
            </NuxtLink>
          </div>
        </div>
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
.app-body[name="future"] {
  gap: 18px;
  margin: 32px auto 112px;
}

.future-page {
  display: grid;
  gap: clamp(56px, 8vw, 88px);
}

.section-future-placeholder {
  display: grid;
  gap: 18px;
  justify-items: center;
  text-align: center;
  padding: 56px 24px 8px;
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
  font-size: clamp(2.25rem, 4vw, 3.25rem);
  line-height: 1.15;
  text-wrap: balance;
}

.future-title-line {
  display: inline;
}

.future-title-line-mobile {
  margin-left: 0.2em;
}

.future-description {
  max-width: 30ch;
  margin: 0;
  color: rgba(23, 24, 24, 0.72);
  font-size: 15px;
  line-height: 1.85;
}

.section-future-actions {
  padding-bottom: 8px;
}

.future-actions-card {
  display: grid;
  gap: 22px;
  padding: 30px 32px;
  border: 1px solid rgba(23, 24, 24, 0.06);
  border-radius: 30px;
  background:
    linear-gradient(135deg, rgba(255, 244, 236, 0.96) 0%, rgba(232, 247, 243, 0.92) 100%);
  box-shadow: 0 20px 50px -30px rgba(23, 24, 24, 0.24);
}

.future-actions-copy {
  display: grid;
  gap: 10px;
}

.future-actions-kicker {
  display: inline-flex;
  align-items: center;
  justify-self: start;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
  color: #0c7b78;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.future-actions-title {
  max-width: 22ch;
  margin: 0;
  color: #171818;
  font-size: clamp(1.5rem, 3vw, 2rem);
  line-height: 1.35;
}

.future-actions-description {
  max-width: 42ch;
  margin: 0;
  color: rgba(23, 24, 24, 0.72);
  font-size: 15px;
  line-height: 1.8;
}

.future-actions-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.future-action-link {
  display: grid;
  gap: 8px;
  align-content: start;
  min-height: 112px;
  padding: 18px 20px;
  border: 1px solid rgba(23, 24, 24, 0.08);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.58);
  color: #171818;
  text-decoration: none;
  background-image: none;
  transition:
    transform 0.22s cubic-bezier(0.32, 0.72, 0, 1),
    border-color 0.22s cubic-bezier(0.32, 0.72, 0, 1),
    box-shadow 0.22s cubic-bezier(0.32, 0.72, 0, 1),
    background 0.22s cubic-bezier(0.32, 0.72, 0, 1);

  strong {
    font-size: 18px;
    font-weight: 700;
    line-height: 1.5;
  }

  span {
    color: rgba(23, 24, 24, 0.68);
    font-size: 14px;
    line-height: 1.65;
  }

  &:hover,
  &:focus-visible {
    transform: translateY(-3px);
    border-color: rgba(12, 123, 120, 0.28);
    background: rgba(255, 255, 255, 0.96);
    box-shadow:
      0 14px 28px -18px rgba(12, 123, 120, 0.42),
      inset 0 1px 0 rgba(255, 255, 255, 0.75);
  }
}

@media (max-width: 768px) {
  .app-body[name="future"] {
    gap: 12px;
    margin: 24px auto 72px;
  }

  .future-page {
    gap: 44px;
  }

  .section-future-placeholder {
    padding: 40px 20px 0;
  }

  .future-title {
    max-width: 8ch;
    font-size: clamp(2rem, 11vw, 2.75rem);
  }

  .future-title-line {
    display: block;
  }

  .future-title-line-mobile {
    margin-left: 0;
  }

  .future-description {
    max-width: 20ch;
    font-size: 14px;
    line-height: 1.75;
  }

  .future-actions-card {
    gap: 18px;
    padding: 22px 18px;
    border-radius: 24px;
  }

  .future-actions-title {
    max-width: 12ch;
    font-size: 1.5rem;
  }

  .future-actions-description {
    max-width: 22ch;
    font-size: 14px;
    line-height: 1.7;
  }

  .future-actions-grid {
    grid-template-columns: 1fr;
  }

  .future-action-link {
    min-height: auto;
    padding: 16px 18px;
  }
}
</style>
