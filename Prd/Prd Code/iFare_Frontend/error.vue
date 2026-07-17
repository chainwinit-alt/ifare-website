<template>
  <div class="error-page">
    <NuxtLayout>
      <section class="error-content" role="alert" aria-live="assertive">
        <div class="error-illustration" aria-hidden="true">
          <span class="error-code">{{ statusCode }}</span>
        </div>
        <h1 class="error-title">{{ title }}</h1>
        <p class="error-hint">{{ hint }}</p>
        <ul class="error-suggestions" v-if="statusCode === 404">
          <li>確認網址是否打錯字</li>
          <li>透過下方按鈕回到首頁或繼續逛</li>
          <li>從首頁的選單再次找到要看的內容</li>
        </ul>
        <div class="error-actions">
          <button type="button" class="error-btn error-btn--primary" @click="handleHome">回到首頁</button>
          <button type="button" class="error-btn error-btn--secondary" @click="handleBack">上一頁</button>
          <NuxtLink class="error-btn error-btn--link" to="/ifare" @click="clearAndContinue">看 i-Fare 福利好幫手</NuxtLink>
        </div>
        <p class="error-meta" v-if="statusCode >= 500">如問題持續，請聯繫客服：(02) 2797-8383</p>
      </section>
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  error: {
    statusCode: number;
    statusMessage?: string;
    message?: string;
  }
}>()

const statusCode = computed(() => Number(props.error?.statusCode) || 500)

const title = computed(() => {
  switch (statusCode.value) {
    case 404: return '找不到您要的頁面'
    case 403: return '沒有權限存取此頁面'
    case 500: return '伺服器忙碌中'
    case 503: return '服務暫時無法使用'
    default: return '發生了預期外的錯誤'
  }
})

const hint = computed(() => {
  switch (statusCode.value) {
    case 404: return '這個頁面可能已經搬家、改名或不存在了。'
    case 403: return '您目前的權限無法瀏覽這個區域。'
    case 500:
    case 503:
      return '我們正在搶修，請稍後再試一次。'
    default: return '請稍後再試，或從首頁重新進入。'
  }
})

function handleHome() {
  clearError({ redirect: '/' })
}

function handleBack() {
  if (typeof window !== 'undefined' && window.history.length > 1) {
    window.history.back()
  } else {
    clearError({ redirect: '/' })
  }
}

function clearAndContinue() {
  clearError()
}

useHead({
  title: computed(() => `${statusCode.value} — ${title.value} | 長穩社福慈善基金會`),
})
</script>

<style scoped>
.error-content {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 80px 24px 96px;
  gap: 16px;
}

.error-illustration {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: rgba(234, 85, 4, 0.08);
  margin-bottom: 8px;
}

.error-code {
  font-size: 56px;
  font-weight: 700;
  color: #c84804;
  line-height: 1;
  letter-spacing: -0.02em;
}

.error-title {
  margin: 0;
  font-size: 26px;
  font-weight: 600;
  color: #171818;
  line-height: 1.3;
}

.error-hint {
  margin: 0;
  max-width: 520px;
  font-size: 16px;
  line-height: 1.6;
  color: rgba(0, 0, 0, 0.6);
}

.error-suggestions {
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.55);
}

.error-suggestions li::before {
  content: '·';
  margin-right: 6px;
  color: #ea5504;
}

.error-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 20px;
}

.error-btn {
  min-width: 148px;
  padding: 12px 24px;
  border: 1px solid transparent;
  border-radius: 24px;
  font-size: 15px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.18s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.error-btn:focus-visible {
  outline: 2px solid rgba(234, 85, 4, 0.7);
  outline-offset: 3px;
}

.error-btn--primary {
  background: #ea5504;
  color: #fff;
}
.error-btn--primary:hover {
  background: #c84804;
  transform: translateY(-1px);
}

.error-btn--secondary {
  background: #fff;
  color: #171818;
  border-color: rgba(0, 0, 0, 0.15);
}
.error-btn--secondary:hover {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.25);
}

.error-btn--link {
  background: rgba(234, 85, 4, 0.08);
  color: #c84804;
}
.error-btn--link:hover {
  background: rgba(234, 85, 4, 0.14);
}

.error-meta {
  margin: 16px 0 0;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.5);
}

@media (max-width: 768px) {
  .error-content {
    padding: 48px 20px 64px;
  }
  .error-illustration {
    width: 100px;
    height: 100px;
  }
  .error-code {
    font-size: 40px;
  }
  .error-title {
    font-size: 22px;
  }
  .error-hint {
    font-size: 15px;
  }
  .error-actions {
    flex-direction: column;
    width: 100%;
    max-width: 320px;
  }
  .error-btn {
    width: 100%;
  }
}
</style>
