<template>
  <div class="preview-shell">
    <div class="preview-toolbar">
      <div class="toolbar-copy">
        <span class="toolbar-title">前台預覽</span>
        <span class="toolbar-subtitle">同步確認桌機、平板與手機的版面呈現。</span>
      </div>

      <div class="device-switch">
        <button
          v-for="device in deviceOptions"
          :key="device.key"
          type="button"
          class="device-btn"
          :class="{ active: deviceMode === device.key }"
          @click="deviceMode = device.key"
        >
          {{ device.label }}
        </button>
      </div>
    </div>

    <div class="preview-stage" :class="`device-${deviceMode}`">
      <div class="preview-frame-shell" :class="`device-${deviceMode}`">
        <div class="frame-chrome">
          <div class="chrome-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span class="chrome-label">{{ currentDeviceLabel }}</span>
        </div>

        <div class="preview-iframe-wrap">
          <div v-if="status !== 'ready'" class="preview-status-overlay" :class="`status-${status}`">
            <div class="status-card">
              <div class="status-icon">{{ statusIcon }}</div>
              <h4 class="status-title">{{ statusTitle }}</h4>
              <p class="status-message">{{ statusMessage }}</p>
              <el-button v-if="status === 'error'" size="small" type="primary" plain @click="reload">
                重新載入預覽
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { ElButton } from 'element-plus';
import type { DynamicPage } from '@/composables/useDynamicPages';

const props = defineProps<{ page: DynamicPage }>();

const FRONTEND_URL = 'http://localhost:3000';
const previewUrl = `${FRONTEND_URL}/preview`;
const ALLOWED_ORIGIN = FRONTEND_URL;

type Status = 'loading' | 'ready' | 'error';
type DeviceMode = 'desktop' | 'tablet' | 'mobile';

const deviceOptions: Array<{ key: DeviceMode; label: string }> = [
  { key: 'desktop', label: '桌機' },
  { key: 'tablet', label: '平板' },
  { key: 'mobile', label: '手機' },
];

const iframeRef = ref<HTMLIFrameElement | null>(null);
const status = ref<Status>('loading');
const deviceMode = ref<DeviceMode>('desktop');

const currentDeviceLabel = computed(() => {
  return deviceOptions.find((device) => device.key === deviceMode.value)?.label || '桌機';
});

const statusIcon = computed(() => {
  if (status.value === 'loading') return '↻';
  if (status.value === 'error') return '!';
  return '';
});

const statusTitle = computed(() => {
  if (status.value === 'loading') return '正在載入預覽';
  if (status.value === 'error') return '找不到前台預覽服務';
  return '';
});

const statusMessage = computed(() => {
  if (status.value === 'loading') {
    return '正在連線到 localhost:3000/preview。';
  }

  if (status.value === 'error') {
    return '請先啟動前台開發站。\ncd "Dev/Dev Code/iFare_Frontend" && npm run dev';
  }

  return '';
});

let readyTimeout: ReturnType<typeof setTimeout> | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function startReadyTimeout() {
  clearReadyTimeout();
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
      page: JSON.parse(JSON.stringify(props.page)),
    },
    ALLOWED_ORIGIN,
  );
}

function onIframeLoad() {
  startReadyTimeout();
}

function handleMessage(event: MessageEvent) {
  if (event.origin !== ALLOWED_ORIGIN) return;
  if (!event.data || typeof event.data !== 'object') return;

  if (event.data.type === 'preview:ready') {
    status.value = 'ready';
    clearReadyTimeout();
    pushPageToIframe();
  }
}

function reload() {
  status.value = 'loading';
  if (iframeRef.value) {
    iframeRef.value.src = `${previewUrl}?t=${Date.now()}`;
  }
}

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
.preview-shell {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid #ebeef5;
  border-radius: 14px;
  background: #ffffff;
}

.toolbar-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.toolbar-title {
  font-size: 15px;
  font-weight: 700;
  color: #303133;
}

.toolbar-subtitle {
  font-size: 12px;
  color: #909399;
}

.device-switch {
  display: inline-flex;
  padding: 4px;
  border-radius: 999px;
  background: #f5f7fa;
  gap: 4px;
}

.device-btn {
  min-width: 60px;
  height: 32px;
  padding: 0 14px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #606266;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &.active {
    background: #ea5504;
    color: #ffffff;
    box-shadow: 0 8px 14px -12px rgba(234, 85, 4, 0.9);
  }
}

.preview-stage {
  flex: 1;
  min-height: 720px;
  padding: 12px;
  border-radius: 18px;
  background: linear-gradient(180deg, #fafbfc 0%, #f4f7fb 100%);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  overflow: auto;
}

.preview-frame-shell {
  width: 100%;
  max-width: 1280px;
  min-height: 680px;
  border: 1px solid #e4e7ed;
  border-radius: 24px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 22px 40px -28px rgba(0, 0, 0, 0.35);
  transition:
    max-width 0.25s ease,
    border-radius 0.25s ease;

  &.device-tablet {
    max-width: 840px;
  }

  &.device-mobile {
    max-width: 390px;
    border-radius: 32px;
  }
}

.frame-chrome {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
  background: #ffffff;
}

.chrome-dots {
  display: inline-flex;
  gap: 6px;
}

.chrome-dots span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #dcdfe6;
}

.chrome-dots span:first-child {
  background: #f56c6c;
}

.chrome-dots span:nth-child(2) {
  background: #e6a23c;
}

.chrome-dots span:nth-child(3) {
  background: #67c23a;
}

.chrome-label {
  font-size: 12px;
  color: #909399;
  font-weight: 600;
}

.preview-iframe-wrap {
  position: relative;
  width: 100%;
  height: calc(100% - 49px);
  min-height: 630px;
  background: #fafbfc;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  min-height: 630px;
  border: 0;
  display: block;
  background: #ffffff;
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

  &.status-loading .status-icon {
    animation: spin 1.5s linear infinite;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.status-card {
  text-align: center;
  padding: 32px 28px;
  background: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 16px;
  max-width: 360px;
  box-shadow: 0 8px 24px -8px rgba(0, 0, 0, 0.12);
}

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

@media (max-width: 1024px) {
  .preview-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .device-switch {
    width: 100%;
    justify-content: space-between;
  }

  .device-btn {
    flex: 1;
  }
}

@media (max-width: 768px) {
  .preview-stage {
    min-height: 620px;
    padding: 8px;
  }

  .preview-frame-shell.device-mobile,
  .preview-frame-shell.device-tablet {
    max-width: 100%;
  }
}
</style>
