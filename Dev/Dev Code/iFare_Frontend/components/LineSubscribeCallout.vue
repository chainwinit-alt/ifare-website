<template>
  <!--
    2026-05-25 UIUX #21 — Facebook 粉絲團主動推廣 callout
    放在 news/article 詳情頁底部，讀完繼續引導前往 i-Fare FB 粉絲團
  -->
  <aside class="line-subscribe" aria-label="前往 i-Fare FB 粉絲團">
    <div class="line-subscribe__icon" aria-hidden="true">f</div>
    <div class="line-subscribe__copy">
      <strong class="line-subscribe__title">想第一手收到新福利資訊?</strong>
      <p class="line-subscribe__desc">加入 i-Fare FB粉絲團 ,新政策、活動與重要提醒第一時間通知你。</p>
    </div>
    <a
      class="line-subscribe__btn"
      href="https://www.facebook.com/ccfIfare"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="前往 i-Fare FB 粉絲團"
    >
      前往粉絲團
    </a>
  </aside>
</template>

<style lang="scss" scoped>
.line-subscribe {
  display: flex;
  align-items: center;
  gap: 16px;
  width: min(100%, 720px);
  margin: 32px auto 16px;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(24, 119, 242, 0.1), rgba(24, 119, 242, 0.04));
  border: 1px solid rgba(24, 119, 242, 0.3);
  border-radius: 14px;
}

.line-subscribe__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 12px;
  background: #1877f2;
  color: #ffffff;
  font-size: 22px;
  font-weight: 800;
}

.line-subscribe__copy {
  flex: 1;
  min-width: 0;
}

.line-subscribe__title {
  display: block;
  font-size: 15px;
  font-weight: 700;
  color: #1f3640;
  margin-bottom: 4px;
}

.line-subscribe__desc {
  margin: 0;
  font-size: 13px;
  color: #52616b;
  line-height: 1.6;
}

.line-subscribe__btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  padding: 10px 20px;
  background: #1877f2;
  color: #ffffff;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.line-subscribe__btn:hover {
  background: #0f5fc3;
  transform: translateY(-1px);
  box-shadow: 0 8px 18px -8px rgba(24, 119, 242, 0.5);
}

@media (max-width: 540px) {
  .line-subscribe {
    flex-direction: column;
    text-align: center;
    margin: 24px 16px 16px;
  }

  .line-subscribe__btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
