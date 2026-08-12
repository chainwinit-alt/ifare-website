<template>
  <!--
    iFare 後台 PageManagement 預覽路由
    監聽來自 localhost:5173 的 postMessage，動態渲染頁面內容
    僅供 dev 環境後台 iframe 使用
  -->
  <div class="app-body" name="preview">
    <div v-if="!hasPage" class="preview-waiting">
      <div class="waiting-card">
        <div class="waiting-icon">📡</div>
        <h3>等待後台連線中...</h3>
        <p>此頁僅供後台 PageManagement 預覽使用，<br>請在後台「新增頁面」開啟「預覽」面板查看。</p>
      </div>
    </div>
    <DynamicPageRenderer v-else :page="pageData" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import DynamicPageRenderer from '~/components/DynamicPage/DynamicPageRenderer.vue';
import type { DynamicPage } from '~/types/dynamic-page';

useHead({ title: 'PageManagement 預覽' });

// 隱藏 default layout（不顯示 AppHeader / AppFooter / 麵包屑）— 純預覽內容
definePageMeta({
  layout: false,
  title: '預覽',
});

// 預設空白頁
const pageData = ref<DynamicPage>({
  id: '',
  slug: '',
  title: '',
  metaDescription: '',
  sections: [],
  status: 'draft',
  createDate: '',
  updateDate: '',
});
const hasPage = ref(false);

// 允許的訊息來源（後台 dev server）
const ALLOWED_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];
const DEFAULT_PARENT_ORIGIN = ALLOWED_ORIGINS[0];

interface PreviewMessage {
  type: 'preview:update';
  page: DynamicPage;
}

interface ReadyMessage {
  type: 'preview:ready';
}

function resolveParentOrigin() {
  if (!import.meta.client || !document.referrer) return DEFAULT_PARENT_ORIGIN;

  try {
    const referrerOrigin = new URL(document.referrer).origin;
    return ALLOWED_ORIGINS.includes(referrerOrigin) ? referrerOrigin : DEFAULT_PARENT_ORIGIN;
  } catch {
    return DEFAULT_PARENT_ORIGIN;
  }
}

function handleMessage(event: MessageEvent) {
  if (!ALLOWED_ORIGINS.includes(event.origin)) return;
  const data = event.data;
  if (!data || typeof data !== 'object') return;
  if (data.type === 'preview:update' && data.page) {
    pageData.value = data.page as DynamicPage;
    hasPage.value = true;
  }
}

onMounted(() => {
  window.addEventListener('message', handleMessage);
  // 通知 parent (後台) 已準備好接收資料
  if (window.parent && window.parent !== window) {
    const msg: ReadyMessage = { type: 'preview:ready' };
    window.parent.postMessage(msg, resolveParentOrigin());
  }
});

onUnmounted(() => {
  window.removeEventListener('message', handleMessage);
});
</script>

<style lang="scss" scoped>
.app-body[name="preview"] {
  min-height: 100vh;
  padding: 0 24px 80px;
  background: linear-gradient(180deg, #FFF7F0 0%, #FFFFFF 480px);
}

.preview-waiting {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
}

.waiting-card {
  text-align: center;
  padding: 48px 32px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px dashed rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  max-width: 420px;

  .waiting-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  h3 {
    margin: 0 0 12px;
    font-size: 18px;
    color: #171818;
    font-weight: 600;
  }

  p {
    margin: 0;
    font-size: 14px;
    color: rgba(0, 0, 0, 0.5);
    line-height: 1.7;
  }
}
</style>
