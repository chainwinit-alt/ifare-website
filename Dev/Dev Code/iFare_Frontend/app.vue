<template>
  <div class="app-shell">
    <Transition name="network-banner">
      <div
        v-if="networkBannerVisible"
        class="network-banner"
        :class="networkBannerClass"
        role="status"
        aria-live="polite"
      >
        {{ networkBannerMessage }}
      </div>
    </Transition>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <!-- 2026-05-25 UIUX #62 — 全站 Toast 容器 -->
    <AppToastStack />
  </div>
</template>

<script setup lang="ts">
const NETWORK_RESTORED_BANNER_MS = 3000;

const networkBannerVisible = ref(false);
const networkStatus = ref<'online' | 'offline' | null>(null);
let restoreBannerTimer: ReturnType<typeof setTimeout> | null = null;

const networkBannerClass = computed(() =>
  networkStatus.value === 'offline' ? 'is-offline' : 'is-online',
);

const networkBannerMessage = computed(() =>
  networkStatus.value === 'offline'
    ? '網路已中斷，部分功能可能暫時無法使用。'
    : '網路已恢復連線。',
);

function clearRestoreBannerTimer() {
  if (!restoreBannerTimer) {
    return;
  }

  clearTimeout(restoreBannerTimer);
  restoreBannerTimer = null;
}

function showOfflineBanner() {
  clearRestoreBannerTimer();
  networkStatus.value = 'offline';
  networkBannerVisible.value = true;
}

function showOnlineBanner() {
  clearRestoreBannerTimer();
  networkStatus.value = 'online';
  networkBannerVisible.value = true;
  restoreBannerTimer = setTimeout(() => {
    networkBannerVisible.value = false;
  }, NETWORK_RESTORED_BANNER_MS);
}

function handleOnline() {
  showOnlineBanner();
}

function handleOffline() {
  showOfflineBanner();
}

onMounted(() => {
  if (!window.navigator.onLine) {
    showOfflineBanner();
  }

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
});

onBeforeUnmount(() => {
  clearRestoreBannerTimer();
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
});
</script>

<style scoped lang="scss">
.network-banner {
  position: fixed;
  inset: 0 0 auto;
  z-index: 9999;
  display: flex;
  justify-content: center;
  padding: calc(env(safe-area-inset-top) + 10px) 16px 10px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0;
  pointer-events: none;

  &.is-offline {
    background: rgba(142, 33, 33, 0.94);
  }

  &.is-online {
    background: rgba(29, 116, 67, 0.94);
  }
}

.network-banner-enter-active,
.network-banner-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.network-banner-enter-from,
.network-banner-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}
</style>
