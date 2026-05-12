<template>
  <main-header>
    <template #subtitle v-if="!isAdd">
      <sub class="sub-title sub-createDate">{{ formatDate(form.createDate) }}</sub>
      <sub class="sub-title sub-number">{{ recordId }}</sub>
    </template>

    <template #btnsRight>
      <el-button :icon="isPreviewOpen ? Close : View" size="large" plain @click="isPreviewOpen = !isPreviewOpen">
        {{ isPreviewOpen ? '隱藏預覽' : '顯示預覽' }}
      </el-button>
      <el-button :icon="Close" size="large" @click="onCancel">取消</el-button>
      <el-button :icon="Check" size="large" type="primary" :loading="saving" @click="onSave">儲存</el-button>
    </template>
  </main-header>

  <el-scrollbar class="main-scrollbar">
    <div class="layout" :class="{ 'preview-open': isPreviewOpen }">
      <div class="edit-pane">
        <div class="section-main-card card-fullsize">
          <div class="card-info">
            <div class="quick-start-head">
              <div>
                <h4 class="section-title no-border">快速開始</h4>
                <p class="section-note">先挑常用模板，再填頁面名稱，最後微調區塊內容。</p>
              </div>
              <span class="flow-badge">3 Steps</span>
            </div>

            <div class="preset-grid">
              <button
                v-for="preset in pagePresets"
                :key="preset.key"
                type="button"
                class="preset-card"
                :class="{ active: selectedPresetKey === preset.key }"
                @click="applyPreset(preset)"
              >
                <div class="preset-copy">
                  <strong>{{ preset.label }}</strong>
                  <span>{{ preset.description }}</span>
                </div>
                <span class="preset-structure">{{ preset.structure }}</span>
              </button>
            </div>

            <div class="basic-grid">
              <div class="item-group span-2" :class="{ 'has-error': errors.title }">
                <label class="input-title required">頁面名稱</label>
                <el-input
                  v-model="form.title"
                  placeholder="例如：關於我們、志工招募、最新公告"
                  size="large"
                  maxlength="80"
                  show-word-limit
                  @input="errors.title = ''"
                  @blur="onTitleBlur"
                />
                <span v-if="errors.title" class="field-error" role="alert">{{ errors.title }}</span>
              </div>

              <div class="item-group" :class="{ 'has-error': errors.slug }">
                <label class="input-title required">URL Slug</label>
                <el-input
                  v-model="form.slug"
                  placeholder="about/team 或 announcement-2026"
                  size="large"
                  maxlength="120"
                  @input="errors.slug = ''"
                >
                  <template #prepend>/</template>
                  <template #append>
                    <el-button :icon="Refresh" @click="regenerateSlug" title="依頁面名稱自動產生"></el-button>
                  </template>
                </el-input>
                <span v-if="errors.slug" class="field-error" role="alert">{{ errors.slug }}</span>
                <span v-else class="input-hint">可使用英文字、數字、`-`、`_`、`/`。</span>
              </div>

              <div class="item-group" :class="{ 'has-error': errors.status }">
                <label class="input-title required">頁面狀態</label>
                <el-radio-group v-model="form.status" @change="errors.status = ''">
                  <el-radio-button label="draft">草稿</el-radio-button>
                  <el-radio-button label="published">已發布</el-radio-button>
                  <el-radio-button label="unpublished">已下架</el-radio-button>
                </el-radio-group>
                <span v-if="errors.status" class="field-error" role="alert">{{ errors.status }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="section-main-card card-fullsize">
          <div class="card-info">
            <h4 class="section-title">
              頁面畫布
              <span class="section-subtitle">{{ form.sections.length }} 個區塊</span>
            </h4>

            <div class="builder-callout">
              <strong>給非工程人員的操作方式</strong>
              <span>左邊挑版型，中間拖拉組頁，點選區塊直接改內容，右邊同步看前台畫面。</span>
            </div>

            <SectionList :model-value="form.sections" />
          </div>
        </div>

        <div class="section-main-card card-fullsize">
          <div class="card-info">
            <button
              type="button"
              class="advanced-toggle"
              :aria-expanded="advancedOpen"
              @click="advancedOpen = !advancedOpen"
            >
              <span class="toggle-icon" :class="{ open: advancedOpen }">⌄</span>
              進階設定
              <span class="toggle-hint">SEO / 封面 / 分享圖 / 排程</span>
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
                    placeholder="建議 50-160 字，提供搜尋引擎與分享預覽使用"
                    maxlength="200"
                    show-word-limit
                  />
                </div>

                <div class="item-group">
                  <label class="input-title">標籤</label>
                  <el-input
                    :model-value="(form.tags || []).join(', ')"
                    placeholder="用逗號分隔，例如：公益, 志工, 服務"
                    @update:model-value="onTagsInput"
                  />
                  <div v-if="form.tags?.length" class="tags-preview">
                    <el-tag v-for="tag in form.tags" :key="tag" closable size="small" @close="removeTag(tag)">
                      {{ tag }}
                    </el-tag>
                  </div>
                </div>
              </div>

              <div class="advanced-section">
                <h5 class="advanced-section-title">封面與社群預覽</h5>

                <div class="item-group">
                  <label class="input-title">封面圖片</label>
                  <el-input v-model="form.coverImage" placeholder="https://... 或站內圖片路徑" />
                </div>

                <div v-if="form.coverImage" class="item-group">
                  <label class="input-title">封面替代文字</label>
                  <el-input v-model="form.coverImageAlt" placeholder="描述這張封面圖的內容" />
                  <div class="cover-preview">
                    <img :src="form.coverImage" :alt="form.coverImageAlt || form.title" />
                  </div>
                </div>

                <div class="item-group">
                  <label class="input-title">分享圖（OG Image）</label>
                  <el-input v-model="form.ogImage" placeholder="FB / LINE 分享時顯示的圖片" />
                  <span class="input-hint">建議尺寸 1200 x 630。</span>
                </div>
              </div>

              <div class="advanced-section">
                <h5 class="advanced-section-title">排程</h5>

                <div class="item-group-list">
                  <div class="item-group">
                    <label class="input-title">開始發布時間</label>
                    <el-date-picker
                      v-model="publishTimeModel"
                      type="datetime"
                      placeholder="不設定則立即生效"
                      format="YYYY/MM/DD HH:mm"
                      value-format="YYYY-MM-DDTHH:mm:00"
                      size="large"
                      clearable
                    />
                  </div>

                  <div class="item-group">
                    <label class="input-title">結束發布時間</label>
                    <el-date-picker
                      v-model="unpublishTimeModel"
                      type="datetime"
                      placeholder="不設定則持續上線"
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

      <aside v-if="isPreviewOpen" class="preview-pane-wrap">
        <div class="preview-sticky">
          <PreviewPane :page="form" />
        </div>
      </aside>
    </div>
  </el-scrollbar>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, reactive, ref, watch } from 'vue';
import {
  ElButton,
  ElDatePicker,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElRadioButton,
  ElRadioGroup,
  ElScrollbar,
  ElTag,
} from 'element-plus';
import { Check, Close, Refresh, View } from '@element-plus/icons-vue';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';
import MainHeader from '@/components/MainHeader.vue';
import PreviewPane from '@/components/PageBuilder/PreviewPane.vue';
import SectionList from '@/components/PageBuilder/SectionList.vue';
import {
  createDefaultPage,
  createDefaultSection,
  isSectionEmpty,
  slugify,
  useDynamicPages,
  validatePage,
  type DynamicPage,
  type Section,
} from '@/composables/useDynamicPages';

type PagePresetKey = 'blank' | 'story' | 'service' | 'campaign';

interface PagePresetOption {
  key: PagePresetKey;
  label: string;
  description: string;
  structure: string;
  suggestedTitle: string;
  suggestedSlug: string;
  buildSections: () => Section[];
}

const app = getCurrentInstance();
const $commonLib = app?.appContext.config.globalProperties.$CommonLib;
const route = useRoute();
const router = useRouter();

const { getById, insert, isSlugConflict, update } = useDynamicPages();

const routeNameType = route?.name?.toString().toLocaleLowerCase() || '';
const isAdd = routeNameType.includes('add');
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
const isPreviewOpen = ref(true);
const advancedOpen = ref(false);
const selectedPresetKey = ref<PagePresetKey | null>(isAdd ? 'blank' : null);
// 優化 A — 必填欄位 inline 錯誤訊息（field name → error message）
const errors = ref<Record<string, string>>({});

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

function buildHeroSection(title: string, shadowText: string, subtitle = ''): Section {
  const section = createDefaultSection('hero');
  if (section.type === 'hero') {
    section.title = title;
    section.shadowText = shadowText;
    section.subtitle = subtitle;
  }
  return section;
}

function buildTextSection(title: string, paragraphs: string[]): Section {
  const section = createDefaultSection('text-section');
  if (section.type === 'text-section') {
    section.title = title;
    section.paragraphs = paragraphs;
  }
  return section;
}

function buildImageTextSection(
  title: string,
  content: string,
  imagePosition: 'left' | 'right',
  ctaText = '',
  ctaUrl = '',
): Section {
  const section = createDefaultSection('image-text');
  if (section.type === 'image-text') {
    section.title = title;
    section.content = content;
    section.imagePosition = imagePosition;
    section.ctaText = ctaText;
    section.ctaUrl = ctaUrl;
  }
  return section;
}

function buildFourCardSection(title: string): Section {
  const section = createDefaultSection('four-card');
  if (section.type === 'four-card') {
    section.title = title;
  }
  return section;
}

function buildCtaCardSection(): Section {
  return createDefaultSection('cta-card');
}

const pagePresets: PagePresetOption[] = [
  {
    key: 'blank',
    label: '空白頁',
    description: '從零開始，自由拖拉組頁。',
    structure: '無預設區塊',
    suggestedTitle: '新頁面',
    suggestedSlug: 'new-page',
    buildSections: () => [],
  },
  {
    key: 'story',
    label: '介紹頁',
    description: '適合關於我們、服務介紹、單一主題說明。',
    structure: '主視覺 / 文字段落 / 圖文段落 / 行動卡',
    suggestedTitle: '關於我們',
    suggestedSlug: 'about-us',
    buildSections: () => [
      buildHeroSection('關於我們', 'ABOUT', '用一頁整理理念、故事與重點內容'),
      buildTextSection('品牌介紹', ['請輸入第一段介紹內容。', '請輸入第二段介紹內容。']),
      buildImageTextSection('主題說明', '這裡可以補充更多圖文說明內容。', 'right', '了解更多', '/contact'),
      buildCtaCardSection(),
    ],
  },
  {
    key: 'service',
    label: '圖文說明頁',
    description: '適合服務內容、流程教學、申請方式整理。',
    structure: '主視覺 / 四欄重點 / 圖文段落 / 文字段落',
    suggestedTitle: '服務內容',
    suggestedSlug: 'service-info',
    buildSections: () => [
      buildHeroSection('服務內容', 'SERVICE', '快速整理流程、對象與重點'),
      buildFourCardSection('服務重點'),
      buildImageTextSection('流程說明', '用圖片搭配文字說明申請或操作流程。', 'left'),
      buildTextSection('補充資訊', ['請輸入補充說明內容。']),
    ],
  },
  {
    key: 'campaign',
    label: '導流頁',
    description: '適合招募、捐款、活動報名等需要行動呼籲的頁面。',
    structure: '主視覺 / 圖文段落 / 行動卡',
    suggestedTitle: '立即行動',
    suggestedSlug: 'take-action',
    buildSections: () => [
      buildHeroSection('立即行動', 'ACTION', '先讓訪客看到主訴求，再引導下一步'),
      buildImageTextSection('活動說明', '說明這次的目標、方式與參與價值。', 'right', '立即報名', '/contact'),
      buildCtaCardSection(),
    ],
  },
];

const presetMap = new Map<PagePresetKey, PagePresetOption>(
  pagePresets.map((preset) => [preset.key, preset]),
);

if (!isAdd && recordId.value) {
  const existing = getById(recordId.value);

  if (existing) {
    Object.assign(form, JSON.parse(JSON.stringify(existing)));
    if (!Array.isArray(form.sections)) form.sections = [];
  } else {
    ElMessage({ type: 'error', message: '找不到要編輯的頁面' });
    router.replace({ name: 'PageManagement_DataList' });
  }
}

if (isAdd) {
  const presetKey = String(route.query.preset || '') as PagePresetKey;
  const preset = presetMap.get(presetKey);
  const queryTitle = String(route.query.title || '').trim();
  const querySlug = String(route.query.slug || '').trim();

  if (preset) {
    form.sections = preset.buildSections();
    form.title = queryTitle || preset.suggestedTitle;
    form.slug = querySlug || slugify(form.title || preset.suggestedSlug);
    selectedPresetKey.value = preset.key;
  } else if (queryTitle) {
    form.title = queryTitle;
    form.slug = querySlug || slugify(queryTitle);
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

function beforeUnloadHandler(event: BeforeUnloadEvent) {
  if (isDirty.value) {
    event.preventDefault();
    event.returnValue = '';
  }
}

window.addEventListener('beforeunload', beforeUnloadHandler);

onBeforeRouteLeave(async (_to, _from, next) => {
  if (!isDirty.value) {
    window.removeEventListener('beforeunload', beforeUnloadHandler);
    next();
    return;
  }

  try {
    await ElMessageBox.confirm(
      '目前還有未儲存的內容，離開後會遺失，確定要離開嗎？',
      '尚未儲存',
      {
        type: 'warning',
        confirmButtonText: '確定離開',
        cancelButtonText: '留在這頁',
      },
    );

    window.removeEventListener('beforeunload', beforeUnloadHandler);
    next();
  } catch {
    next(false);
  }
});

function hasMeaningfulContent() {
  return Boolean(
    form.title.trim() ||
      form.slug.trim() ||
      form.metaDescription.trim() ||
      form.coverImage?.trim() ||
      form.tags?.length ||
      form.sections.some((section) => !isSectionEmpty(section)),
  );
}

function assignPreset(preset: PagePresetOption) {
  form.sections = preset.buildSections();
  if (!form.title.trim() || isAdd) form.title = preset.suggestedTitle;
  if (!form.slug.trim() || isAdd) form.slug = slugify(form.title || preset.suggestedSlug);

  selectedPresetKey.value = preset.key;
  isPreviewOpen.value = true;
}

async function applyPreset(preset: PagePresetOption) {
  const shouldConfirm = hasMeaningfulContent() && selectedPresetKey.value !== preset.key;

  if (shouldConfirm) {
    try {
      await ElMessageBox.confirm(
        `套用「${preset.label}」會覆蓋目前的區塊內容，確定要繼續嗎？`,
        '套用頁面模板',
        {
          type: 'warning',
          confirmButtonText: '套用模板',
          cancelButtonText: '取消',
        },
      );
    } catch {
      return;
    }
  }

  assignPreset(preset);

  ElMessage({
    type: 'success',
    message: `已套用 ${preset.label}`,
  });
}

function regenerateSlug() {
  form.slug = slugify(form.title);
  ElMessage({ type: 'info', message: `已更新 slug：${form.slug}` });
}

function onTitleBlur() {
  if (isAdd && !form.slug.trim() && form.title.trim()) {
    form.slug = slugify(form.title);
  }
}

function onTagsInput(value: string) {
  form.tags = value
    .split(/[,，]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function removeTag(tag: string) {
  form.tags = (form.tags || []).filter((item) => item !== tag);
}

function formatDate(iso: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('sv').slice(0, 16);
  } catch {
    return iso;
  }
}

async function onCancel() {
  if (isDirty.value) {
    try {
      await ElMessageBox.confirm(
        '目前還有未儲存的內容，離開後會遺失，確定要離開嗎？',
        '尚未儲存',
        {
          type: 'warning',
          confirmButtonText: '確定離開',
          cancelButtonText: '留在這頁',
        },
      );
    } catch {
      return;
    }
  }

  router.go(-1);
}

function onSave() {
  const validationErrors = validatePage(form, isSlugConflict, isAdd ? undefined : form.id);

  // 優化 A — 先清空既有 inline errors，再依 validation 結果重填
  errors.value = {};

  if (validationErrors.length > 0) {
    validationErrors.forEach((e) => {
      errors.value[e.field] = e.message;
    });

    const firstError = validationErrors[0];
    ElMessage({
      type: 'warning',
      message: validationErrors.length === 1
        ? firstError.message
        : `${firstError.message}，另外還有 ${validationErrors.length - 1} 個欄位需要處理`,
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
    ElMessage({ type: 'success', message: '頁面已新增' });
    window.removeEventListener('beforeunload', beforeUnloadHandler);
    $commonLib?.GuideToPage('PageManagement_DataList');
    return;
  }

  update(form.id, payload);
  saving.value = false;
  isDirty.value = false;
  originalSnapshot = JSON.stringify(form);
  ElMessage({ type: 'success', message: '頁面已更新' });
  window.removeEventListener('beforeunload', beforeUnloadHandler);
  router.back();
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
  width: 720px;
  flex-shrink: 0;
}

.preview-sticky {
  position: sticky;
  top: 0;
  height: calc(100vh - 100px);
}

:deep(.preview-shell) {
  height: 100%;
}

@media (max-width: 1380px) {
  .layout.preview-open {
    flex-direction: column;
  }

  .preview-pane-wrap {
    width: 100%;
  }

  .preview-sticky {
    position: static;
    height: auto;
    min-height: 720px;
  }
}

.quick-start-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 18px;
}

.flow-badge {
  display: inline-flex;
  align-items: center;
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(234, 85, 4, 0.1);
  color: #ea5504;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.section-title {
  margin: 0 0 16px;
  font-size: 16px;
  color: #303133;
  font-weight: 700;
  padding-bottom: 10px;
  border-bottom: 2px solid #ea5504;
  display: flex;
  align-items: baseline;
  gap: 12px;

  &.no-border {
    margin-bottom: 6px;
    padding-bottom: 0;
    border-bottom: 0;
  }
}

.section-subtitle {
  font-size: 13px;
  color: #909399;
  font-weight: 400;
}

.section-note,
.section-help {
  margin: 0 0 14px;
  font-size: 13px;
  line-height: 1.7;
  color: #909399;
}

.section-help {
  background: #fafbfc;
  padding: 10px 12px;
  border-left: 3px solid #ea5504;
  border-radius: 0 8px 8px 0;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.preset-card {
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 14px;
  background: #ffffff;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;

  &:hover {
    border-color: #ea5504;
    transform: translateY(-1px);
    box-shadow: 0 12px 24px -18px rgba(234, 85, 4, 0.6);
  }

  &.active {
    border-color: #ea5504;
    background: linear-gradient(135deg, rgba(234, 85, 4, 0.08), rgba(255, 255, 255, 1));
  }
}

.preset-copy {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;

  strong {
    font-size: 15px;
    color: #303133;
  }

  span {
    font-size: 13px;
    line-height: 1.6;
    color: #606266;
  }
}

.preset-structure {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: #f5f7fa;
  color: #909399;
  font-size: 12px;
}

.basic-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.span-2 {
  grid-column: span 2;
}

.item-group {
  margin-bottom: 0;
}

.input-title {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #606266;

  &.required::after {
    content: ' *';
    color: #f56c6c;
  }
}

.input-hint {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: #909399;
}

// 優化 A — 必填欄位 inline 紅字 + el-input 紅框 + label 變紅
.field-error {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: #f56c6c;
  line-height: 1.5;
}

.has-error {
  :deep(.el-input__wrapper),
  :deep(.el-input-group__append),
  :deep(.el-input-group__prepend) {
    box-shadow: 0 0 0 1px #f56c6c inset !important;
  }

  :deep(.el-radio-button__inner) {
    border-color: #f56c6c;
  }

  .input-title {
    color: #f56c6c;
  }
}

.builder-callout {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0 0 14px;
  padding: 14px 16px;
  border: 1px solid rgba(234, 85, 4, 0.16);
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(234, 85, 4, 0.08), rgba(255, 247, 240, 0.9));

  strong {
    font-size: 14px;
    font-weight: 700;
    color: #303133;
  }

  span {
    font-size: 13px;
    line-height: 1.7;
    color: #606266;
  }
}

.advanced-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  background: #fafbfc;
  font-size: 14px;
  font-weight: 700;
  color: #303133;
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease;

  &:hover {
    border-color: #ea5504;
    background: #fff7f0;
  }
}

.toggle-icon {
  display: inline-flex;
  width: 18px;
  justify-content: center;
  transition: transform 0.2s ease;

  &.open {
    transform: rotate(180deg);
  }
}

.toggle-hint {
  margin-left: auto;
  font-size: 12px;
  color: #909399;
  font-weight: 400;
}

.advanced-content {
  padding-top: 16px;
}

.advanced-section {
  padding: 16px 0;
  border-bottom: 1px solid #ebeef5;

  &:last-child {
    border-bottom: 0;
    padding-bottom: 0;
  }
}

.advanced-section-title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 700;
  color: #303133;
}

.item-group-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.tags-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.cover-preview {
  margin-top: 12px;
  padding: 12px;
  border: 1px dashed #dcdfe6;
  border-radius: 12px;
  background: #fafbfc;
}

.cover-preview img {
  display: block;
  max-width: 100%;
  max-height: 220px;
  object-fit: contain;
}

@media (max-width: 960px) {
  .quick-start-head {
    flex-direction: column;
  }

  .preset-grid,
  .basic-grid,
  .item-group-list {
    grid-template-columns: 1fr;
  }

  .span-2 {
    grid-column: span 1;
  }

  .toggle-hint {
    display: none;
  }
}
</style>
