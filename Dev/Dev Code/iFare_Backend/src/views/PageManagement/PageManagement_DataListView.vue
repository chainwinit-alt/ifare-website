<template>
  <main-header>
    <template #btnsRight>
      <el-button
        :icon="Download"
        size="large"
        plain
        @click="onExport"
      >匯出 JSON</el-button>
      <el-button
        :icon="Upload"
        size="large"
        plain
        @click="$refs.fileInput.click()"
      >匯入 JSON</el-button>
      <input
        ref="fileInput"
        type="file"
        accept="application/json,.json"
        style="display: none"
        @change="onImport"
      />
      <el-button
        :icon="Plus"
        type="primary"
        size="large"
        @click="$commonLib.GuideToPage('PageManagement_Add')"
      >新增頁面</el-button>
    </template>
  </main-header>

  <el-scrollbar class="main-scrollbar">
    <!-- 摘要卡 -->
    <div class="section-main-card card-fullsize">
      <div class="card-info summary-row">
        <div class="summary-stat">
          <span class="summary-num">{{ total }}</span>
          <span class="summary-label">總頁數</span>
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

    <!-- 列表 -->
    <div class="section-main-card card-fullsize">
      <div class="card-info">
        <el-table :data="pages" stripe style="width: 100%" empty-text="尚無動態頁面，點右上角「新增頁面」開始">
          <el-table-column prop="title" label="標題" min-width="200">
            <template #default="{ row }">
              <span class="title-cell">{{ row.title || '(未命名)' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="slug" label="URL Slug" min-width="180">
            <template #default="{ row }">
              <code>/{{ row.slug }}</code>
            </template>
          </el-table-column>
          <el-table-column label="區段數" width="90" align="center">
            <template #default="{ row }">
              {{ (row.sections?.length ?? row.blocks?.length) ?? 0 }}
            </template>
          </el-table-column>
          <el-table-column label="狀態" width="100" align="center">
            <template #default="{ row }">
              <el-tag
                :type="statusTag(row.status)"
                size="small"
              >{{ PAGE_STATUS_LABELS[row.status] }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="updateDate" label="最後修改" width="170">
            <template #default="{ row }">
              {{ formatDate(row.updateDate) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160" align="center" fixed="right">
            <template #default="{ row }">
              <el-button
                size="small"
                type="primary"
                link
                @click="goEdit(row.id)"
              >編輯</el-button>
              <el-button
                size="small"
                type="danger"
                link
                @click="onDelete(row)"
              >刪除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </el-scrollbar>
</template>

<script setup lang="ts">
import { getCurrentInstance, ref } from 'vue';
import {
  ElButton,
  ElScrollbar,
  ElTable,
  ElTableColumn,
  ElTag,
  ElMessage,
  ElMessageBox,
} from 'element-plus';
import { Plus, Download, Upload } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import MainHeader from '@/components/MainHeader.vue';
import {
  useDynamicPages,
  PAGE_STATUS_LABELS,
  type PageStatus,
} from '@/composables/useDynamicPages';

const app = getCurrentInstance();
const $commonLib = app?.appContext.config.globalProperties.$CommonLib;
const router = useRouter();

const { pages, total, published, drafts, remove, exportJson, importJson, reload } = useDynamicPages();
const fileInput = ref<HTMLInputElement | null>(null);

function statusTag(s: PageStatus): 'success' | 'info' | 'warning' {
  if (s === 'published') return 'success';
  if (s === 'unpublished') return 'info';
  return 'warning';
}

function formatDate(iso: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString('sv').slice(0, 16);
  } catch {
    return iso;
  }
}

function goEdit(id: string) {
  router.push({ name: 'PageManagement_Edit', query: { id } });
}

async function onDelete(row: any) {
  try {
    await ElMessageBox.confirm(
      `確定要刪除「${row.title || '(未命名)'}」嗎？此動作無法復原。`,
      '刪除確認',
      { type: 'warning', confirmButtonText: '刪除', cancelButtonText: '取消' },
    );
    remove(row.id);
    ElMessage({ type: 'success', message: '已刪除' });
  } catch {
    /* user cancelled */
  }
}

function onExport() {
  const json = exportJson();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dynamic-pages-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  ElMessage({ type: 'success', message: '已匯出 JSON' });
}

function onImport(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const result = importJson(String(reader.result));
    if (result.ok) {
      ElMessage({ type: 'success', message: `已匯入 ${result.count} 筆` });
      reload();
    } else {
      ElMessage({ type: 'error', message: `匯入失敗：${result.error}` });
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
  font-weight: 600;
  color: #303133;

  &.published { color: #67C23A; }
  &.drafts { color: #E6A23C; }
}

.summary-label {
  font-size: 13px;
  color: #909399;
}

.title-cell {
  font-weight: 500;
  color: #303133;
}

code {
  background: #F5F7FA;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
}
</style>
