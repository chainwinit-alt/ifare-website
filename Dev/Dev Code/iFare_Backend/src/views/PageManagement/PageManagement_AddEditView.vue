<template>
  <main-header>
    <template #subtitle v-if="!isAdd">
      <sub class="sub-title sub-createDate">{{ formatDate(form.createDate) }}</sub>
      <sub class="sub-title sub-number">{{ recordId }}</sub>
    </template>
    <template #btnsRight>
      <el-button
        :icon="isPreviewOpen ? Close : View"
        size="large"
        plain
        @click="isPreviewOpen = !isPreviewOpen"
      >{{ isPreviewOpen ? '關閉預覽' : '預覽' }}</el-button>
      <el-button :icon="Close" size="large" @click="onCancel">取消</el-button>
      <el-button
        :icon="Check"
        size="large"
        type="primary"
        :loading="saving"
        @click="onSave"
      >儲存</el-button>
    </template>
  </main-header>

  <el-scrollbar class="main-scrollbar">
    <div class="layout" :class="{ 'preview-open': isPreviewOpen }">
      <div class="edit-pane">
        <!-- ① 主要設定 -->
        <div class="section-main-card card-fullsize">
          <div class="card-info">
            <h4 class="section-title">頁面基本設定</h4>

            <div class="item-group">
              <label class="input-title required">頁面標題</label>
              <el-input
                v-model="form.title"
                placeholder="輸入頁面標題（顯示於分頁標籤與搜尋結果）"
                size="large"
                maxlength="80"
                show-word-limit
                @blur="onTitleBlur"
              />
            </div>

            <div class="item-group">
              <label class="input-title required">URL Slug</label>
              <el-input
                v-model="form.slug"
                placeholder="例：about/team/abc 或 announcement-2026"
                size="large"
                maxlength="120"
              >
                <template #prepend>/</template>
                <template #append>
                  <el-button :icon="Refresh" @click="regenerateSlug" title="從標題重新產生">產生</el-button>
                </template>
              </el-input>
              <span class="input-hint">僅允許英數字、中文、連字號（-）、底線（_）、斜線（/）</span>
            </div>

            <div class="item-group">
              <label class="input-title required">發布狀態</label>
              <el-radio-group v-model="form.status">
                <el-radio-button label="draft">草稿</el-radio-button>
                <el-radio-button label="published">已發布</el-radio-button>
                <el-radio-button label="unpublished">已下架</el-radio-button>
              </el-radio-group>
            </div>
          </div>
        </div>

        <!-- ② 內容區段（使用範本） -->
        <div class="section-main-card card-fullsize">
          <div class="card-info">
            <h4 class="section-title">
              內容區段
              <span class="section-subtitle">{{ form.sections.length }} 個區段</span>
            </h4>
            <p class="section-help">
              👇 從範本選擇器選一個區塊（範本會自動套用 iFare 設計樣式），填入內容後儲存即可。
            </p>
            <SectionList :model-value="form.sections" />
          </div>
        </div>

        <!-- ③ 進階設定（折疊） -->
        <div class="section-main-card card-fullsize">
          <div class="card-info">
            <button
              type="button"
              class="advanced-toggle"
              @click="advancedOpen = !advancedOpen"
              :aria-expanded="advancedOpen"
            >
              <span class="toggle-icon" :class="{ open: advancedOpen }">▶</span>
              進階設定
              <span class="toggle-hint">SEO / 封面 / 排程 / 標籤</span>
            </button>

            <div v-show="advancedOpen" class="advanced-content">
              <div class="advanced-section">
                <h5 class="advanced-section-title">SEO 與分享</h5>
                <div class="item-group">
                  <label class="input-title">SEO 描述</label>
                  <el-input
                    v-model="form.metaDescription"
                    type="textarea"
                    :rows="2"
                    placeholder="搜尋引擎與社群分享預覽用的簡短描述（建議 50-160 字）"
                    maxlength="200"
                    show-word-limit
                  />
                </div>
                <div class="item-group">
                  <label class="input-title">標籤</label>
                  <el-input
                    :model-value="(form.tags || []).join(', ')"
                    placeholder="多個標籤用半形逗號分隔，例：教育, 兒童, 永續"
                    @update:model-value="onTagsInput"
                  />
                  <div v-if="form.tags?.length" class="tags-preview">
                    <el-tag
                      v-for="t in form.tags"
                      :key="t"
                      closable
                      size="small"
                      @close="removeTag(t)"
                    >{{ t }}</el-tag>
                  </div>
                </div>
              </div>

              <div class="advanced-section">
                <h5 class="advanced-section-title">封面與社群預覽</h5>
                <div class="item-group">
                  <label class="input-title">封面圖網址</label>
                  <el-input v-model="form.coverImage" placeholder="顯示於頁面頂部與列表縮圖" />
                </div>
                <div v-if="form.coverImage" class="item-group">
                  <label class="input-title">封面替代文字</label>
                  <el-input v-model="form.coverImageAlt" placeholder="無障礙必填" />
                  <div class="cover-preview">
                    <img :src="form.coverImage" :alt="form.coverImageAlt || form.title" />
                  </div>
                </div>
                <div class="item-group">
                  <label class="input-title">社群分享預覽圖 (OG image)</label>
                  <el-input v-model="form.ogImage" placeholder="FB / LINE 分享時顯示的縮圖（建議 1200×630）" />
                  <span class="input-hint">未填則使用「封面圖」</span>
                </div>
              </div>

              <div class="advanced-section">
                <h5 class="advanced-section-title">排程</h5>
                <div class="item-group-list">
                  <div class="item-group">
                    <label class="input-title">排程上架時間</label>
                    <el-date-picker
                      v-model="publishTimeModel"
                      type="datetime"
                      placeholder="未來時間 = 排程"
                      format="YYYY/MM/DD HH:mm"
                      value-format="YYYY-MM-DDTHH:mm:00"
                      size="large"
                      clearable
                    />
                  </div>
                  <div class="item-group">
                    <label class="input-title">排程下架時間</label>
                    <el-date-picker
                      v-model="unpublishTimeModel"
                      type="datetime"
                      placeholder="未來時間 = 排程"
                      format="YYYY/MM/DD HH:mm"
                      value-format="YYYY-MM-DDTHH:mm:00"
                      size="large"
                      clearable
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 預覽 Pane -->
      <aside v-if="isPreviewOpen" class="preview-pane-wrap">
        <div class="preview-sticky">
          <div class="preview-toolbar">
            <span>📱 即時預覽</span>
            <span class="preview-hint">內容存檔後即按此外觀渲染</span>
          </div>
          <PreviewPane :page="form" />
        </div>
      </aside>
    </div>
  </el-scrollbar>
</template>

<script setup lang="ts">
import { reactive, computed, getCurrentInstance, ref, watch } from 'vue';
import {
  ElButton,
  ElScrollbar,
  ElInput,
  ElRadioGroup,
  ElRadioButton,
  ElDatePicker,
  ElTag,
  ElMessage,
  ElMessageBox,
} from 'element-plus';
import { Close, Check, View, Refresh } from '@element-plus/icons-vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import MainHeader from '@/components/MainHeader.vue';
import SectionList from '@/components/PageBuilder/SectionList.vue';
import PreviewPane from '@/components/PageBuilder/PreviewPane.vue';
import {
  useDynamicPages,
  createDefaultPage,
  validatePage,
  slugify,
  type DynamicPage,
} from '@/composables/useDynamicPages';

const app = getCurrentInstance();
const $commonLib = app?.appContext.config.globalProperties.$CommonLib;
const route = useRoute();
const router = useRouter();

const { getById, isSlugConflict, insert, update } = useDynamicPages();

const routeNameType = route?.name?.toString().toLocaleLowerCase() || '';
const isAdd = routeNameType.indexOf('add') >= 0;
const recordId = computed(() => (route.query.id ? String(route.query.id) : ''));

const form = reactive<DynamicPage>({
  id: '',
  ...createDefaultPage(),
  createDate: '',
  updateDate: '',
});

let originalSnapshot = '';
const isDirty = ref(false);
const saving = ref(false);
const isPreviewOpen = ref(false);
const advancedOpen = ref(false);

const publishTimeModel = computed<string | undefined>({
  get: () => form.publishTime ?? undefined,
  set: (value) => {
    form.publishTime = value ?? null;
  },
});

const unpublishTimeModel = computed<string | undefined>({
  get: () => form.unpublishTime ?? undefined,
  set: (value) => {
    form.unpublishTime = value ?? null;
  },
});

// 編輯模式 — 載入既有資料
if (!isAdd && recordId.value) {
  const existing = getById(recordId.value);
  if (existing) {
    Object.assign(form, JSON.parse(JSON.stringify(existing)));
    // 確保 sections 是陣列（向後相容）
    if (!Array.isArray(form.sections)) form.sections = [];
  } else {
    ElMessage({ type: 'error', message: '找不到指定的頁面資料' });
    router.replace({ name: 'PageManagement_DataList' });
  }
}
originalSnapshot = JSON.stringify(form);

watch(
  () => form,
  () => {
    isDirty.value = JSON.stringify(form) !== originalSnapshot;
  },
  { deep: true },
);

function beforeUnloadHandler(e: BeforeUnloadEvent) {
  if (isDirty.value) {
    e.preventDefault();
    e.returnValue = '';
  }
}
window.addEventListener('beforeunload', beforeUnloadHandler);

onBeforeRouteLeave(async (_to, _from, next) => {
  if (!isDirty.value) {
    window.removeEventListener('beforeunload', beforeUnloadHandler);
    return next();
  }
  try {
    await ElMessageBox.confirm(
      '頁面有未儲存的變更，確定要離開嗎？',
      '未儲存',
      { type: 'warning', confirmButtonText: '離開（不儲存）', cancelButtonText: '繼續編輯' },
    );
    window.removeEventListener('beforeunload', beforeUnloadHandler);
    next();
  } catch {
    next(false);
  }
});

function regenerateSlug() {
  form.slug = slugify(form.title);
  ElMessage({ type: 'info', message: `已產生 slug：/${form.slug}` });
}

function onTitleBlur() {
  if (isAdd && !form.slug.trim() && form.title.trim()) {
    form.slug = slugify(form.title);
  }
}

function onTagsInput(val: string) {
  form.tags = val
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function removeTag(tag: string) {
  form.tags = (form.tags || []).filter((t) => t !== tag);
}

function formatDate(iso: string): string {
  if (!iso) return '';
  try { return new Date(iso).toLocaleString('sv').slice(0, 16); }
  catch { return iso; }
}

async function onCancel() {
  if (isDirty.value) {
    try {
      await ElMessageBox.confirm(
        '頁面有未儲存的變更，確定要離開嗎？',
        '未儲存',
        { type: 'warning', confirmButtonText: '離開（不儲存）', cancelButtonText: '繼續編輯' },
      );
    } catch {
      return;
    }
  }
  router.go(-1);
}

function onSave() {
  const errors = validatePage(form, isSlugConflict, isAdd ? undefined : form.id);
  if (errors.length > 0) {
    const first = errors[0];
    ElMessage({
      type: 'warning',
      message: errors.length === 1 ? first.message : `${first.message}（共 ${errors.length} 個問題）`,
      duration: 4000,
    });
    return;
  }

  saving.value = true;
  const payload = {
    slug: form.slug,
    title: form.title,
    metaDescription: form.metaDescription,
    coverImage: form.coverImage,
    coverImageAlt: form.coverImageAlt,
    ogImage: form.ogImage,
    publishTime: form.publishTime || null,
    unpublishTime: form.unpublishTime || null,
    tags: form.tags || [],
    author: form.author || '',
    sections: form.sections,
    status: form.status,
  };

  if (isAdd) {
    insert(payload);
    saving.value = false;
    isDirty.value = false;
    originalSnapshot = JSON.stringify(form);
    ElMessage({ type: 'success', message: '新增成功' });
    window.removeEventListener('beforeunload', beforeUnloadHandler);
    $commonLib?.GuideToPage('PageManagement_DataList');
  } else {
    update(form.id, payload);
    saving.value = false;
    isDirty.value = false;
    originalSnapshot = JSON.stringify(form);
    ElMessage({ type: 'success', message: '編輯成功' });
    window.removeEventListener('beforeunload', beforeUnloadHandler);
    router.back();
  }
}
</script>

<style lang="scss" scoped>
.layout {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.edit-pane {
  flex: 1;
  min-width: 0;
}

.preview-pane-wrap {
  width: 640px;
  flex-shrink: 0;
}

.preview-sticky {
  position: sticky;
  top: 0;
  background: #FAFBFC;
  border: 1px solid #E4E7ED;
  border-radius: 8px;
  overflow: hidden;
  height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
}

.preview-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: #303133;
  color: #FFFFFF;
  font-size: 13px;
  flex-shrink: 0;

  .preview-hint { font-size: 11px; opacity: 0.7; }
}

// 讓 PreviewPane (iframe wrap) 填滿剩餘高度
:deep(.preview-iframe-wrap) {
  flex: 1;
  min-height: 0;
}

@media (max-width: 1280px) {
  .layout.preview-open { flex-direction: column; }
  .preview-pane-wrap { width: 100%; }
  .preview-sticky { position: static; max-height: none; }
}

.section-title {
  margin: 0 0 16px;
  font-size: 16px;
  color: #303133;
  font-weight: 600;
  padding-bottom: 10px;
  border-bottom: 2px solid #EA5504;
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.section-subtitle {
  font-size: 13px;
  color: #909399;
  font-weight: normal;
}

.section-help {
  margin: 0 0 14px;
  font-size: 13px;
  color: #909399;
  background: #FAFBFC;
  padding: 10px 12px;
  border-left: 3px solid #EA5504;
  border-radius: 0 4px 4px 0;
}

.input-hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.item-group {
  margin-bottom: 18px;

  .input-title {
    display: block;
    margin-bottom: 6px;
    font-size: 14px;
    font-weight: 500;
    color: #606266;

    &.required::after {
      content: ' *';
      color: #F56C6C;
    }
  }
}

.item-group-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 768px) {
  .item-group-list { grid-template-columns: 1fr; }
}

.tags-preview {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.cover-preview {
  margin-top: 8px;
  padding: 8px;
  border: 1px dashed #DCDFE6;
  border-radius: 4px;
  background: #F5F7FA;

  img {
    max-width: 100%;
    max-height: 220px;
    object-fit: cover;
    border-radius: 4px;
    display: block;
    margin: 0 auto;
  }
}

// ── 進階設定折疊 ──
.advanced-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #FAFBFC;
  border: 1px solid #E4E7ED;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  cursor: pointer;
  text-align: left;
  transition: background 0.2s ease;

  &:hover { background: #F5F7FA; }

  .toggle-icon {
    display: inline-block;
    transition: transform 0.2s ease;
    color: #909399;
    font-size: 10px;
    &.open { transform: rotate(90deg); }
  }

  .toggle-hint {
    margin-left: auto;
    font-size: 12px;
    color: #909399;
    font-weight: 400;
  }
}

.advanced-content {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.advanced-section {
  padding: 14px;
  background: #FAFBFC;
  border: 1px dashed #DCDFE6;
  border-radius: 6px;

  .advanced-section-title {
    margin: 0 0 14px;
    font-size: 13px;
    color: #606266;
    font-weight: 600;
    padding-bottom: 6px;
    border-bottom: 1px solid #DCDFE6;
  }
}
</style>
