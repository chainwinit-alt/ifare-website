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
      </div>
    </div>

    <div class="section-main-card card-fullsize">
      <div class="card-info list-head">
        <div>
          <h4 class="list-title">頁面清單</h4>
          <p class="list-subtitle">新手建議直接用「快速新增頁面」，先選模板再填內容。</p>
        </div>
        <el-button text type="primary" @click="openQuickCreate">用精靈建立新頁面</el-button>
      </div>

      <div class="card-info">
        <el-table :data="pages" stripe style="width: 100%" empty-text="目前還沒有頁面，先建立第一個吧。">
          <el-table-column prop="title" label="頁面名稱" min-width="220">
            <template #default="{ row }">
              <span class="title-cell">{{ row.title || '(未命名頁面)' }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="slug" label="URL Slug" min-width="180">
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

          <el-table-column label="操作" width="260" align="center" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click="goEdit(row.id)">編輯</el-button>
              <el-button size="small" type="success" link @click="duplicateFromRow(row)">複製新增</el-button>
              <el-button size="small" link :icon="CopyDocument" @click="copyPageJson(row)" title="複製此頁 JSON（PoC：可貼到前端 localStorage 顯示）">複製 JSON</el-button>
              <el-button size="small" type="danger" link @click="onDelete(row)">刪除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </el-scrollbar>

  <el-dialog v-model="quickCreateOpen" width="720px" destroy-on-close>
    <template #header>
      <div class="dialog-head">
        <h4>快速新增頁面</h4>
        <p>先選模板，再輸入頁面名稱，系統會帶你進去編輯。</p>
      </div>
    </template>

    <div class="quick-create-body">
      <div class="wizard-step">
        <span class="step-index">1</span>
        <div class="step-copy">
          <strong>選一個頁面模板</strong>
          <span>不會寫 code 也可以先從常用版型開始。</span>
        </div>
      </div>

      <div class="preset-grid">
        <button
          v-for="preset in pagePresets"
          :key="preset.key"
          type="button"
          class="preset-card"
          :class="{ active: quickCreateForm.preset === preset.key }"
          @click="quickCreateForm.preset = preset.key"
        >
          <strong>{{ preset.label }}</strong>
          <span>{{ preset.description }}</span>
          <small>{{ preset.structure }}</small>
        </button>
      </div>

      <div class="wizard-step">
        <span class="step-index">2</span>
        <div class="step-copy">
          <strong>輸入頁面名稱</strong>
          <span>系統會自動幫你產生網址。</span>
        </div>
      </div>

      <div class="quick-form">
        <div class="quick-field">
          <label>頁面名稱</label>
          <el-input v-model="quickCreateForm.title" placeholder="例如：關於我們、志工招募、活動報名" size="large" />
        </div>

        <div class="quick-field">
          <label>預計網址</label>
          <div class="slug-preview">/{{ previewSlug }}</div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="quickCreateOpen = false">取消</el-button>
      <el-button type="primary" :disabled="!quickCreateForm.title.trim()" @click="submitQuickCreate">
        下一步開始編輯
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import {
  ElButton,
  ElDialog,
  ElInput,
  ElMessageBox,
  ElScrollbar,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';
import { CopyDocument, Download, Plus, Upload } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import MainHeader from '@/components/MainHeader.vue';
import { PAGE_STATUS_LABELS, slugify, useDynamicPages, type PageStatus } from '@/composables/useDynamicPages';
import { useFeedback } from '@/composables/useFeedback';

type PagePresetKey = 'blank' | 'story' | 'service' | 'campaign';

interface QuickPreset {
  key: PagePresetKey;
  label: string;
  description: string;
  structure: string;
  suggestedTitle: string;
}

const pagePresets: QuickPreset[] = [
  {
    key: 'blank',
    label: '空白頁',
    description: '從零開始，自由編排。',
    structure: '無預設區塊',
    suggestedTitle: '新頁面',
  },
  {
    key: 'story',
    label: '介紹頁',
    description: '適合關於我們、理念、單一主題介紹。',
    structure: '主視覺 / 文字 / 圖文 / 行動卡',
    suggestedTitle: '關於我們',
  },
  {
    key: 'service',
    label: '圖文說明頁',
    description: '適合服務內容、流程、申請方式。',
    structure: '主視覺 / 重點卡片 / 圖文 / 補充資訊',
    suggestedTitle: '服務內容',
  },
  {
    key: 'campaign',
    label: '導流頁',
    description: '適合活動、捐款、招募、報名。',
    structure: '主視覺 / 活動說明 / 行動卡',
    suggestedTitle: '立即行動',
  },
];

const router = useRouter();

const { drafts, exportJson, importJson, pages, published, reload, remove, total } = useDynamicPages();
const { success, error: showError } = useFeedback();
const fileInput = ref<HTMLInputElement | null>(null);
const quickCreateOpen = ref(false);
const quickCreateForm = reactive({
  preset: 'story' as PagePresetKey,
  title: '',
});

const previewSlug = computed(() => {
  const preset = pagePresets.find((item) => item.key === quickCreateForm.preset);
  return slugify(quickCreateForm.title.trim() || preset?.suggestedTitle || 'new-page');
});

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
  quickCreateForm.preset = 'story';
  quickCreateForm.title = '';
  quickCreateOpen.value = true;
}

function submitQuickCreate() {
  router.push({
    name: 'PageManagement_Add',
    query: {
      preset: quickCreateForm.preset,
      title: quickCreateForm.title.trim(),
      slug: previewSlug.value,
    },
  });
  quickCreateOpen.value = false;
}

function duplicateFromRow(row: any) {
  router.push({
    name: 'PageManagement_Add',
    query: {
      title: `${row.title || '未命名頁面'} 副本`,
      slug: slugify(`${row.slug || 'page'}-copy`),
    },
  });
}

function triggerImport() {
  fileInput.value?.click();
}

async function onDelete(row: any) {
  try {
    await ElMessageBox.confirm(
      `確定要刪除「${row.title || '未命名頁面'}」嗎？刪除後無法復原。`,
      '刪除頁面',
      {
        type: 'warning',
        confirmButtonText: '刪除',
        cancelButtonText: '取消',
      },
    );
    remove(row.id);
    success('頁面已刪除');
  } catch {
    /* user cancelled */
  }
}

async function copyPageJson(row: any) {
  try {
    const json = JSON.stringify(row, null, 2);
    await navigator.clipboard.writeText(json);
    success(`已複製「${row.title || row.slug}」JSON 到剪貼簿`);
  } catch (err) {
    showError('複製失敗，請手動使用「匯出 JSON」', err);
  }
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

function onImport(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const result = importJson(String(reader.result));

    if (result.ok) {
      success(`已匯入 ${result.count} 筆頁面`);
      reload();
    } else {
      showError(`匯入失敗：${result.error}`);
    }

    if (fileInput.value) fileInput.value.value = '';
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

.list-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 12px;
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

.quick-create-body {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.wizard-step {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.step-index {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(234, 85, 4, 0.12);
  color: #ea5504;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.step-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.step-copy strong {
  color: #303133;
  font-size: 14px;
}

.step-copy span {
  color: #909399;
  font-size: 13px;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.preset-card {
  padding: 14px;
  border: 1px solid #e4e7ed;
  border-radius: 14px;
  background: #ffffff;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #ea5504;
    box-shadow: 0 10px 18px -16px rgba(234, 85, 4, 0.7);
  }

  &.active {
    border-color: #ea5504;
    background: linear-gradient(135deg, rgba(234, 85, 4, 0.08), #ffffff);
  }
}

.preset-card strong {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  color: #303133;
}

.preset-card span {
  display: block;
  font-size: 13px;
  line-height: 1.6;
  color: #606266;
}

.preset-card small {
  display: inline-flex;
  margin-top: 10px;
  padding: 0 10px;
  min-height: 26px;
  align-items: center;
  border-radius: 999px;
  background: #f5f7fa;
  color: #909399;
  font-size: 12px;
}

.quick-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  gap: 14px;
}

.quick-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.quick-field label {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
}

.slug-preview {
  min-height: 40px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  border-radius: 10px;
  background: #f5f7fa;
  color: #303133;
  font-size: 13px;
  font-family: Consolas, monospace;
}

@media (max-width: 768px) {
  .summary-row,
  .list-head,
  .quick-form,
  .preset-grid {
    grid-template-columns: 1fr;
    flex-direction: column;
  }
}
</style>
