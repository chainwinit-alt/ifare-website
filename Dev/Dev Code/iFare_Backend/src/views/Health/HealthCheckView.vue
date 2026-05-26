<template>
  <main-header>
    <template #btnsRight>
      <el-button
        :icon="Refresh"
        size="large"
        :loading="isChecking"
        @click="runAllChecks"
      >重新檢查</el-button>
    </template>
  </main-header>

  <el-scrollbar class="main-scrollbar">
    <!-- 環境總覽 -->
    <div class="section-main-card card-fullsize">
      <div class="card-info health-card">
        <div class="health-head">
          <h3>環境總覽</h3>
          <p>read-only：列出目前部署使用的 API、靜態資源路徑與環境變數，不會寫入任何資料。</p>
        </div>

        <div class="health-grid">
          <div class="health-item" v-for="row in envRows" :key="row.label">
            <span class="health-item__label">{{ row.label }}</span>
            <code class="health-item__value" :class="{ 'health-item__value--missing': !row.value }">
              {{ row.value || '(未設定)' }}
            </code>
            <span v-if="row.hint" class="health-item__hint">{{ row.hint }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 連線檢查 -->
    <div class="section-main-card card-fullsize">
      <div class="card-info health-card">
        <div class="health-head">
          <h3>連線檢查</h3>
          <p>逐一 ping 後台 API、前台網站與動態頁同步端點，確認部署設定可達。</p>
          <span v-if="lastCheckedAt" class="health-head__meta">
            最後檢查：{{ lastCheckedAt }}
          </span>
        </div>

        <ul class="check-list">
          <li
            v-for="check in checks"
            :key="check.key"
            class="check-row"
            :class="`check-row--${check.status}`"
          >
            <span class="check-row__icon">
              <el-icon v-if="check.status === 'pass'"><CircleCheck /></el-icon>
              <el-icon v-else-if="check.status === 'fail'"><CircleClose /></el-icon>
              <el-icon v-else-if="check.status === 'pending'"><Loading /></el-icon>
              <el-icon v-else><QuestionFilled /></el-icon>
            </span>
            <div class="check-row__body">
              <strong class="check-row__title">{{ check.title }}</strong>
              <span class="check-row__url">{{ check.url || '(未設定，略過)' }}</span>
              <span v-if="check.detail" class="check-row__detail">{{ check.detail }}</span>
            </div>
            <el-button
              size="small"
              plain
              :loading="check.status === 'pending'"
              :disabled="!check.url"
              @click="runSingleCheck(check.key)"
            >再測一次</el-button>
          </li>
        </ul>
      </div>
    </div>

    <!-- 帳戶狀態 -->
    <div class="section-main-card card-fullsize">
      <div class="card-info health-card">
        <div class="health-head">
          <h3>登入狀態</h3>
          <p>確認當前登入身分與 token 是否仍有效。</p>
        </div>

        <div class="health-grid">
          <div class="health-item" v-for="row in userRows" :key="row.label">
            <span class="health-item__label">{{ row.label }}</span>
            <code class="health-item__value">{{ row.value }}</code>
          </div>
        </div>
      </div>
    </div>
  </el-scrollbar>
</template>

<script setup lang="ts">
/**
 * #87 部署 Health Check 頁
 *
 * 目的：部署到遠端主機後，提供一個集中的 read-only 頁面確認
 *   - API base URL 是否指到正確環境
 *   - 圖片上傳/讀取路徑是否可達
 *   - 必要環境變數是否填寫
 *   - 後台/前台連線是否正常
 *
 * 限制：read-only，不寫入任何資料；ping 用 HEAD/no-cors 避免污染 server log。
 */
import { computed, onMounted, reactive, ref } from 'vue';
import { ElButton, ElIcon, ElScrollbar } from 'element-plus';
import {
  CircleCheck,
  CircleClose,
  Loading,
  QuestionFilled,
  Refresh,
} from '@element-plus/icons-vue';
import MainHeader from '@/components/MainHeader.vue';
import { useUserStore } from '@/stores/user';
import {
  BACKEND_API_BASE_URL,
  FRONTEND_ASSET_LIST_URL,
  FRONTEND_ASSET_UPLOAD_URL,
  FRONTEND_BASE_URL,
  FRONTEND_DYNAMIC_API_TOKEN,
  FRONTEND_SYNC_URL,
} from '@/config/adminEnv';

type CheckStatus = 'pending' | 'pass' | 'fail' | 'idle';

interface CheckItem {
  key: string;
  title: string;
  url: string;
  status: CheckStatus;
  detail?: string;
}

const userStore = useUserStore();
const lastCheckedAt = ref('');
const isChecking = ref(false);

const envRows = computed(() => [
  {
    label: 'Vite mode',
    value: import.meta.env.MODE,
    hint: import.meta.env.DEV ? '本機開發模式' : '正式建置',
  },
  { label: '後台 API base', value: BACKEND_API_BASE_URL, hint: 'AjaxRef.getBaseUrl 來源' },
  { label: '前台站台 base', value: FRONTEND_BASE_URL, hint: 'PreviewPane 與「預覽前台」會用到' },
  { label: '動態頁同步端點', value: FRONTEND_SYNC_URL, hint: 'PageBuilder 發布時 POST 到這裡' },
  { label: '前台資產列表', value: FRONTEND_ASSET_LIST_URL, hint: 'ImagePicker 讀取已上傳圖片用' },
  { label: '前台資產上傳', value: FRONTEND_ASSET_UPLOAD_URL, hint: 'PageBuilder 上傳圖片用' },
  {
    label: '前台動態 API token',
    value: FRONTEND_DYNAMIC_API_TOKEN ? '••• 已設定 (' + FRONTEND_DYNAMIC_API_TOKEN.length + ' 字)' : '',
    hint: '空值代表前台動態頁 API 沒有鎖 token',
  },
]);

const userRows = computed(() => [
  { label: '使用者', value: userStore.userName || '(未登入)' },
  { label: '帳號', value: userStore.act || '-' },
  { label: '權限', value: userStore.permission || '-' },
  { label: 'E-mail', value: userStore.email || '-' },
  {
    label: 'Token 狀態',
    value: userStore.token
      ? `已登入${userStore.tokenExpiredTime ? `（預計失效：${new Date(userStore.tokenExpiredTime).toLocaleString('zh-TW', { hour12: false })}）` : ''}`
      : '無 token',
  },
]);

const checks = reactive<CheckItem[]>([
  { key: 'backend', title: '後台 API 可達', url: BACKEND_API_BASE_URL, status: 'idle' },
  { key: 'frontend', title: '前台網站可達', url: FRONTEND_BASE_URL, status: 'idle' },
  { key: 'sync', title: '動態頁同步端點可達', url: FRONTEND_SYNC_URL, status: 'idle' },
  { key: 'assets', title: '前台資產列表可達', url: FRONTEND_ASSET_LIST_URL, status: 'idle' },
]);

async function pingUrl(url: string): Promise<{ ok: boolean; detail: string }> {
  if (!url) return { ok: false, detail: '未設定 URL' };
  try {
    // 用 no-cors 避免被 CORS 擋；只要 fetch 沒丟錯就視為可達（無法看 status code）
    await fetch(url, { method: 'GET', mode: 'no-cors', cache: 'no-store' });
    return { ok: true, detail: '可達（no-cors 模式，無法讀回應內容）' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, detail: `無法連線：${msg}` };
  }
}

async function runSingleCheck(key: string) {
  const check = checks.find((c) => c.key === key);
  if (!check) return;
  if (!check.url) {
    check.status = 'fail';
    check.detail = '未設定 URL';
    return;
  }
  check.status = 'pending';
  check.detail = undefined;
  const result = await pingUrl(check.url);
  check.status = result.ok ? 'pass' : 'fail';
  check.detail = result.detail;
}

async function runAllChecks() {
  isChecking.value = true;
  try {
    await Promise.all(checks.map((c) => runSingleCheck(c.key)));
    lastCheckedAt.value = new Date().toLocaleString('zh-TW', { hour12: false });
  } finally {
    isChecking.value = false;
  }
}

onMounted(() => {
  runAllChecks();
});
</script>

<style lang="scss" scoped>
.health-card {
  padding: 24px 28px;
}

.health-head {
  margin-bottom: 18px;

  h3 {
    margin: 0 0 6px;
    color: #303133;
    font-size: 20px;
  }

  p {
    margin: 0;
    color: #606266;
    font-size: 14px;
  }
}

.health-head__meta {
  display: inline-block;
  margin-top: 8px;
  color: #909399;
  font-size: 12px;
}

.health-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
}

.health-item {
  display: grid;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #f7f8fa;
  border: 1px solid rgba(48, 49, 51, 0.06);
}

.health-item__label {
  color: #909399;
  font-size: 12px;
  font-weight: 600;
}

.health-item__value {
  color: #303133;
  font-size: 13px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  word-break: break-all;

  &.health-item__value--missing {
    color: #f56c6c;
  }
}

.health-item__hint {
  color: #909399;
  font-size: 12px;
}

.check-list {
  display: grid;
  gap: 10px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.check-row {
  display: grid;
  grid-template-columns: 32px 1fr auto;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(48, 49, 51, 0.08);
  background: #ffffff;

  &--pass {
    border-color: rgba(103, 194, 58, 0.32);
    background: linear-gradient(135deg, #f4fbef, #ffffff);
  }
  &--fail {
    border-color: rgba(245, 108, 108, 0.32);
    background: linear-gradient(135deg, #fdf2f2, #ffffff);
  }
  &--pending {
    border-color: rgba(64, 158, 255, 0.32);
    background: linear-gradient(135deg, #eff7ff, #ffffff);
  }
}

.check-row__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  font-size: 18px;

  .check-row--pass & {
    color: #67c23a;
  }
  .check-row--fail & {
    color: #f56c6c;
  }
  .check-row--pending & {
    color: #409eff;
  }
  .check-row--idle & {
    color: #c0c4cc;
  }
}

.check-row__body {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.check-row__title {
  color: #303133;
  font-size: 14px;
}

.check-row__url {
  color: #606266;
  font-size: 12px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  word-break: break-all;
}

.check-row__detail {
  color: #909399;
  font-size: 12px;
}

@media (max-width: 1024px) {
  .health-grid {
    grid-template-columns: 1fr;
  }
  .check-row {
    grid-template-columns: 32px 1fr;
    grid-template-rows: auto auto;

    .el-button {
      grid-column: 1 / -1;
    }
  }
}
</style>
