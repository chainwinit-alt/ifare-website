<template>
  <!-- 2026-05-25 #95 ImagePicker — 從媒體庫挑既有圖 / 上傳新圖，取代手打 URL -->
  <div class="image-picker">
    <el-input v-model="localValue" :placeholder="placeholder || 'https://... 或站內圖片路徑'" size="default">
      <template #append>
        <el-button :icon="Picture" @click="openDialog" title="從媒體庫挑圖或上傳">挑圖片</el-button>
      </template>
    </el-input>

    <div v-if="showPreview && localValue" class="image-picker-preview">
      <img :src="localValue" :alt="placeholder || '預覽'" @error="onPreviewError" />
      <span v-if="previewError" class="preview-error">圖片載入失敗，請確認網址或重新挑圖</span>
    </div>

    <el-dialog
      v-model="dialogOpen"
      title="挑選圖片"
      width="780px"
      top="6vh"
      destroy-on-close
      append-to-body
      @open="onDialogOpen"
    >
      <el-tabs v-model="activeTab">
        <!-- 媒體庫 -->
        <el-tab-pane name="library">
          <template #label>
            <span>🖼️ 媒體庫 <el-tag size="small">{{ assets.length }}</el-tag></span>
          </template>

          <div v-if="loading" class="library-loading">載入中…</div>
          <div v-else-if="loadError" class="library-error">
            {{ loadError }}
            <el-button size="small" plain @click="loadAssets">重試</el-button>
          </div>
          <div v-else-if="assets.length === 0" class="library-empty">
            還沒有上傳過任何圖片，切到「上傳新圖片」加入第一張。
          </div>
          <div v-else class="library-grid">
            <button
              v-for="asset in assets"
              :key="asset.filename"
              type="button"
              class="library-item"
              :class="{ active: matchesValue(asset) }"
              @click="selectAsset(asset)"
            >
              <div class="library-thumb">
                <img :src="asset.url" :alt="asset.filename" loading="lazy" />
              </div>
              <div class="library-meta">
                <strong :title="asset.filename">{{ asset.filename }}</strong>
                <span>{{ formatSize(asset.size) }} · {{ formatDate(asset.mtime) }}</span>
              </div>
            </button>
          </div>
        </el-tab-pane>

        <!-- 上傳新圖 -->
        <el-tab-pane name="upload">
          <template #label>
            <span>⬆️ 上傳新圖片</span>
          </template>

          <div
            class="upload-zone"
            :class="{ dragging: isDragging, uploading }"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="onDrop"
            @click="triggerFilePick"
          >
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              class="upload-file-input"
              @change="onFileInput"
            />
            <div v-if="uploading" class="upload-status">
              <span class="upload-spinner"></span>
              <span>上傳中…</span>
            </div>
            <div v-else>
              <div class="upload-icon">⬆</div>
              <p><strong>拖曳圖片到這裡</strong> 或 <span class="upload-browse">點此選檔</span></p>
              <p class="upload-hint">支援 JPG / PNG / WebP / GIF / AVIF / SVG，最大 8 MB</p>
            </div>
          </div>

          <p v-if="uploadError" class="upload-error">{{ uploadError }}</p>
        </el-tab-pane>

        <!-- 外部 URL -->
        <el-tab-pane name="external">
          <template #label>
            <span>🔗 貼網址</span>
          </template>
          <div class="external-form">
            <label>貼上完整圖片網址</label>
            <el-input
              v-model="externalUrl"
              placeholder="例如：https://i.imgur.com/example.png"
              size="large"
              @keyup.enter="confirmExternal"
            />
            <span v-if="externalError" class="external-error">{{ externalError }}</span>
            <div class="external-actions">
              <el-button @click="dialogOpen = false">取消</el-button>
              <el-button type="primary" @click="confirmExternal">使用這個網址</el-button>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  ElButton,
  ElDialog,
  ElInput,
  ElMessage,
  ElTabs,
  ElTabPane,
  ElTag,
} from 'element-plus';
import { Picture } from '@element-plus/icons-vue';
import {
  FRONTEND_ASSET_LIST_URL,
  FRONTEND_ASSET_UPLOAD_URL,
  FRONTEND_DYNAMIC_API_TOKEN,
} from '@/config/adminEnv';

interface Asset {
  filename: string;
  size: number;
  mtime: string;
  path: string;
  url: string;
}

const props = defineProps<{
  modelValue: string;
  placeholder?: string;
  showPreview?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const localValue = computed({
  get: () => props.modelValue || '',
  set: (v) => emit('update:modelValue', v),
});

const MAX_IMAGE_UPLOAD_SIZE = 8 * 1024 * 1024;

const dialogOpen = ref(false);
const activeTab = ref<'library' | 'upload' | 'external'>('library');
const assets = ref<Asset[]>([]);
const loading = ref(false);
const loadError = ref('');
const externalUrl = ref('');
const externalError = ref('');
const previewError = ref(false);

const fileInputRef = ref<HTMLInputElement | null>(null);
const uploading = ref(false);
const uploadError = ref('');
const isDragging = ref(false);

function openDialog() {
  const v = localValue.value.trim();
  if (/^https?:\/\//i.test(v) && !v.includes('/api/dynamic-assets/')) {
    activeTab.value = 'external';
    externalUrl.value = v;
  } else {
    activeTab.value = 'library';
  }
  externalError.value = '';
  uploadError.value = '';
  dialogOpen.value = true;
}

function onDialogOpen() {
  if (activeTab.value === 'library') loadAssets();
}

async function loadAssets() {
  if (!FRONTEND_ASSET_LIST_URL) {
    loadError.value = 'VITE_FRONTEND_ASSET_LIST_URL or VITE_FRONTEND_BASE is not configured';
    return;
  }

  loading.value = true;
  loadError.value = '';
  try {
    const headers: Record<string, string> = {};
    if (FRONTEND_DYNAMIC_API_TOKEN) {
      headers['X-iFare-Sync-Token'] = FRONTEND_DYNAMIC_API_TOKEN;
    }
    const res = await fetch(FRONTEND_ASSET_LIST_URL, { headers });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    const data = (await res.json()) as { ok: boolean; assets: Asset[] };
    assets.value = data.assets || [];
  } catch (err) {
    loadError.value = `載入媒體庫失敗：${err instanceof Error ? err.message : String(err)}`;
  } finally {
    loading.value = false;
  }
}

function matchesValue(asset: Asset): boolean {
  const v = localValue.value.trim();
  return v === asset.url || v === asset.path;
}

function selectAsset(asset: Asset) {
  localValue.value = asset.url;
  previewError.value = false;
  dialogOpen.value = false;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('sv').slice(0, 16);
  } catch {
    return iso;
  }
}

function triggerFilePick() {
  if (uploading.value) return;
  fileInputRef.value?.click();
}

function onFileInput(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) uploadFile(file);
  input.value = '';
}

function onDrop(event: DragEvent) {
  isDragging.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (file) uploadFile(file);
}

async function uploadFile(file: File) {
  uploadError.value = '';

  if (!FRONTEND_ASSET_UPLOAD_URL) {
    uploadError.value = 'VITE_FRONTEND_ASSET_UPLOAD_URL or VITE_FRONTEND_BASE is not configured';
    return;
  }

  if (!file.type.startsWith('image/')) {
    uploadError.value = '請選擇圖片檔案';
    return;
  }
  if (file.size > MAX_IMAGE_UPLOAD_SIZE) {
    uploadError.value = '圖片不可超過 8 MB，請壓縮後再上傳';
    return;
  }

  uploading.value = true;
  try {
    const formData = new FormData();
    formData.append('file', file);
    const headers: Record<string, string> = {};
    if (FRONTEND_DYNAMIC_API_TOKEN) {
      headers['X-iFare-Sync-Token'] = FRONTEND_DYNAMIC_API_TOKEN;
    }
    const res = await fetch(FRONTEND_ASSET_UPLOAD_URL, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      throw new Error(await res.text());
    }
    const result = (await res.json()) as { url?: string; path?: string; filename?: string };
    const url = result.url || result.path || '';
    if (!url) throw new Error('上傳成功但回傳沒有 URL');

    ElMessage.success('圖片已上傳');
    localValue.value = url;
    previewError.value = false;
    dialogOpen.value = false;
  } catch (err) {
    uploadError.value = `上傳失敗：${err instanceof Error ? err.message : String(err)}`;
  } finally {
    uploading.value = false;
  }
}

function confirmExternal() {
  const v = externalUrl.value.trim();
  if (!v) {
    externalError.value = '請輸入網址';
    return;
  }
  if (!/^https?:\/\//i.test(v)) {
    externalError.value = '網址需以 https:// 或 http:// 開頭';
    return;
  }
  externalError.value = '';
  localValue.value = v;
  previewError.value = false;
  dialogOpen.value = false;
}

function onPreviewError() {
  previewError.value = true;
}

watch(
  () => localValue.value,
  () => {
    previewError.value = false;
  },
);

watch(activeTab, (val) => {
  if (val === 'library' && assets.value.length === 0) loadAssets();
});
</script>

<style lang="scss" scoped>
.image-picker {
  width: 100%;
}

.image-picker-preview {
  margin-top: 8px;
  padding: 10px;
  border: 1px dashed #dcdfe6;
  border-radius: 10px;
  background: #fafbfc;

  img {
    display: block;
    max-width: 100%;
    max-height: 160px;
    object-fit: contain;
  }
}

.preview-error {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: #f56c6c;
}

.library-loading,
.library-error,
.library-empty {
  padding: 32px;
  text-align: center;
  color: #909399;
  font-size: 13px;
  background: #fafbfc;
  border: 1px dashed #dcdfe6;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.library-error {
  color: #f56c6c;
}

.library-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  max-height: 55vh;
  overflow-y: auto;
}

.library-item {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0;
  border: 1px solid #e4e7ed;
  border-radius: 10px;
  background: #ffffff;
  cursor: pointer;
  text-align: left;
  overflow: hidden;
  transition: all 0.18s ease;

  &:hover {
    border-color: #ea5504;
    transform: translateY(-1px);
    box-shadow: 0 8px 16px -12px rgba(234, 85, 4, 0.5);
  }

  &.active {
    border-color: #ea5504;
    box-shadow: 0 0 0 2px rgba(234, 85, 4, 0.25);
  }
}

.library-thumb {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
}

.library-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  min-width: 0;

  strong {
    font-size: 12px;
    color: #303133;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  span {
    font-size: 11px;
    color: #909399;
  }
}

.upload-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 48px 24px;
  border: 2px dashed #dcdfe6;
  border-radius: 14px;
  background: #fafbfc;
  cursor: pointer;
  transition: all 0.18s ease;
  text-align: center;
  color: #606266;

  &:hover,
  &.dragging {
    border-color: #ea5504;
    background: rgba(234, 85, 4, 0.04);
  }

  &.uploading {
    cursor: progress;
  }

  p {
    margin: 0;
    font-size: 14px;
    line-height: 1.6;
  }

  strong {
    color: #303133;
  }
}

.upload-browse {
  color: #ea5504;
  font-weight: 700;
  text-decoration: underline;
}

.upload-icon {
  font-size: 36px;
  color: #c0c4cc;
  margin-bottom: 6px;
}

.upload-hint {
  color: #909399;
  font-size: 12px;
}

.upload-file-input {
  display: none;
}

.upload-status {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #ea5504;
  font-weight: 600;
}

.upload-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(234, 85, 4, 0.3);
  border-top-color: #ea5504;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.upload-error,
.external-error {
  display: block;
  margin-top: 10px;
  font-size: 12px;
  color: #f56c6c;
}

.external-form {
  display: flex;
  flex-direction: column;
  gap: 10px;

  label {
    font-size: 13px;
    font-weight: 600;
    color: #606266;
  }
}

.external-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}
</style>
