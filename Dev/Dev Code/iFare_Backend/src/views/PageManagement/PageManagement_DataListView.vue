<template>
  <main-header>
    <template #btnsRight>
      <div class="pm-header-actions">
        <!-- 2026-05-26 — 統一頁面管理 header actions 的尺寸與間距 -->
        <el-button class="pm-header-btn pm-header-btn--compact" :icon="Download" plain @click="onExport">匯出 JSON</el-button>
        <el-button class="pm-header-btn pm-header-btn--compact" :icon="Upload" plain @click="triggerImport">匯入 JSON</el-button>
        <input
          ref="fileInput"
          type="file"
          accept="application/json,.json"
          style="display: none"
          @change="onImport"
        />
        <el-button class="pm-header-btn" :icon="MagicStick" plain @click="openQuickCreate">用問答精靈建立</el-button>
        <el-button class="pm-header-btn" :icon="Plus" type="primary" @click="openBlankCreate">快速新增頁面</el-button>
      </div>
    </template>
  </main-header>

  <el-scrollbar class="main-scrollbar">
    <!-- 2026-05-25 #95v2 引導薄條 — 預設收合，點「使用指引」展開；第一次來會顯示 -->
    <div v-if="guideOpen" class="guide-banner" role="region" aria-label="使用指引">
      <div class="guide-banner-head">
        <span class="guide-banner-icon">💡</span>
        <div class="guide-banner-copy">
          <strong>使用指引</strong>
          <span class="guide-banner-sub">這是動態頁面 CMS，不用工程協助就能上架新頁面。三步驟：選版型 → 填內容 → 發布</span>
        </div>
        <button type="button" class="guide-close" @click="dismissGuide" title="關閉指引" aria-label="關閉指引">×</button>
      </div>
      <ol class="guide-steps">
        <li>
          <span class="step-dot">1</span>
          <div><strong>選版型</strong><span>按右上「用問答精靈建立」回答 5 題，系統會幫你組好骨架</span></div>
        </li>
        <li>
          <span class="step-dot">2</span>
          <div><strong>填內容</strong><span>拖區塊、輸入文字、挑圖片，右側即時預覽</span></div>
        </li>
        <li>
          <span class="step-dot">3</span>
          <div><strong>發布</strong><span>狀態切「已發布」按儲存，前台立刻看到</span></div>
        </li>
      </ol>
    </div>

    <!-- 2026-05-25 #95v2 主卡 — 標題列 + KPI + toolbar + 表格統一在同一張 section card -->
    <div class="section-main-card card-fullsize">
      <div class="card-info list-head">
        <div class="list-head-copy">
          <div class="list-head-title-row">
            <span class="list-head-bar"></span>
            <h4 class="list-title">頁面總覽</h4>
            <span class="list-head-count" v-if="total > 0">共 {{ total }} 筆</span>
          </div>
          <p class="list-subtitle">
            既有頁面點「編輯」可調整內容；新建可用「用問答精靈建立」答 5 題，或按「快速新增頁面」直接進入空白編輯。
          </p>
        </div>
        <div class="list-head-actions">
          <!-- 2026-05-25 #95v3 — 用問答精靈建立 / 快速新增頁面 / 匯入 / 匯出 都集中在頂部 main-header,主卡只留「使用指引」 -->
          <el-button v-if="!guideOpen" text type="info" @click="guideOpen = true">? 使用指引</el-button>
        </div>
      </div>

      <!-- 2026-05-25 #95v2 KPI 列 — 緊湊，與主卡同層 -->
      <div class="card-info kpi-strip">
        <div class="kpi-cell">
          <div class="kpi-icon-sm icon-total">📄</div>
          <div class="kpi-text">
            <span class="kpi-num">{{ total }}</span>
            <span class="kpi-label">頁面總數</span>
          </div>
        </div>
        <div class="kpi-divider"></div>

        <div class="kpi-cell">
          <div class="kpi-icon-sm icon-published">🌐</div>
          <div class="kpi-text">
            <span class="kpi-num published">{{ published }}</span>
            <span class="kpi-label">已發布</span>
          </div>
        </div>
        <div class="kpi-divider"></div>

        <div class="kpi-cell">
          <div class="kpi-icon-sm icon-drafts">✏️</div>
          <div class="kpi-text">
            <span class="kpi-num drafts">{{ drafts }}</span>
            <span class="kpi-label">草稿</span>
          </div>
        </div>
        <div class="kpi-divider"></div>

        <!-- 2026-05-25 T — 儲存空間使用量;2026-05-25 #95v5 — 精簡內容跟其他 cell 等寬,
             文字 hint 拿掉改用 title hover,危險時 cell 變色提醒 -->
        <div class="kpi-cell kpi-storage-cell" :class="`storage-${storageLevel}`" :title="storageHint">
          <div class="kpi-icon-sm icon-storage">💾</div>
          <div class="kpi-text kpi-storage-body">
            <span class="kpi-num storage">{{ storageUsedLabel }}</span>
            <span class="kpi-label">儲存空間 · 已用 {{ storagePercent }}%</span>
            <div class="storage-bar">
              <div class="storage-bar-fill" :style="{ width: storagePercent + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 2026-05-25 #95v4 — toolbar 重新呈現:雙列分區
           Row 1:搜尋(主導) + 結果計數
           Row 2:狀態 tab-style 含計數 + 排序 dropdown -->
      <div class="card-info list-toolbar">
        <div class="toolbar-row toolbar-search-row">
          <el-input
            v-model="searchKeyword"
            placeholder="搜尋頁面名稱或網址"
            size="default"
            clearable
            :prefix-icon="Search"
            class="toolbar-search-input"
          />
          <span class="toolbar-result-inline" v-if="filteredCount !== total">
            符合 <strong>{{ filteredCount }}</strong> / 共 {{ total }} 筆
          </span>
          <span class="toolbar-result-inline" v-else-if="total > 0">
            共 <strong>{{ total }}</strong> 筆
          </span>
        </div>

        <div class="toolbar-row toolbar-filter-row">
          <div class="filter-tabs" role="tablist" aria-label="狀態篩選">
            <button
              v-for="opt in STATUS_TABS"
              :key="opt.value"
              type="button"
              class="filter-tab"
              :class="{ active: statusFilter === opt.value }"
              :aria-selected="statusFilter === opt.value"
              role="tab"
              @click="statusFilter = opt.value"
            >
              {{ opt.label }}
              <span class="filter-tab-count">{{ statusCounts[opt.value] }}</span>
            </button>
          </div>

          <div class="sort-control">
            <el-icon class="sort-icon" aria-hidden="true"><Sort /></el-icon>
            <el-select
              v-model="sortBy"
              size="small"
              class="sort-select"
              aria-label="排序方式"
            >
              <el-option label="更新時間 ↓" value="updateDate" />
              <el-option label="建立時間 ↓" value="createDate" />
              <el-option label="標題 A→Z" value="title" />
            </el-select>
          </div>
        </div>
      </div>

      <div class="card-info">
        <el-table :data="pagedPages" stripe style="width: 100%" :empty-text="emptyText">
          <el-table-column prop="title" label="頁面名稱" min-width="220">
            <template #default="{ row }">
              <span class="title-cell">{{ row.title || '(未命名頁面)' }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="slug" label="頁面網址" min-width="180">
            <template #default="{ row }">
              <code>/{{ row.slug }}</code>
            </template>
          </el-table-column>

          <el-table-column label="區塊數" width="90" align="center">
            <template #default="{ row }">
              {{ (row.sections?.length ?? row.blocks?.length) ?? 0 }}
            </template>
          </el-table-column>

          <el-table-column label="狀態" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="statusTag(row.status)" size="small">
                {{ getStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="updateDate" label="更新時間" width="170">
            <template #default="{ row }">
              {{ formatDate(row.updateDate) }}
            </template>
          </el-table-column>

          <el-table-column label="操作" width="300" align="center" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click="goEdit(row.id)">編輯</el-button>
              <el-button size="small" type="success" link @click="duplicateFromRow(row)">另存新頁</el-button>
              <el-button
                v-if="row.status !== 'published'"
                size="small"
                type="success"
                link
                @click="togglePublish(row, true)"
              >發布</el-button>
              <el-button
                v-else
                size="small"
                type="warning"
                link
                @click="togglePublish(row, false)"
              >下架</el-button>
              <el-button size="small" type="danger" link @click="onDelete(row)">刪除</el-button>
              <el-button
                size="small"
                type="info"
                link
                :disabled="row.status !== 'published'"
                :title="row.status === 'published' ? '在新分頁開啟前端網址' : '草稿狀態，發布後才能預覽'"
                @click="openInFrontend(row)"
              >看前端</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 2026-05-25 M — 分頁 -->
        <div v-if="filteredCount > pageSize" class="list-pagination">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="filteredCount"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            background
          />
        </div>
      </div>
    </div>
  </el-scrollbar>

  <!-- 2026-05-25 #91 — 答題式 wizard，5 題答完直接建好頁 -->
  <el-dialog v-model="quickCreateOpen" width="780px" top="6vh" destroy-on-close>
    <template #header>
      <div class="dialog-head">
        <h4>答題建立頁面</h4>
        <p>回答 5 題，系統會幫你組好頁面骨架，再進編輯頁微調就完成。</p>
      </div>
    </template>

    <div class="wizard-body">
      <!-- Q1 用途 -->
      <div class="wizard-q">
        <div class="q-head">
          <span class="q-num">1</span>
          <h5 class="q-title">這頁主要要做什麼？</h5>
        </div>
        <div class="purpose-grid">
          <button
            v-for="opt in PURPOSE_OPTIONS"
            :key="opt.key"
            type="button"
            class="purpose-card"
            :class="{ active: quickCreateForm.purpose === opt.key }"
            @click="onPurposeChange(opt.key)"
          >
            <strong>{{ opt.label }}</strong>
            <span>{{ opt.description }}</span>
          </button>
        </div>
      </div>

      <!-- Q2 標題 -->
      <div class="wizard-q">
        <div class="q-head">
          <span class="q-num">2</span>
          <h5 class="q-title">頁面名稱叫什麼？</h5>
          <span class="q-required">必填</span>
        </div>
        <el-input
          v-model="quickCreateForm.title"
          :placeholder="currentPurposeOption.titlePlaceholder"
          size="large"
          maxlength="60"
          show-word-limit
        />
        <div class="slug-preview-row">
          <span class="slug-label">前台預計網址</span>
          <code>/{{ previewSlug }}</code>
        </div>
      </div>

      <!-- Q3 區塊 -->
      <div class="wizard-q">
        <div class="q-head">
          <span class="q-num">3</span>
          <h5 class="q-title">想放哪些區塊？</h5>
          <span class="q-hint">已依用途預選，可加減</span>
        </div>
        <div class="blocks-grid">
          <label
            v-for="(meta, type) in SECTION_TYPE_META"
            :key="type"
            class="block-check"
            :class="{ active: quickCreateForm.blocks.includes(type as SectionType) }"
          >
            <input
              type="checkbox"
              :checked="quickCreateForm.blocks.includes(type as SectionType)"
              @change="toggleBlock(type as SectionType)"
            />
            <span class="block-icon">{{ meta.icon }}</span>
            <div class="block-copy">
              <strong>{{ meta.label }}</strong>
              <span>{{ meta.description }}</span>
            </div>
          </label>
        </div>
      </div>

      <!-- Q4 主要 CTA -->
      <div class="wizard-q">
        <div class="q-head">
          <span class="q-num">4</span>
          <h5 class="q-title">主要的呼籲行動是什麼？</h5>
          <span class="q-hint">選填，會自動套到 CTA 區塊</span>
        </div>
        <div class="cta-row">
          <div class="cta-field">
            <label>按鈕文字</label>
            <el-input v-model="quickCreateForm.ctaText" placeholder="例如：立即報名 / 我要捐款" />
          </div>
          <div class="cta-field">
            <label>按鈕連結</label>
            <el-input v-model="quickCreateForm.ctaUrl" placeholder="例如：/contact 或 https://..." />
          </div>
        </div>
      </div>

      <!-- Q5 發布狀態 -->
      <div class="wizard-q">
        <div class="q-head">
          <span class="q-num">5</span>
          <h5 class="q-title">建立後立刻發布嗎？</h5>
        </div>
        <el-radio-group v-model="quickCreateForm.publishNow">
          <el-radio-button :label="false">先存草稿（建議）</el-radio-button>
          <el-radio-button :label="true">立即發布到前台</el-radio-button>
        </el-radio-group>
        <p class="publish-hint">
          {{
            quickCreateForm.publishNow
              ? '建好後會立即出現在前台。發布後仍可隨時切回草稿下架。'
              : '草稿不會出現在前台，可在編輯頁慢慢調整完再切已發布。'
          }}
        </p>
      </div>
    </div>

    <template #footer>
      <el-button @click="quickCreateOpen = false">取消</el-button>
      <el-button type="primary" :disabled="!canSubmitWizard" @click="submitQuickCreate">
        建立並開啟編輯 →
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import {
  ElButton,
  ElDialog,
  ElIcon,
  ElInput,
  ElMessageBox,
  ElOption,
  ElPagination,
  ElRadioButton,
  ElRadioGroup,
  ElScrollbar,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';
import { Download, MagicStick, Plus, Search, Sort, Upload } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import MainHeader from '@/components/MainHeader.vue';
import {
  PAGE_STATUS_LABELS,
  SECTION_TYPE_META,
  createDefaultPage,
  createDefaultSection,
  slugify,
  useDynamicPages,
  type PageStatus,
  type Section,
  type SectionType,
} from '@/composables/useDynamicPages';
import { useFeedback } from '@/composables/useFeedback';
import { FRONTEND_BASE_URL } from '@/config/adminEnv';
import { escapeHtml } from '@/utils/sanitizeHtml';

type PagePresetKey = 'blank' | 'story' | 'event' | 'news' | 'contact';

// 2026-05-25 #91 — 答題式 wizard：把「快速新增」改成 5 題問答，答完直接建好頁
interface PurposeOption {
  key: PagePresetKey;
  label: string;
  description: string;
  defaultBlocks: SectionType[];
  defaultCtaText?: string;
  defaultCtaUrl?: string;
  titlePlaceholder: string;
}

const PURPOSE_OPTIONS: PurposeOption[] = [
  {
    key: 'story',
    label: '介紹某個服務 / 主題',
    description: '關於我們、服務介紹、團隊故事',
    defaultBlocks: ['hero', 'text-section', 'image-text', 'cta-card'],
    titlePlaceholder: '例如：關於長穩、我們的服務',
  },
  {
    key: 'event',
    label: '活動報名 / 招募',
    description: '單一活動、招志工、捐款專案',
    defaultBlocks: ['hero', 'image-text', 'four-card', 'cta-card'],
    defaultCtaText: '立即報名',
    defaultCtaUrl: '/contact',
    titlePlaceholder: '例如：2027 春季愛心義賣',
  },
  {
    key: 'news',
    label: '公告 / 聲明',
    description: '單篇公告、政策說明（純文字為主）',
    defaultBlocks: ['hero', 'text-section'],
    titlePlaceholder: '例如：2027 年度公告',
  },
  {
    key: 'contact',
    label: '聯絡方式 / 詢問入口',
    description: '電話、地址、Email + 多個聯絡管道',
    defaultBlocks: ['hero', 'text-section', 'cta-card'],
    defaultCtaText: '聯絡我們',
    defaultCtaUrl: '/contact',
    titlePlaceholder: '例如：聯絡我們',
  },
  {
    key: 'blank',
    label: '我想自由組合',
    description: '只放主視覺，其他自己拖',
    defaultBlocks: ['hero'],
    titlePlaceholder: '例如：新頁面',
  },
];

const router = useRouter();

const {
  analyzeImportJson,
  applyImportPages,
  drafts,
  duplicate,
  exportJson,
  insert,
  isSlugConflict,
  pages,
  published,
  reload,
  remove,
  total,
  update,
} = useDynamicPages();
const { success, error: showError, successWithAction, successWithUndo, errorWithNextStep } = useFeedback();
const FRONTEND_PREVIEW_BASE = FRONTEND_BASE_URL;
const fileInput = ref<HTMLInputElement | null>(null);

// 2026-05-25 #95v2 — 使用指引 banner：第一次來會顯示，dismiss 後記憶於 localStorage
const GUIDE_DISMISSED_KEY = 'ifare:page-management:guide-dismissed:v1';
const guideOpen = ref<boolean>(!localStorage.getItem(GUIDE_DISMISSED_KEY));

function dismissGuide() {
  guideOpen.value = false;
  try {
    localStorage.setItem(GUIDE_DISMISSED_KEY, '1');
  } catch {
    /* localStorage 可能因隱私模式不可用，靜默失敗 */
  }
}

// 2026-05-25 T — localStorage 容量估算 + 警示
// 主流瀏覽器 localStorage 通常每 origin 約 5-10 MB；保守用 5 MB 當警示基準
const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024;

const storageUsedBytes = computed(() => {
  try {
    return new Blob([JSON.stringify(pages.value)]).size;
  } catch {
    return 0;
  }
});

const storageUsedLabel = computed(() => {
  const bytes = storageUsedBytes.value;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
});

const storagePercent = computed(() =>
  Math.min(100, Math.round((storageUsedBytes.value / STORAGE_LIMIT_BYTES) * 100)),
);

const storageLevel = computed<'safe' | 'warn' | 'danger'>(() => {
  const p = storagePercent.value;
  if (p >= 90) return 'danger';
  if (p >= 70) return 'warn';
  return 'safe';
});

const storageHint = computed(() => {
  switch (storageLevel.value) {
    case 'danger':
      return `已用 ${storagePercent.value}%，接近瀏覽器上限，建議匯出備份 + 刪除不用頁面`;
    case 'warn':
      return `已用 ${storagePercent.value}%，可考慮整理舊頁`;
    default:
      return `已用 ${storagePercent.value}%（基準 5 MB）`;
  }
});

// 2026-05-25 M — 搜尋 / 篩選 / 排序 / 分頁
const searchKeyword = ref('');
const statusFilter = ref<'all' | 'published' | 'draft' | 'unpublished'>('all');
const sortBy = ref<'updateDate' | 'createDate' | 'title'>('updateDate');
const currentPage = ref(1);
const pageSize = ref(20);

// 2026-05-25 #95v4 — 狀態 tab 設定 + 各狀態數量(顯示在 tab 旁邊)
const STATUS_TABS = [
  { value: 'all' as const, label: '全部' },
  { value: 'published' as const, label: '已發布' },
  { value: 'draft' as const, label: '草稿' },
  { value: 'unpublished' as const, label: '已下架' },
];

const statusCounts = computed<Record<typeof STATUS_TABS[number]['value'], number>>(() => {
  const unpub = pages.value.filter((p) => p.status === 'unpublished').length;
  return {
    all: total.value,
    published: published.value,
    draft: drafts.value,
    unpublished: unpub,
  };
});

const filteredPages = computed(() => {
  let arr = pages.value.slice();
  const kw = searchKeyword.value.trim().toLowerCase();
  if (kw) {
    arr = arr.filter(
      (p) =>
        (p.title || '').toLowerCase().includes(kw) ||
        (p.slug || '').toLowerCase().includes(kw),
    );
  }
  if (statusFilter.value !== 'all') {
    arr = arr.filter((p) => p.status === statusFilter.value);
  }
  return arr;
});

const sortedPages = computed(() => {
  const arr = filteredPages.value.slice();
  switch (sortBy.value) {
    case 'updateDate':
      return arr.sort((a, b) => (b.updateDate || '').localeCompare(a.updateDate || ''));
    case 'createDate':
      return arr.sort((a, b) => (b.createDate || '').localeCompare(a.createDate || ''));
    case 'title':
      return arr.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'zh-Hant'));
    default:
      return arr;
  }
});

const filteredCount = computed(() => sortedPages.value.length);

const pagedPages = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return sortedPages.value.slice(start, start + pageSize.value);
});

const emptyText = computed(() => {
  if (total.value === 0) return '目前還沒有頁面，先建立第一個吧。';
  if (filteredCount.value === 0) return '沒有符合條件的頁面，試試其他關鍵字或狀態。';
  return '';
});

// filter 改變時回到第一頁
watch([searchKeyword, statusFilter, sortBy, pageSize], () => {
  currentPage.value = 1;
});

const quickCreateOpen = ref(false);
const quickCreateForm = reactive({
  purpose: 'story' as PagePresetKey,
  title: '',
  blocks: ['hero', 'text-section', 'image-text', 'cta-card'] as SectionType[],
  ctaText: '',
  ctaUrl: '',
  publishNow: false,
});

const currentPurposeOption = computed(
  () => PURPOSE_OPTIONS.find((opt) => opt.key === quickCreateForm.purpose) ?? PURPOSE_OPTIONS[0],
);

const previewSlug = computed(() =>
  slugify(quickCreateForm.title.trim() || currentPurposeOption.value.titlePlaceholder.replace(/^例如：/, '') || 'new-page'),
);

const canSubmitWizard = computed(
  () => quickCreateForm.title.trim().length > 0 && quickCreateForm.blocks.length > 0,
);

function statusTag(status: PageStatus): 'success' | 'info' | 'warning' {
  if (status === 'published') return 'success';
  if (status === 'unpublished') return 'info';
  return 'warning';
}

function formatDate(iso: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('sv').slice(0, 16);
  } catch {
    return iso;
  }
}

function getStatusLabel(status: unknown) {
  const key = status as PageStatus;
  return PAGE_STATUS_LABELS[key] || String(status ?? '');
}

function goEdit(id: string) {
  router.push({ name: 'PageManagement_Edit', query: { id } });
}

function openQuickCreate() {
  quickCreateForm.purpose = 'story';
  quickCreateForm.title = '';
  quickCreateForm.blocks = [...PURPOSE_OPTIONS[0].defaultBlocks];
  quickCreateForm.ctaText = '';
  quickCreateForm.ctaUrl = '';
  quickCreateForm.publishNow = false;
  quickCreateOpen.value = true;
}

function openBlankCreate() {
  router.push({ name: 'PageManagement_Add' });
}

// 2026-05-25 #91 — 切換用途時，blocks 同步換預設組合；CTA 只在使用者沒填時補預設
function onPurposeChange(key: PagePresetKey) {
  const option = PURPOSE_OPTIONS.find((opt) => opt.key === key);
  if (!option) return;

  quickCreateForm.purpose = key;
  quickCreateForm.blocks = [...option.defaultBlocks];

  if (!quickCreateForm.ctaText.trim() && option.defaultCtaText) {
    quickCreateForm.ctaText = option.defaultCtaText;
  }
  if (!quickCreateForm.ctaUrl.trim() && option.defaultCtaUrl) {
    quickCreateForm.ctaUrl = option.defaultCtaUrl;
  }
}

function toggleBlock(type: SectionType) {
  const idx = quickCreateForm.blocks.indexOf(type);
  if (idx >= 0) {
    quickCreateForm.blocks.splice(idx, 1);
  } else {
    quickCreateForm.blocks.push(type);
  }
}

// 2026-05-25 #91 — 答完直接組 sections + insert，不再先帶 query 跳新增頁
function submitQuickCreate() {
  const title = quickCreateForm.title.trim();
  if (!title || quickCreateForm.blocks.length === 0) return;

  // slug 自動避衝突
  const baseSlug = slugify(title);
  let finalSlug = baseSlug;
  let n = 2;
  while (isSlugConflict(finalSlug)) {
    finalSlug = `${baseSlug}-${n}`;
    n += 1;
  }

  // 根據 wizard 答案組合 sections，並自動把標題 / CTA 帶到對應區塊
  const ctaText = quickCreateForm.ctaText.trim();
  const ctaUrl = quickCreateForm.ctaUrl.trim();
  let imageTextCount = 0;

  const sections: Section[] = quickCreateForm.blocks.map((type) => {
    const s = createDefaultSection(type);

    if (s.type === 'hero') {
      s.title = title;
    }
    if (s.type === 'image-text') {
      s.imagePosition = imageTextCount % 2 === 0 ? 'left' : 'right';
      imageTextCount += 1;
      if (ctaText) {
        s.ctaText = ctaText;
        if (ctaUrl) s.ctaUrl = ctaUrl;
      }
    }
    if (s.type === 'cta-card' && ctaText) {
      s.cards[0].title = `關於 ${title}`;
      s.cards[0].ctaText = ctaText;
      s.cards[0].ctaUrl = ctaUrl || '/contact';
    }

    return s;
  });

  const newPage = insert({
    ...createDefaultPage(),
    title,
    slug: finalSlug,
    sections,
    status: quickCreateForm.publishNow ? 'published' : 'draft',
  });

  quickCreateOpen.value = false;
  // 2026-05-25 #62 — 用 successWithAction:標題 + 描述 + 「立即編輯」action
  // 因為 wizard 完成後馬上 router.push 進 edit 頁,action 在 toast 開啟期間其實已導頁;
  // 仍保留 toast 給看到通知的人後續可循
  successWithAction({
    title: quickCreateForm.publishNow ? `已建立並發布「${title}」` : `已建立草稿「${title}」`,
    description: quickCreateForm.publishNow
      ? `頁面已上線到前台,網址 /${finalSlug}。可繼續編輯內容,或前往前台預覽。`
      : `已存為草稿,前台不會顯示。可在編輯頁填妥內容後切「已發布」上線。`,
  });
  router.push({ name: 'PageManagement_Edit', query: { id: newPage.id } });
}

// 2026-05-25 #93 真複製：直接深拷一筆進 store（草稿狀態 + slug 自動避衝突），
// 不再只是把 title/slug 塞 query 去新建頁，避免 sections / meta / cover / tags 全丟失。
function duplicateFromRow(row: any) {
  const copy = duplicate(row.id);
  if (!copy) {
    showError('找不到要複製的頁面，請重新整理列表後再試。');
    return;
  }
  success(`已建立副本「${copy.title}」（草稿），開啟編輯頁可繼續調整。`);
  router.push({ name: 'PageManagement_Edit', query: { id: copy.id } });
}

function triggerImport() {
  fileInput.value?.click();
}

// 2026-05-25 N — 刪除復原：先 snapshot 整筆 row，刪除後 toast 帶「復原」鈕，
// 8 秒內可救回（重新 insert 同樣的 sections/meta/cover/tags，僅 id 重新生）
async function onDelete(row: any) {
  try {
    await ElMessageBox.confirm(
      `確定要刪除「${row.title || '未命名頁面'}」嗎？刪除後 8 秒內可從通知右上點「復原」救回。`,
      '刪除頁面',
      {
        type: 'warning',
        confirmButtonText: '刪除',
        cancelButtonText: '取消',
      },
    );

    // 完整 snapshot 原 row 內容（深拷避免被後續 mutate）
    const snapshot = JSON.parse(JSON.stringify(row));
    remove(row.id);

    successWithUndo({
      title: '頁面已刪除',
      message: `「${snapshot.title || '未命名頁面'}」已刪除`,
      undoLabel: '↶ 復原',
      duration: 8000,
      onUndo: () => {
        const restored = insert({
          slug: snapshot.slug,
          title: snapshot.title,
          metaDescription: snapshot.metaDescription || '',
          coverImage: snapshot.coverImage || '',
          coverImageAlt: snapshot.coverImageAlt || '',
          ogImage: snapshot.ogImage || '',
          publishTime: snapshot.publishTime || null,
          unpublishTime: snapshot.unpublishTime || null,
          tags: snapshot.tags || [],
          author: snapshot.author || '',
          sections: snapshot.sections || [],
          status: snapshot.status || 'draft',
        });
        success(`已復原「${restored.title}」`);
      },
    });
  } catch {
    /* user cancelled */
  }
}

// 2026-05-25 bug fix — 原本「下架」按鈕把 status 設成 'draft' 而非 'unpublished',
// 導致下架頁面跑到「草稿」分頁;改成正確的 'unpublished',歸到「已下架」分頁
function togglePublish(row: any, publish: boolean) {
  const ok = update(row.id, { status: publish ? 'published' : 'unpublished' });
  if (ok) {
    success(publish ? `已發布「${row.title || row.slug}」` : `已下架「${row.title || row.slug}」`);
  } else {
    showError('更新失敗');
  }
}

function openInFrontend(row: any) {
  window.open(`${FRONTEND_PREVIEW_BASE}/${row.slug}`, '_blank', 'noopener,noreferrer');
}

function onExport() {
  const json = exportJson();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const filename = `dynamic-pages-${new Date().toISOString().slice(0, 10)}.json`;
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
  // 2026-05-25 #62 後台版 — 加描述告訴使用者檔案在哪 + 用途
  successWithAction({
    title: 'JSON 已匯出',
    description: `已下載 ${filename}(共 ${total.value} 筆頁面)。可用於備份或匯入到其他環境。`,
  });
}

// 2026-05-25 S — 匯入前先 analyze，若會覆蓋既有頁面則彈 confirm 列出，使用者確認後才 apply
async function onImport(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async () => {
    const content = String(reader.result);
    const analysis = analyzeImportJson(content);

    const resetFileInput = () => {
      if (fileInput.value) fileInput.value.value = '';
    };

    if (!analysis.ok) {
      // 2026-05-25 #48 + #62 — 匯入失敗附下一步建議
      errorWithNextStep({
        title: '匯入失敗',
        reason: analysis.error,
        nextStep: '請確認 JSON 檔格式正確(由本系統匯出),或重新匯出一份對照。若仍失敗,請截圖 JSON 內容回報管理員。',
      });
      resetFileInput();
      return;
    }

    // 有覆蓋風險 → confirm dialog 列出會被覆蓋的標題
    if ((analysis.overwritten ?? 0) > 0) {
      const titles = (analysis.overwrittenTitles ?? []).slice(0, 8);
      const more = (analysis.overwrittenTitles?.length ?? 0) - titles.length;
      // version / titles 來自匯入檔，屬 user 可控字串，必須 escape 後才能放進 HTML 模板
      const html = `
        <div style="text-align: left;">
          <p style="margin: 0 0 8px;">
            檔案版本 <strong>${escapeHtml(analysis.version)}</strong>，共 ${analysis.pages?.length ?? 0} 筆頁面。
          </p>
          <p style="margin: 0 0 8px;">
            其中 <strong style="color: #67c23a;">${analysis.added} 筆是新增</strong>，
            <strong style="color: #e6a23c;">${analysis.overwritten} 筆會覆蓋既有頁面</strong>：
          </p>
          <ul style="padding-left: 1.2em; margin: 0 0 8px; max-height: 200px; overflow-y: auto;">
            ${titles.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}
            ${more > 0 ? `<li style="color: #909399;">…還有 ${more} 筆</li>` : ''}
          </ul>
          <p style="margin: 0; color: #909399; font-size: 12px;">
            覆蓋後無法復原，請確認你要的是這個結果。
          </p>
        </div>
      `;
      try {
        await ElMessageBox.confirm(html, '匯入會覆蓋既有頁面', {
          type: 'warning',
          confirmButtonText: '我確認，繼續匯入',
          cancelButtonText: '取消',
          dangerouslyUseHTMLString: true,
        });
      } catch {
        resetFileInput();
        return;
      }
    }

    const count = applyImportPages(analysis.pages!);
    const parts: string[] = [];
    if (analysis.added) parts.push(`新增 ${analysis.added} 筆`);
    if (analysis.overwritten) parts.push(`覆蓋 ${analysis.overwritten} 筆`);
    // 2026-05-25 #62 — 匯入成功用 successWithAction,描述列出新增/覆蓋細項
    successWithAction({
      title: `已匯入 ${count} 筆頁面`,
      description: parts.length ? parts.join('、') + '。列表已自動重新整理。' : '列表已自動重新整理。',
    });
    reload();
    resetFileInput();
  };

  reader.readAsText(file);
}
</script>

<style lang="scss" scoped>
// 2026-05-26 — main-header actions 統一高度、寬度與間距
.pm-header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;

  :deep(.el-button) {
    margin-left: 0;
  }
}

.pm-header-btn {
  width: 152px;
  height: 36px;
  justify-content: center;
  flex: 0 0 152px;
  padding: 0 14px;
  box-sizing: border-box;
}

.pm-header-btn--compact {
  width: 112px;
  flex-basis: 112px;
}

// 2026-05-25 #95v2 — 使用指引 banner:薄條,可關閉
.guide-banner {
  margin-bottom: 12px;
  padding: 14px 18px 16px;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.05) 0%, rgba(234, 85, 4, 0.03) 100%);
  border: 1px solid rgba(64, 158, 255, 0.2);
  border-radius: 12px;
}

.guide-banner-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.guide-banner-icon {
  font-size: 18px;
  line-height: 1;
  flex-shrink: 0;
}

.guide-banner-copy {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px 10px;
  flex: 1;
  min-width: 0;

  strong {
    font-size: 14px;
    font-weight: 700;
    color: #303133;
  }
}

.guide-banner-sub {
  font-size: 12px;
  color: #606266;
  line-height: 1.5;
}

.guide-close {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 0;
  background: transparent;
  color: #909399;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease;

  &:hover {
    background: rgba(144, 147, 153, 0.15);
    color: #303133;
  }
}

.guide-steps {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;

  li {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 12px;
    background: #ffffff;
    border: 1px solid #ebeef5;
    border-radius: 10px;
  }

  strong {
    display: block;
    font-size: 13px;
    font-weight: 700;
    color: #303133;
    margin-bottom: 2px;
  }

  span {
    font-size: 12px;
    color: #606266;
    line-height: 1.5;
  }
}

.step-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #ea5504;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

// 2026-05-25 #95v2 — KPI 列：與主卡同層、緊湊、4 cell + divider
// 2026-05-25 #95v5 — 拿掉淺灰底跟邊框,4 cell 真正等寬(原 storage flex 1.4 撐寬);
//                    視覺更輕,更像「資訊欄」而不是「獨立卡片」
.kpi-strip {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 0;
  padding: 8px 0;
  margin-bottom: 18px;
  background: transparent;
  border: 0;
  border-radius: 0;
}

.kpi-cell {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
}

.kpi-divider {
  width: 1px;
  background: #ebeef5;
  flex-shrink: 0;
  margin: 6px 0;
}

.kpi-icon-sm {
  font-size: 15px;
  line-height: 1;
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #f5f7fa;
  flex-shrink: 0;
}

.icon-total { background: rgba(64, 158, 255, 0.12); }
.icon-published { background: rgba(103, 194, 58, 0.14); }
.icon-drafts { background: rgba(230, 162, 60, 0.14); }
.icon-storage { background: rgba(144, 147, 153, 0.14); }

.kpi-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  flex: 1;
}

.kpi-num {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
  line-height: 1.15;

  &.published { color: #67c23a; }
  &.drafts { color: #e6a23c; }
  &.storage { font-size: 14px; color: #67c23a; }
}

.kpi-label {
  font-size: 11px;
  color: #909399;
  font-weight: 600;
}

// 2026-05-25 #95v5 — storage cell 不再撐寬,跟其他 cell 等寬
.kpi-storage-cell {
  flex: 1 1 0;
}

.kpi-storage-body {
  gap: 3px;
}

.kpi-storage-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.storage-bar {
  width: 100%;
  height: 3px;
  border-radius: 999px;
  background: #ebeef5;
  overflow: hidden;
  margin-top: 1px;
}

.storage-bar-fill {
  height: 100%;
  background: #67c23a;
  border-radius: 999px;
  transition: width 0.3s ease, background-color 0.3s ease;

  .storage-warn & { background: #e6a23c; }
  .storage-danger & { background: #f56c6c; }
}

.kpi-sub-inline {
  font-size: 10px;
  color: #909399;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kpi-storage-cell.storage-warn {
  .kpi-num.storage { color: #e6a23c; }
  .kpi-sub-inline { color: #e6a23c; }
}

.kpi-storage-cell.storage-danger {
  .kpi-num.storage { color: #f56c6c; }
  .kpi-sub-inline { color: #f56c6c; font-weight: 600; }
}

// 2026-05-25 #95v2 — 「頁面總覽」標題列
.list-head {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 18px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f2f5;
}

.list-head-copy {
  flex: 1;
  min-width: 0;
}

.list-head-actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.list-head-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.list-head-bar {
  display: inline-block;
  width: 3px;
  height: 16px;
  background: #ea5504;
  border-radius: 2px;
  flex-shrink: 0;
}

.list-head-count {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 8px;
  border-radius: 999px;
  background: #f5f7fa;
  color: #606266;
  font-size: 11px;
  font-weight: 600;
}

// 2026-05-25 #95v4 — toolbar 雙列分區:row1 搜尋+結果 / row2 狀態 tabs + 排序
.list-toolbar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: stretch;
  margin-bottom: 12px;
  padding: 16px 4px;
  background: transparent;
  border: 0;
  border-top: 1px solid #ebeef5;
  border-bottom: 1px solid #ebeef5;
  border-radius: 0;
}

.toolbar-row {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 16px;
}

.toolbar-search-row {
  // 搜尋列:搜尋框 grow,計數靠右
}

.toolbar-search-input {
  flex: 1;
  max-width: 460px;
}

.toolbar-result-inline {
  margin-left: auto;
  font-size: 13px;
  color: #606266;

  strong {
    color: #ea5504;
    font-weight: 700;
  }
}

.toolbar-filter-row {
  // 篩選列:狀態 tabs 左,排序 control 右
}

// 狀態 tabs — tab-style(底線標 active,而不是 button-group 的填色感)
.filter-tabs {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 2px;
  align-items: center;
  flex: 1;
}

.filter-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 0;
  background: transparent;
  color: #606266;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 8px;
  position: relative;
  transition: background-color 0.18s ease, color 0.18s ease;

  &:hover {
    background: #f5f7fa;
    color: #303133;
  }

  &.active {
    color: #ea5504;
    background: rgba(234, 85, 4, 0.08);

    .filter-tab-count {
      background: #ea5504;
      color: #ffffff;
    }
  }

  &:focus-visible {
    outline: 2px solid #ea5504;
    outline-offset: 2px;
  }
}

.filter-tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 18px;
  padding: 0 6px;
  border-radius: 999px;
  background: #ebeef5;
  color: #606266;
  font-size: 11px;
  font-weight: 700;
  transition: background-color 0.18s ease, color 0.18s ease;
}

// 排序 — icon + label + select 一組
.sort-control {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
}

.sort-icon {
  color: #909399;
  font-size: 14px;
}

.sort-select {
  width: 140px;
}

@media (max-width: 720px) {
  .toolbar-search-input {
    max-width: 100%;
  }

  .toolbar-result-inline {
    margin-left: 0;
  }

  .sort-control {
    margin-left: 0;
  }
}

.list-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

@media (max-width: 768px) {
  .list-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-search,
  .toolbar-group {
    width: 100%;
  }

  .toolbar-result {
    margin-left: 0;
    text-align: right;
  }
}

.list-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #303133;
  letter-spacing: 0.2px;
}

.list-subtitle {
  margin: 0;
  font-size: 12px;
  color: #909399;
  line-height: 1.7;
  max-width: 580px;
}

.title-cell {
  font-weight: 600;
  color: #303133;
}

code {
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
}

.dialog-head h4 {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 700;
  color: #303133;
}

.dialog-head p {
  margin: 0;
  font-size: 13px;
  color: #909399;
}

// 2026-05-25 #91 — 答題式 wizard 樣式
.wizard-body {
  display: flex;
  flex-direction: column;
  gap: 22px;
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 4px;
}

.wizard-q {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.q-head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.q-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #ea5504;
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.q-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #303133;
}

.q-required {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  background: rgba(245, 108, 108, 0.12);
  color: #f56c6c;
  font-size: 11px;
  font-weight: 700;
}

.q-hint {
  font-size: 12px;
  color: #909399;
}

// Q1 用途
.purpose-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.purpose-card {
  padding: 14px;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  background: #ffffff;
  text-align: left;
  cursor: pointer;
  transition: all 0.18s ease;
  display: flex;
  flex-direction: column;
  gap: 4px;

  &:hover {
    border-color: #ea5504;
    background: rgba(234, 85, 4, 0.04);
    transform: translateY(-1px);
  }

  &.active {
    border-color: #ea5504;
    background: linear-gradient(135deg, rgba(234, 85, 4, 0.1), #ffffff);
    box-shadow: 0 8px 18px -14px rgba(234, 85, 4, 0.5);
  }

  strong {
    font-size: 14px;
    font-weight: 700;
    color: #303133;
  }

  span {
    font-size: 12px;
    color: #909399;
    line-height: 1.5;
  }
}

// Q2 標題
.slug-preview-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fafbfc;
  border-radius: 10px;
  border: 1px solid #ebeef5;
}

.slug-label {
  font-size: 12px;
  color: #909399;
  font-weight: 600;
}

.slug-preview-row code {
  background: transparent;
  color: #0f4c5c;
  font-size: 13px;
  padding: 0;
  word-break: break-all;
}

// Q3 區塊
.blocks-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.block-check {
  display: grid;
  grid-template-columns: 18px 28px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid #e4e7ed;
  border-radius: 10px;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.18s ease;

  &:hover {
    border-color: #ea5504;
    background: rgba(234, 85, 4, 0.03);
  }

  &.active {
    border-color: #ea5504;
    background: rgba(234, 85, 4, 0.06);
  }

  input[type='checkbox'] {
    width: 16px;
    height: 16px;
    accent-color: #ea5504;
    cursor: pointer;
  }
}

.block-icon {
  font-size: 18px;
  line-height: 1;
  text-align: center;
}

.block-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;

  strong {
    font-size: 13px;
    font-weight: 700;
    color: #303133;
  }

  span {
    font-size: 12px;
    color: #909399;
    line-height: 1.5;
    word-break: break-word;
  }
}

// Q4 CTA
.cta-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.cta-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cta-field label {
  font-size: 12px;
  font-weight: 600;
  color: #606266;
}

// Q5 發布狀態
.publish-hint {
  margin: 0;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}

// 2026-05-25 #95v2 — RWD：guide-banner / kpi-strip 改 stack
@media (max-width: 1024px) {
  .guide-steps {
    grid-template-columns: 1fr;
  }

  .kpi-strip {
    flex-wrap: wrap;
    padding: 8px 4px;

    .kpi-cell {
      flex: 1 1 calc(50% - 1px);
      padding: 10px 14px;
    }

    .kpi-divider {
      display: none;
    }
  }

  .kpi-storage-cell {
    flex: 1 1 100% !important;
  }
}

@media (max-width: 768px) {
  .guide-banner-head {
    flex-wrap: wrap;
  }

  .guide-banner-copy {
    width: 100%;
  }

  .kpi-strip .kpi-cell {
    flex: 1 1 100%;
  }

  .list-head {
    flex-direction: column;
    align-items: stretch;
  }

  .list-head-actions {
    justify-content: flex-end;
  }

  .purpose-grid,
  .blocks-grid,
  .cta-row {
    grid-template-columns: 1fr;
  }
}
</style>
