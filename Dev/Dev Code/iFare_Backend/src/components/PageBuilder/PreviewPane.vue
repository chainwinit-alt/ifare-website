<template>
  <!--
    UIUX 動態頁 CMS — 預覽 Pane (v3 iframe 整合)
    指向 iFare_Frontend dev server (localhost:3000/preview)，
    透過 postMessage 把 form 資料即時推給前端真實渲染。
  -->
  <div class="preview-iframe-wrap">
    <div v-if="status !== 'ready'" class="preview-status-overlay" :class="`status-${status}`">
      <div class="status-card">
        <div class="status-icon">{{ statusIcon }}</div>
        <h4 class="status-title">{{ statusTitle }}</h4>
        <p class="status-message">{{ statusMessage }}</p>
        <el-button v-if="status === 'error'" size="small" type="primary" plain @click="reload">
          重新載入
        </el-button>
      </div>
    </div>
    <iframe
      ref="iframeRef"
      :src="previewUrl"
      class="preview-iframe"
      title="頁面預覽"
      @load="onIframeLoad"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import { ElButton } from 'element-plus';
import type { DynamicPage } from '@/composables/useDynamicPages';

const props = defineProps<{ page: DynamicPage }>();

// 前端 dev server URL
const FRONTEND_URL = 'http://localhost:3000';
const previewUrl = `${FRONTEND_URL}/preview`;
const ALLOWED_ORIGIN = FRONTEND_URL;

const iframeRef = ref<HTMLIFrameElement | null>(null);
type Status = 'loading' | 'ready' | 'error';
const status = ref<Status>('loading');

const statusIcon = computed(() => {
  return status.value === 'loading' ? '⏳' : status.value === 'error' ? '⚠️' : '';
});
const statusTitle = computed(() => {
  if (status.value === 'loading') return '載入預覽中...';
  if (status.value === 'error') return '無法連線前端 dev server';
  return '';
});
const statusMessage = computed(() => {
  if (status.value === 'loading') return '正在連接 localhost:3000/preview';
  if (status.value === 'error') {
    return '前端 dev server (localhost:3000) 沒有回應。請確認前端已啟動：\n  cd "Dev/Dev Code/iFare_Frontend" && npm run dev';
  }
  return '';
});

let readyTimeout: ReturnType<typeof setTimeout> | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function startReadyTimeout() {
  if (readyTimeout) clearTimeout(readyTimeout);
  readyTimeout = setTimeout(() => {
    if (status.value !== 'ready') status.value = 'error';
  }, 6000);
}

function clearReadyTimeout() {
  if (readyTimeout) clearTimeout(readyTimeout);
  readyTimeout = null;
}

function pushPageToIframe() {
  const win = iframeRef.value?.contentWindow;
  if (!win) return;
  win.postMessage(
    {
      type: 'preview:update',
      page: JSON.parse(JSON.stringify(props.page)), // 深拷貝避免 reactive proxy
    },
    ALLOWED_ORIGIN,
  );
}

function onIframeLoad() {
  // iframe 載入完成（不代表內容 ready，等 preview:ready 訊號）
  startReadyTimeout();
}

function handleMessage(event: MessageEvent) {
  if (event.origin !== ALLOWED_ORIGIN) return;
  const data = event.data;
  if (!data || typeof data !== 'object') return;
  if (data.type === 'preview:ready') {
    status.value = 'ready';
    clearReadyTimeout();
    // 立刻推送目前 form 資料
    pushPageToIframe();
  }
}

function reload() {
  status.value = 'loading';
  if (iframeRef.value) {
    iframeRef.value.src = `${previewUrl}?t=${Date.now()}`;
  }
}

// 200ms debounce form 改動 → postMessage
watch(
  () => props.page,
  () => {
    if (status.value !== 'ready') return;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      pushPageToIframe();
    }, 200);
  },
  { deep: true },
);

onMounted(() => {
  window.addEventListener('message', handleMessage);
  startReadyTimeout();
});

onUnmounted(() => {
  window.removeEventListener('message', handleMessage);
  clearReadyTimeout();
  if (debounceTimer) clearTimeout(debounceTimer);
});
</script>

<style lang="scss" scoped>
.preview-iframe-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 600px;
  background: #FAFBFC;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  min-height: 600px;
  border: 0;
  display: block;
  background: #FFFFFF;
}

.preview-status-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(250, 251, 252, 0.95);
  backdrop-filter: blur(2px);
  z-index: 10;

  &.status-loading .status-icon { animation: spin 1.5s linear infinite; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.status-card {
  text-align: center;
  padding: 32px 28px;
  background: #FFFFFF;
  border: 1px solid #E4E7ED;
  border-radius: 12px;
  max-width: 360px;
  box-shadow: 0 8px 24px -8px rgba(0, 0, 0, 0.12);

  .status-icon {
    font-size: 40px;
    margin-bottom: 12px;
  }

  .status-title {
    margin: 0 0 8px;
    font-size: 16px;
    color: #303133;
    font-weight: 600;
  }

  .status-message {
    margin: 0 0 16px;
    font-size: 13px;
    color: #909399;
    line-height: 1.7;
    white-space: pre-wrap;
  }
}
</style>
