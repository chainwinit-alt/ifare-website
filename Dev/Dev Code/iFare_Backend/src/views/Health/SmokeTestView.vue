<template>
  <main-header>
    <template #btnsRight>
      <el-button
        :icon="RefreshLeft"
        size="large"
        @click="resetAllChecks"
      >清除全部紀錄</el-button>
      <el-button
        :icon="Promotion"
        size="large"
        type="primary"
        :loading="isRunningAuto"
        @click="runAutoChecks"
      >執行自動測試</el-button>
    </template>
  </main-header>

  <el-scrollbar class="main-scrollbar">
    <!-- 進度總覽 -->
    <div class="section-main-card card-fullsize">
      <div class="card-info smoke-card smoke-summary">
        <div class="smoke-summary__head">
          <h3>{{ summaryTitle }}</h3>
          <p>每次部署完成後依此清單逐項驗收，可手動勾選或執行自動連線測試；紀錄會保留在本機，可作為驗收依據。</p>
        </div>
        <div class="smoke-summary__stats">
          <div class="smoke-stat">
            <strong>{{ passedCount }}</strong>
            <span>已通過</span>
          </div>
          <div class="smoke-stat smoke-stat--warn">
            <strong>{{ failedCount }}</strong>
            <span>失敗</span>
          </div>
          <div class="smoke-stat smoke-stat--idle">
            <strong>{{ pendingCount }}</strong>
            <span>尚未測</span>
          </div>
          <div class="smoke-stat smoke-stat--total">
            <strong>{{ totalCount }}</strong>
            <span>總項目</span>
          </div>
        </div>
        <div v-if="lastUpdatedAt" class="smoke-summary__meta">
          上次更新：{{ lastUpdatedAt }}
        </div>
      </div>
    </div>

    <!-- 分群顯示測試項目 -->
    <div
      v-for="group in groupedChecks"
      :key="group.name"
      class="section-main-card card-fullsize"
    >
      <div class="card-info smoke-card">
        <div class="smoke-group-head">
          <h3>{{ group.name }}</h3>
          <p>{{ group.description }}</p>
        </div>

        <ul class="smoke-list">
          <li
            v-for="item in group.items"
            :key="item.id"
            class="smoke-row"
            :class="`smoke-row--${item.status}`"
          >
            <span class="smoke-row__icon">
              <el-icon v-if="item.status === 'pass'"><CircleCheck /></el-icon>
              <el-icon v-else-if="item.status === 'fail'"><CircleClose /></el-icon>
              <el-icon v-else-if="item.status === 'pending'"><Loading /></el-icon>
              <el-icon v-else><QuestionFilled /></el-icon>
            </span>

            <div class="smoke-row__body">
              <strong class="smoke-row__title">{{ item.title }}</strong>
              <span class="smoke-row__desc">{{ item.description }}</span>
              <span v-if="item.autoUrl" class="smoke-row__url">{{ item.autoUrl }}</span>
              <span v-if="item.detail" class="smoke-row__detail">{{ item.detail }}</span>
              <span v-if="item.checkedAt" class="smoke-row__time">{{ item.checkedAt }}</span>
              <el-input
                v-model="item.notes"
                size="small"
                placeholder="可選：填寫備註（例如：圖片載入慢、某筆資料缺漏）"
                @blur="persistAndStamp(item)"
              />
            </div>

            <div class="smoke-row__actions">
              <el-button
                v-if="item.autoUrl"
                size="small"
                plain
                :loading="item.status === 'pending'"
                @click="runAutoCheck(item)"
              >自動測試</el-button>
              <el-button
                size="small"
                :type="item.status === 'pass' ? 'success' : 'default'"
                plain
                @click="markStatus(item, 'pass')"
              >通過</el-button>
              <el-button
                size="small"
                :type="item.status === 'fail' ? 'danger' : 'default'"
                plain
                @click="markStatus(item, 'fail')"
              >失敗</el-button>
              <el-button
                size="small"
                plain
                @click="markStatus(item, 'idle')"
              >重置</el-button>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </el-scrollbar>
</template>

<script setup lang="ts">
/**
 * #88 部署 Smoke Test 清單
 *
 * 目的：每次部署 / 環境變更後，提供固定驗收清單；避免漏測常見入口。
 *
 * 行為：
 *   - 紀錄存 localStorage(ifare-backend:smoke-test-result)
 *   - 「自動測試」用 no-cors fetch 確認 URL 可達（不能讀 status code，但能確認 DNS/網路）
 *   - 「通過 / 失敗 / 重置」用於人工驗收（含備註欄）
 *   - 不影響任何後端資料，read-only
 */
import { computed, onMounted, reactive, ref } from 'vue';
import { ElButton, ElIcon, ElInput, ElScrollbar } from 'element-plus';
import {
  CircleCheck,
  CircleClose,
  Loading,
  Promotion,
  QuestionFilled,
  RefreshLeft,
} from '@element-plus/icons-vue';
import MainHeader from '@/components/MainHeader.vue';
import {
  BACKEND_API_BASE_URL,
  FRONTEND_ASSET_LIST_URL,
  FRONTEND_BASE_URL,
  FRONTEND_SYNC_URL,
} from '@/config/adminEnv';

type SmokeStatus = 'idle' | 'pending' | 'pass' | 'fail';

interface SmokeItem {
  id: string;
  group: string;
  title: string;
  description: string;
  autoUrl?: string;
  status: SmokeStatus;
  detail?: string;
  notes: string;
  checkedAt?: string;
}

const STORAGE_KEY = 'ifare-backend:smoke-test-result';

function buildDefaultItems(): SmokeItem[] {
  return [
    // === 後台 ===
    {
      id: 'backend-login',
      group: '後台',
      title: '後台登入頁可正常開啟',
      description: '輸入錯誤密碼有提示、輸入正確密碼可進首頁。',
      status: 'idle',
      notes: '',
    },
    {
      id: 'backend-home',
      group: '後台',
      title: '後台首頁載入正常',
      description: '「我要做什麼」與「快速入口」可以看到，最近使用顯示無誤。',
      status: 'idle',
      notes: '',
    },
    {
      id: 'backend-news-list',
      group: '後台',
      title: '最新消息列表可載入資料',
      description: '進「最新消息維護」應該看到既有資料、可搜尋、可分頁。',
      status: 'idle',
      notes: '',
    },
    {
      id: 'backend-policy-edit',
      group: '後台',
      title: '福利政策可進入編輯頁',
      description: '進「福利政策維護」點任一筆，欄位可載入既有值。',
      status: 'idle',
      notes: '',
    },
    {
      id: 'backend-img-upload',
      group: '後台',
      title: '圖片管理上傳測試',
      description: '上傳一張 < 500KB 的測試圖，能看到 thumbnail 並能刪除。',
      status: 'idle',
      notes: '',
    },
    {
      id: 'backend-page-publish',
      group: '後台',
      title: 'PageManagement 草稿與發布',
      description: '新增一頁草稿後按「發布」，前台對應 slug 看得到。',
      status: 'idle',
      notes: '',
    },

    // === 前台 ===
    {
      id: 'frontend-home',
      group: '前台',
      title: '前台首頁可開啟',
      description: 'Hero、最新消息、政策推薦區塊都應正常顯示。',
      autoUrl: FRONTEND_BASE_URL,
      status: 'idle',
      notes: '',
    },
    {
      id: 'frontend-ifare-search',
      group: '前台',
      title: 'i-Fare 查詢可正常回結果',
      description: '進 /ifare → 輸入身分/地區 → 應出現對應政策清單。',
      autoUrl: FRONTEND_BASE_URL ? `${FRONTEND_BASE_URL}/ifare` : '',
      status: 'idle',
      notes: '',
    },
    {
      id: 'frontend-news-list',
      group: '前台',
      title: '前台最新消息列表可看到',
      description: '進 /news 應顯示後台新增的消息。',
      autoUrl: FRONTEND_BASE_URL ? `${FRONTEND_BASE_URL}/news` : '',
      status: 'idle',
      notes: '',
    },
    {
      id: 'frontend-chatbot',
      group: '前台',
      title: 'Chatbot 入口顯示且 fallback OK',
      description: '右下角應有 chatbot 按鈕；點開可載入並顯示 fallback 訊息。',
      status: 'idle',
      notes: '',
    },

    // === API / 同步 ===
    {
      id: 'api-backend-reach',
      group: 'API 與同步',
      title: '後台 API base 可達',
      description: 'BACKEND_API_BASE_URL 在當前環境能正常連線。',
      autoUrl: BACKEND_API_BASE_URL,
      status: 'idle',
      notes: '',
    },
    {
      id: 'api-frontend-sync',
      group: 'API 與同步',
      title: '動態頁同步端點可達',
      description: '發布 PageManagement 時會 POST 到此 URL。',
      autoUrl: FRONTEND_SYNC_URL,
      status: 'idle',
      notes: '',
    },
    {
      id: 'api-asset-list',
      group: 'API 與同步',
      title: '前台資產列表可達',
      description: 'ImagePicker 用此 endpoint 取已上傳圖片。',
      autoUrl: FRONTEND_ASSET_LIST_URL,
      status: 'idle',
      notes: '',
    },
  ];
}

const items = reactive<SmokeItem[]>(buildDefaultItems());
const lastUpdatedAt = ref<string>('');
const isRunningAuto = ref(false);

function loadFromStorage() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { lastUpdatedAt?: string; items?: SmokeItem[] };
    if (parsed.lastUpdatedAt) lastUpdatedAt.value = parsed.lastUpdatedAt;
    if (!Array.isArray(parsed.items)) return;

    // 用 id 對應，只還原 status / detail / notes / checkedAt（避免結構升級時把欄位定義也覆蓋）
    const map = new Map(parsed.items.map((i) => [i.id, i]));
    for (const item of items) {
      const saved = map.get(item.id);
      if (!saved) continue;
      item.status = saved.status ?? 'idle';
      item.detail = saved.detail;
      item.notes = saved.notes ?? '';
      item.checkedAt = saved.checkedAt;
    }
  } catch {
    // 結構不合或 storage 不可用：忽略
  }
}

function persist() {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ lastUpdatedAt: lastUpdatedAt.value, items }),
    );
  } catch {
    // ignore
  }
}

function stamp() {
  lastUpdatedAt.value = new Date().toLocaleString('zh-TW', { hour12: false });
}

function persistAndStamp(_item?: SmokeItem) {
  stamp();
  persist();
}

function markStatus(item: SmokeItem, status: SmokeStatus) {
  item.status = status;
  if (status === 'idle') {
    item.detail = undefined;
    item.checkedAt = undefined;
  } else {
    item.checkedAt = new Date().toLocaleString('zh-TW', { hour12: false });
  }
  persistAndStamp();
}

async function runAutoCheck(item: SmokeItem) {
  if (!item.autoUrl) return;
  item.status = 'pending';
  item.detail = undefined;
  try {
    await fetch(item.autoUrl, { method: 'GET', mode: 'no-cors', cache: 'no-store' });
    item.status = 'pass';
    item.detail = '可達（no-cors 模式，無法讀回應內容）';
  } catch (err) {
    item.status = 'fail';
    item.detail = `無法連線：${err instanceof Error ? err.message : String(err)}`;
  }
  item.checkedAt = new Date().toLocaleString('zh-TW', { hour12: false });
  persistAndStamp();
}

async function runAutoChecks() {
  isRunningAuto.value = true;
  try {
    const autoItems = items.filter((i) => i.autoUrl);
    await Promise.all(autoItems.map((i) => runAutoCheck(i)));
  } finally {
    isRunningAuto.value = false;
  }
}

function resetAllChecks() {
  for (const item of items) {
    item.status = 'idle';
    item.detail = undefined;
    item.checkedAt = undefined;
    item.notes = '';
  }
  lastUpdatedAt.value = '';
  persist();
}

const totalCount = computed(() => items.length);
const passedCount = computed(() => items.filter((i) => i.status === 'pass').length);
const failedCount = computed(() => items.filter((i) => i.status === 'fail').length);
const pendingCount = computed(() =>
  items.filter((i) => i.status === 'idle' || i.status === 'pending').length,
);

const summaryTitle = computed(() => {
  if (passedCount.value === totalCount.value) return '全部通過 — 部署驗收完成';
  if (failedCount.value > 0) return `${failedCount.value} 項失敗 — 部署可能未完成`;
  return '部署驗收進行中';
});

const groupedChecks = computed(() => {
  const groups = new Map<string, { name: string; description: string; items: SmokeItem[] }>();
  const groupDescriptions: Record<string, string> = {
    後台: '驗證後台管理介面功能正常、API 可回資料。',
    前台: '驗證對外網站可開啟、主要查詢路徑可用。',
    'API 與同步': '驗證設定檔指向的所有端點可連線（自動測試用 no-cors）。',
  };
  for (const item of items) {
    if (!groups.has(item.group)) {
      groups.set(item.group, {
        name: item.group,
        description: groupDescriptions[item.group] ?? '',
        items: [],
      });
    }
    groups.get(item.group)!.items.push(item);
  }
  return Array.from(groups.values());
});

onMounted(() => {
  loadFromStorage();
});
</script>

<style lang="scss" scoped>
.smoke-card {
  padding: 24px 28px;
}

.smoke-summary {
  display: grid;
  gap: 16px;
}

.smoke-summary__head {
  h3 {
    margin: 0 0 6px;
    color: #303133;
    font-size: 22px;
  }
  p {
    margin: 0;
    color: #606266;
    font-size: 14px;
  }
}

.smoke-summary__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.smoke-stat {
  display: grid;
  gap: 4px;
  padding: 14px 16px;
  border-radius: 14px;
  background: linear-gradient(135deg, #f4fbef, #ffffff);
  border: 1px solid rgba(103, 194, 58, 0.22);

  strong {
    color: #67c23a;
    font-size: 28px;
    line-height: 1;
  }

  span {
    color: #606266;
    font-size: 12px;
  }

  &.smoke-stat--warn {
    background: linear-gradient(135deg, #fdf2f2, #ffffff);
    border-color: rgba(245, 108, 108, 0.22);
    strong { color: #f56c6c; }
  }

  &.smoke-stat--idle {
    background: linear-gradient(135deg, #f5f7fa, #ffffff);
    border-color: rgba(48, 49, 51, 0.06);
    strong { color: #909399; }
  }

  &.smoke-stat--total {
    background: linear-gradient(135deg, #eff7ff, #ffffff);
    border-color: rgba(64, 158, 255, 0.22);
    strong { color: #409eff; }
  }
}

.smoke-summary__meta {
  color: #909399;
  font-size: 12px;
}

.smoke-group-head {
  margin-bottom: 14px;

  h3 {
    margin: 0 0 4px;
    color: #303133;
    font-size: 18px;
  }
  p {
    margin: 0;
    color: #909399;
    font-size: 13px;
  }
}

.smoke-list {
  display: grid;
  gap: 10px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.smoke-row {
  display: grid;
  grid-template-columns: 32px 1fr auto;
  align-items: start;
  gap: 14px;
  padding: 14px 16px;
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

.smoke-row__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  font-size: 18px;
  color: #c0c4cc;

  .smoke-row--pass & { color: #67c23a; }
  .smoke-row--fail & { color: #f56c6c; }
  .smoke-row--pending & { color: #409eff; }
}

.smoke-row__body {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.smoke-row__title {
  color: #303133;
  font-size: 14px;
}

.smoke-row__desc {
  color: #606266;
  font-size: 13px;
  line-height: 1.6;
}

.smoke-row__url {
  color: #606266;
  font-size: 12px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  word-break: break-all;
}

.smoke-row__detail {
  color: #909399;
  font-size: 12px;
}

.smoke-row__time {
  color: #c0c4cc;
  font-size: 11px;
}

.smoke-row__actions {
  display: inline-flex;
  flex-direction: column;
  gap: 6px;
  align-items: stretch;
  min-width: 96px;
}

@media (max-width: 1024px) {
  .smoke-summary__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .smoke-row {
    grid-template-columns: 32px 1fr;
    grid-template-rows: auto auto;
  }
  .smoke-row__actions {
    grid-column: 1 / -1;
    flex-direction: row;
    flex-wrap: wrap;
  }
}
</style>
