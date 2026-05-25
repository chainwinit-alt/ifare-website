<template>
  <main-header>
    <template #btnsRight>
      <el-button :icon="Download" size="large" plain @click="onExport">匯出 JSON</el-button>
      <el-button :icon="Upload" size="large" plain @click="triggerImport">匯入 JSON</el-button>
      <input
        ref="fileInput"
        type="file"
        accept="application/json,.json"
        style="display: none"
        @change="onImport"
      />
      <el-button :icon="Plus" type="primary" size="large" @click="openQuickCreate">快速新增頁面</el-button>
    </template>
  </main-header>

  <el-scrollbar class="main-scrollbar">
    <div class="section-main-card card-fullsize">
      <div class="card-info summary-row">
        <div class="summary-stat">
          <span class="summary-num">{{ total }}</span>
          <span class="summary-label">頁面總數</span>
        </div>
        <div class="summary-stat">
          <span class="summary-num published">{{ published }}</span>
          <span class="summary-label">已發布</span>
        </div>
        <div class="summary-stat">
          <span class="summary-num drafts">{{ drafts }}</span>
          <span class="summary-label">草稿</span>
        </div>
        <!-- 2026-05-25 T — 儲存空間使用量 -->
        <div class="summary-stat storage-stat" :class="`storage-${storageLevel}`">
          <span class="summary-num storage">{{ storageUsedLabel }}</span>
          <span class="summary-label">
            儲存空間
            <span class="storage-hint">{{ storageHint }}</span>
          </span>
          <div class="storage-bar">
            <div class="storage-bar-fill" :style="{ width: storagePercent + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="section-main-card card-fullsize">
      <div class="card-info list-head">
        <div>
          <h4 class="list-title">頁面清單</h4>
          <p class="list-subtitle">不會寫程式也沒問題 — 按右上「快速新增頁面」回答 5 題就能建好頁面骨架。</p>
        </div>
        <el-button text type="primary" @click="openQuickCreate">用問答精靈建立 →</el-button>
      </div>

      <!-- 2026-05-25 M — 搜尋 / 篩選 / 排序 toolbar -->
      <div class="card-info list-toolbar">
        <div class="toolbar-search">
          <el-input
            v-model="searchKeyword"
            placeholder="搜尋頁面名稱或網址"
            size="default"
            clearable
            :prefix-icon="Search"
          />
        </div>
        <div class="toolbar-group">
          <span class="toolbar-label">狀態</span>
          <el-radio-group v-model="statusFilter" size="default">
            <el-radio-button label="all">全部</el-radio-button>
            <el-radio-button label="published">已發布</el-radio-button>
            <el-radio-button label="draft">草稿</el-radio-button>
            <el-radio-button label="unpublished">已下架</el-radio-button>
          </el-radio-group>
        </div>
        <div class="toolbar-group">
          <span class="toolbar-label">排序</span>
          <el-select v-model="sortBy" size="default" style="width: 150px;">
            <el-option label="更新時間 ↓" value="updateDate" />
            <el-option label="建立時間 ↓" value="createDate" />
            <el-option label="標題 A→Z" value="title" />
          </el-select>
        </div>
        <div class="toolbar-result">
          <span v-if="filteredCount !== total">符合 {{ filteredCount }} / 共 {{ total }} 筆</span>
          <span v-else>共 {{ total }} 筆</span>
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
import { Download, Plus, Search, Upload } from '@element-plus/icons-vue';
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
const { success, error: showError, successWithUndo } = useFeedback();
const FRONTEND_PREVIEW_BASE =
  (import.meta.env.VITE_FRONTEND_BASE as string | undefined) || 'http://localhost:3000';
const fileInput = ref<HTMLInputElement | null>(null);

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
  success(
    quickCreateForm.publishNow
      ? `頁面「${title}」已建立並發布。`
      : `頁面「${title}」已建立為草稿，可繼續調整。`,
  );
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

function togglePublish(row: any, publish: boolean) {
  const ok = update(row.id, { status: publish ? 'published' : 'draft' });
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
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `dynamic-pages-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  success('已匯出 JSON');
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
      showError(`匯入失敗：${analysis.error}`);
      resetFileInput();
      return;
    }

    // 有覆蓋風險 → confirm dialog 列出會被覆蓋的標題
    if ((analysis.overwritten ?? 0) > 0) {
      const titles = (analysis.overwrittenTitles ?? []).slice(0, 8);
      const more = (analysis.overwrittenTitles?.length ?? 0) - titles.length;
      const html = `
        <div style="text-align: left;">
          <p style="margin: 0 0 8px;">
            檔案版本 <strong>${analysis.version}</strong>，共 ${analysis.pages?.length ?? 0} 筆頁面。
          </p>
          <p style="margin: 0 0 8px;">
            其中 <strong style="color: #67c23a;">${analysis.added} 筆是新增</strong>，
            <strong style="color: #e6a23c;">${analysis.overwritten} 筆會覆蓋既有頁面</strong>：
          </p>
          <ul style="padding-left: 1.2em; margin: 0 0 8px; max-height: 200px; overflow-y: auto;">
            ${titles.map((t) => `<li>${t}</li>`).join('')}
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
    success(`已匯入 ${count} 筆${parts.length ? `（${parts.join('、')}）` : ''}`);
    reload();
    resetFileInput();
  };

  reader.readAsText(file);
}
</script>

<style lang="scss" scoped>
.summary-row {
  display: flex;
  gap: 32px;
  padding: 16px 24px;
}

.summary-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-num {
  font-size: 28px;
  font-weight: 700;
  color: #303133;

  &.published {
    color: #67c23a;
  }

  &.drafts {
    color: #e6a23c;
  }
}

.summary-label {
  font-size: 13px;
  color: #909399;
}

// 2026-05-25 T — 儲存空間 stat
.storage-stat {
  flex: 1;
  min-width: 240px;
  max-width: 360px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid #ebeef5;
  background: #fafbfc;

  .summary-num.storage {
    font-size: 18px;
  }

  .storage-hint {
    display: block;
    margin-top: 2px;
    font-size: 11px;
    color: #909399;
    line-height: 1.4;
  }

  &.storage-safe .summary-num.storage {
    color: #67c23a;
  }

  &.storage-warn {
    background: rgba(230, 162, 60, 0.05);
    border-color: rgba(230, 162, 60, 0.3);
    .summary-num.storage {
      color: #e6a23c;
    }
    .storage-hint {
      color: #e6a23c;
    }
  }

  &.storage-danger {
    background: rgba(245, 108, 108, 0.06);
    border-color: rgba(245, 108, 108, 0.35);
    .summary-num.storage {
      color: #f56c6c;
    }
    .storage-hint {
      color: #f56c6c;
      font-weight: 600;
    }
  }
}

.storage-bar {
  margin-top: 6px;
  height: 4px;
  border-radius: 999px;
  background: #ebeef5;
  overflow: hidden;
}

.storage-bar-fill {
  height: 100%;
  background: #67c23a;
  border-radius: 999px;
  transition: width 0.3s ease, background-color 0.3s ease;

  .storage-warn & {
    background: #e6a23c;
  }

  .storage-danger & {
    background: #f56c6c;
  }
}

.list-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 12px;
}

// 2026-05-25 M — 搜尋 / 篩選 / 排序 toolbar
.list-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 16px;
  align-items: center;
  margin-bottom: 12px;
  padding: 12px 16px;
  background: #fafbfc;
  border: 1px solid #ebeef5;
  border-radius: 12px;
}

.toolbar-search {
  flex: 1 1 220px;
  min-width: 200px;
  max-width: 360px;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-label {
  font-size: 12px;
  font-weight: 700;
  color: #606266;
}

.toolbar-result {
  margin-left: auto;
  font-size: 12px;
  color: #909399;
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
  font-size: 16px;
  font-weight: 700;
  color: #303133;
}

.list-subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  color: #909399;
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

@media (max-width: 768px) {
  .summary-row,
  .list-head,
  .purpose-grid,
  .blocks-grid,
  .cta-row {
    grid-template-columns: 1fr;
    flex-direction: column;
  }
}
</style>
