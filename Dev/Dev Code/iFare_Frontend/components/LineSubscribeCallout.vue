<template>
  <!--
    2026-05-25 UIUX #21 — LINE 訂閱主動推廣 callout
    放在 news/article 詳情頁底部,讀完繼續引導加入官方 LINE
  -->
  <aside class="line-subscribe" aria-label="加入 LINE 好友">
    <div class="line-subscribe__icon" aria-hidden="true">L</div>
    <div class="line-subscribe__copy">
      <strong class="line-subscribe__title">想第一手收到新福利資訊?</strong>
      <p class="line-subscribe__desc">加入 i-Fare 官方 LINE,新政策、活動與重要提醒第一時間通知你。</p>
    </div>
    <a
      class="line-subscribe__btn"
      href="https://lin.ee/eHw9VpL"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="加入 i-Fare 官方 LINE 好友"
    >
      加入好友
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
  background: linear-gradient(135deg, rgba(0, 185, 0, 0.08), rgba(0, 185, 0, 0.04));
  border: 1px solid rgba(0, 185, 0, 0.3);
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
  background: #00b900;
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
  background: #00b900;
  color: #ffffff;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.line-subscribe__btn:hover {
  background: #009100;
  transform: translateY(-1px);
  box-shadow: 0 8px 18px -8px rgba(0, 185, 0, 0.5);
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
