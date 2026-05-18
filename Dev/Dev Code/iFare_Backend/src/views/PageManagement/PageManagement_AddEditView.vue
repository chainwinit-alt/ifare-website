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
                <span v-if="!errors.title" class="input-hint">這個名稱會作為後台辨識主標題，通常也是前台頁面標題的基礎。</span>
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
                <span v-else class="input-hint" :class="{ 'is-success': slugStatus === 'available' }">{{ slugHintText }}</span>
                <div class="url-preview">
                  <span class="preview-label">前台網址預覽</span>
                  <code>{{ pageUrlPreview }}</code>
                </div>
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
                  <div class="seo-preview">
                    <span class="preview-label">搜尋結果預覽</span>
                    <strong>{{ seoPreviewTitle }}</strong>
                    <code>{{ pageUrlPreview }}</code>
                    <p>{{ seoPreviewDescription }}</p>
                  </div>
                </div>

                <div class="item-group">
                  <label class="input-title">標籤</label>
                  <el-input
                    :model-value="(form.tags || []).join(', ')"
                    placeholder="用逗號分隔，例如：公益, 志工, 服務"
                    @update:model-value="onTagsInput"
                  />
                  <div class="tag-suggestions">
                    <span class="preview-label">常用標籤</span>
                    <div class="tag-suggestion-list">
                      <button
                        v-for="tag in suggestedTags"
                        :key="tag"
                        type="button"
                        class="tag-suggestion-chip"
                        @click="applySuggestedTag(tag)"
                      >
                        + {{ tag }}
                      </button>
                    </div>
                  </div>
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
                    <div class="quick-action-row">
                      <button type="button" class="quick-action-chip" @click="setPublishNow">立即發布</button>
                      <button type="button" class="quick-action-chip" @click="setPublishAtHour(18)">今天 18:00</button>
                      <button type="button" class="quick-action-chip" @click="setPublishTomorrowMorning">明天 09:00</button>
                    </div>
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
                    <div class="quick-action-row">
                      <button type="button" class="quick-action-chip" @click="clearUnpublishTime">不設定下架</button>
                      <button type="button" class="quick-action-chip" @click="setUnpublishAfterDays(7)">7 天後</button>
                      <button type="button" class="quick-action-chip" @click="setUnpublishAfterDays(30)">30 天後</button>
                    </div>
                  </div>
                </div>

                <div class="schedule-summary">
                  <strong>{{ publishStatusHeadline }}</strong>
                  <p>{{ publishStatusDescription }}</p>
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
import { computed, getCurrentInstance, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import {
  ElButton,
  ElDatePicker,
  ElInput,
  ElMessageBox,
  ElRadioButton,
  ElRadioGroup,
  ElScrollbar,
  ElTag,
} from 'element-plus';
import { useFeedback } from '@/composables/useFeedback';
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

interface DraftSnapshot {
  form: DynamicPage;
  selectedPresetKey: PagePresetKey | null;
  savedAt: string;
}

type DraftState = 'idle' | 'saving' | 'saved' | 'restored';

const AUTOSAVE_DELAY_MS = 1200;
const SLUG_CHECK_DELAY_MS = 300;
const DRAFT_STORAGE_PREFIX = 'ifare:page-management:draft:v1';
const SLUG_PATTERN = /^[a-zA-Z0-9/_-]+$/;

const app = getCurrentInstance();
const $commonLib = app?.appContext.config.globalProperties.$CommonLib;
const route = useRoute();
const router = useRouter();

const { getById, insert, isSlugConflict, update } = useDynamicPages();
const { success, error: showError, info, warning } = useFeedback();

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
const suggestedTags = ['基金會介紹', '活動公告', '志工招募', '補助資訊', '常見問題', '專案成果'];
const slugStatus = ref<'idle' | 'checking' | 'available'>('idle');
const draftState = ref<DraftState>('idle');
const draftSavedAt = ref('');

const draftStorageKey = computed(() => `${DRAFT_STORAGE_PREFIX}:${isAdd ? 'new' : recordId.value || 'new'}`);
const slugHintText = computed(() => {
  if (!form.slug.trim()) return '通常不用手動重打，可先輸入頁面名稱再按右側按鈕自動產生。';
  if (slugStatus.value === 'checking') return '正在檢查這個網址是否已被其他頁面使用。';
  if (slugStatus.value === 'available') return '這個 slug 目前可使用。';
  return '通常不用手動重打，可先輸入頁面名稱再按右側按鈕自動產生。';
});
const draftStatusTitle = computed(() => {
  switch (draftState.value) {
    case 'saving':
      return '正在自動暫存草稿';
    case 'saved':
      return '草稿已自動暫存';
    case 'restored':
      return '已還原暫存草稿';
    default:
      return '離開前會自動暫存草稿';
  }
});
const draftStatusDescription = computed(() => {
  if (draftState.value === 'saving') return '系統會在你停止輸入後自動保存，避免新增頁內容遺失。';
  if (draftSavedAt.value) {
    const savedAtLabel = formatDate(draftSavedAt.value);
    if (draftState.value === 'restored') return `目前使用 ${savedAtLabel} 的暫存版本，可直接接著編輯。`;
    if (draftState.value === 'saved') return `最近一次暫存時間：${savedAtLabel}，正式儲存後會自動清除。`;
  }
  return '若未正式儲存就離開頁面，系統會保留一份草稿供下次繼續。';
});

let autosaveTimer: ReturnType<typeof setTimeout> | null = null;
let slugCheckTimer: ReturnType<typeof setTimeout> | null = null;
let isDraftReady = false;

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

const pageUrlPreview = computed(() => `/${(form.slug || 'your-page-slug').replace(/^\/+/, '')}`);

const statusSummaryTitle = computed(() => {
  switch (form.status) {
    case 'published':
      return '目前設定為前台可見';
    case 'unpublished':
      return '目前設定為前台隱藏';
    default:
      return '目前先存為草稿';
  }
});

const statusSummaryDescription = computed(() => {
  switch (form.status) {
    case 'published':
      return '適合已確認內容的頁面。若同時設定開始 / 結束時間，前台會依排程顯示。';
    case 'unpublished':
      return '頁面內容保留在後台，但前台不顯示。適合暫時下架或活動結束後保留資料。';
    default:
      return '草稿不會直接顯示在前台，適合先整理內容、等確認後再發布。';
  }
});

const seoPreviewTitle = computed(() => form.title.trim() || '頁面標題會顯示在這裡');
const seoPreviewDescription = computed(() => {
  if (form.metaDescription.trim()) return form.metaDescription.trim();
  return '尚未填寫 SEO 描述。建議補一段 50-160 字摘要，方便搜尋結果與分享卡片顯示。';
});

const publishStatusHeadline = computed(() => {
  if (form.status === 'draft') return '前台目前不會顯示這頁';
  if (form.publishTime && form.unpublishTime) return '這頁會依照開始與結束時間自動上下架';
  if (form.publishTime) return '這頁已設定預計上線時間';
  if (form.unpublishTime) return '這頁已設定預計下架時間';
  if (form.status === 'published') return '這頁目前會持續顯示在前台';
  return '這頁目前是手動下架狀態';
});

const publishStatusDescription = computed(() => {
  if (form.status === 'draft') {
    return '適合還在編輯中的內容。完成後可改成已發布，或直接設定未來上線時間。';
  }

  const start = form.publishTime ? formatDate(form.publishTime) : '未設定';
  const end = form.unpublishTime ? formatDate(form.unpublishTime) : '未設定';
  return `開始發布：${start}；結束發布：${end}。如果兩者都不設定，系統會依目前狀態直接顯示或隱藏。`;
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
    showError('找不到要編輯的頁面');
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
    queueDraftSave();
  },
  { deep: true },
);

watch(selectedPresetKey, () => {
  queueDraftSave();
});

watch(
  () => form.slug,
  (value) => {
    scheduleSlugCheck(value);
  },
);

function beforeUnloadHandler(event: BeforeUnloadEvent) {
  if (isDirty.value) {
    event.preventDefault();
    event.returnValue = '';
  }
}

function clearAutosaveTimer() {
  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
    autosaveTimer = null;
  }
}

function clearSlugCheckTimer() {
  if (slugCheckTimer) {
    clearTimeout(slugCheckTimer);
    slugCheckTimer = null;
  }
}

function resetDraftStatus() {
  draftState.value = 'idle';
  draftSavedAt.value = '';
}

function removeDraftStorage() {
  clearAutosaveTimer();
  localStorage.removeItem(draftStorageKey.value);
  resetDraftStatus();
}

function normalizeDraftPage(snapshot: Partial<DynamicPage>): DynamicPage {
  const parsed = JSON.parse(JSON.stringify(snapshot || {})) as Partial<DynamicPage>;
  return {
    id: parsed.id || '',
    ...createDefaultPage(),
    createDate: parsed.createDate || '',
    updateDate: parsed.updateDate || '',
    ...parsed,
    tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    sections: Array.isArray(parsed.sections) ? parsed.sections : [],
  };
}

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

function persistDraft() {
  clearAutosaveTimer();

  if (!isDraftReady || saving.value) return;

  if (!isDirty.value || !hasMeaningfulContent()) {
    removeDraftStorage();
    return;
  }

  const snapshot: DraftSnapshot = {
    form: normalizeDraftPage(form),
    selectedPresetKey: selectedPresetKey.value,
    savedAt: new Date().toISOString(),
  };

  localStorage.setItem(draftStorageKey.value, JSON.stringify(snapshot));
  draftSavedAt.value = snapshot.savedAt;
  draftState.value = 'saved';
}

function queueDraftSave() {
  if (!isDraftReady || saving.value) return;

  clearAutosaveTimer();

  if (!isDirty.value || !hasMeaningfulContent()) {
    if (localStorage.getItem(draftStorageKey.value)) removeDraftStorage();
    return;
  }

  draftState.value = 'saving';
  autosaveTimer = setTimeout(() => {
    persistDraft();
  }, AUTOSAVE_DELAY_MS);
}

function getSlugValidationMessage(value: string) {
  const slug = value.trim();
  if (!slug) return '';
  if (!SLUG_PATTERN.test(slug)) {
    return 'URL Slug 只能使用英文、數字、斜線（/）、底線（_）與連字號（-）。';
  }
  if (isSlugConflict(slug, isAdd ? undefined : form.id)) {
    return `URL Slug 已被使用：${slug}`;
  }
  return '';
}

function scheduleSlugCheck(value: string) {
  clearSlugCheckTimer();

  const slug = value.trim();
  if (!slug) {
    slugStatus.value = 'idle';
    if (errors.value.slug?.startsWith('URL Slug')) errors.value.slug = '';
    return;
  }

  slugStatus.value = 'checking';
  slugCheckTimer = setTimeout(() => {
    const validationMessage = getSlugValidationMessage(slug);
    if (validationMessage) {
      errors.value.slug = validationMessage;
      slugStatus.value = 'idle';
      return;
    }

    errors.value.slug = '';
    slugStatus.value = 'available';
  }, SLUG_CHECK_DELAY_MS);
}

async function restoreDraftIfNeeded() {
  const raw = localStorage.getItem(draftStorageKey.value);
  if (!raw) return;

  let snapshot: DraftSnapshot;
  try {
    snapshot = JSON.parse(raw) as DraftSnapshot;
  } catch {
    removeDraftStorage();
    return;
  }

  if (!snapshot?.form) {
    removeDraftStorage();
    return;
  }

  const savedAtLabel = snapshot.savedAt ? formatDate(snapshot.savedAt) : '稍早';

  try {
    await ElMessageBox.confirm(
      `偵測到 ${savedAtLabel} 的暫存草稿，要繼續編輯這份內容嗎？`,
      '還原暫存草稿',
      {
        type: 'info',
        confirmButtonText: '還原草稿',
        cancelButtonText: '捨棄草稿',
      },
    );
  } catch {
    removeDraftStorage();
    return;
  }

  Object.assign(form, normalizeDraftPage(snapshot.form));
  selectedPresetKey.value = snapshot.selectedPresetKey ?? selectedPresetKey.value;
  draftSavedAt.value = snapshot.savedAt || '';
  draftState.value = 'restored';

  success('已還原暫存草稿');
}

onMounted(async () => {
  window.addEventListener('beforeunload', beforeUnloadHandler);
  await restoreDraftIfNeeded();
  scheduleSlugCheck(form.slug);
  isDraftReady = true;
});

onUnmounted(() => {
  clearAutosaveTimer();
  clearSlugCheckTimer();
  window.removeEventListener('beforeunload', beforeUnloadHandler);
});

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

    removeDraftStorage();
    window.removeEventListener('beforeunload', beforeUnloadHandler);
    next();
  } catch {
    next(false);
  }
});

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

  success(`已套用 ${preset.label}`);
}

function regenerateSlug() {
  form.slug = slugify(form.title);
  info(`已更新 slug：${form.slug}`);
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

function applySuggestedTag(tag: string) {
  const currentTags = form.tags || [];
  if (currentTags.includes(tag)) return;
  form.tags = [...currentTags, tag];
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

function toDatetimeValue(date: Date) {
  const local = new Date(date);
  local.setSeconds(0, 0);
  const year = local.getFullYear();
  const month = String(local.getMonth() + 1).padStart(2, '0');
  const day = String(local.getDate()).padStart(2, '0');
  const hours = String(local.getHours()).padStart(2, '0');
  const minutes = String(local.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:00`;
}

function setPublishNow() {
  publishTimeModel.value = toDatetimeValue(new Date());
  if (form.status === 'draft') form.status = 'published';
}

function setPublishAtHour(hour: number) {
  const next = new Date();
  next.setHours(hour, 0, 0, 0);
  publishTimeModel.value = toDatetimeValue(next);
  if (form.status === 'draft') form.status = 'published';
}

function setPublishTomorrowMorning() {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  next.setHours(9, 0, 0, 0);
  publishTimeModel.value = toDatetimeValue(next);
  if (form.status === 'draft') form.status = 'published';
}

function clearUnpublishTime() {
  unpublishTimeModel.value = undefined;
}

function setUnpublishAfterDays(days: number) {
  const base = publishTimeModel.value ? new Date(publishTimeModel.value) : new Date();
  base.setDate(base.getDate() + days);
  base.setHours(23, 59, 0, 0);
  unpublishTimeModel.value = toDatetimeValue(base);
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

    removeDraftStorage();
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
    warning(
      validationErrors.length === 1
        ? firstError.message
        : `${firstError.message}，另外還有 ${validationErrors.length - 1} 個欄位需要處理`,
      4000,
    );
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
    removeDraftStorage();
    success('頁面已新增');
    window.removeEventListener('beforeunload', beforeUnloadHandler);
    $commonLib?.GuideToPage('PageManagement_DataList');
    return;
  }

  update(form.id, payload);
  saving.value = false;
  isDirty.value = false;
  originalSnapshot = JSON.stringify(form);
  removeDraftStorage();
  success('頁面已更新');
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
  flex: 1 1 360px;
  max-width: 720px;
  min-width: 360px;
}

.preview-sticky {
  position: sticky;
  top: 0;
  height: calc(100vh - 100px);
}

:deep(.preview-shell) {
  height: 100%;
}

@media (max-width: 1440px) {
  .layout.preview-open {
    flex-direction: column;
  }

  .preview-pane-wrap {
    flex: 1 1 auto;
    width: 100%;
    max-width: 100%;
    min-width: 0;
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

.draft-status {
  display: grid;
  gap: 4px;
  margin-bottom: 18px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #fafbfc;
  border: 1px solid rgba(15, 76, 92, 0.08);

  strong {
    color: #303133;
    font-size: 13px;
  }

  span {
    color: #606266;
    font-size: 12px;
    line-height: 1.6;
  }

  &.is-saving {
    border-color: rgba(234, 85, 4, 0.2);
    background: #fff7f0;
  }

  &.is-saved,
  &.is-restored {
    border-color: rgba(103, 194, 58, 0.22);
    background: #f5fbf0;
  }
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

.preset-grid > *,
.basic-grid > *,
.item-group-list > * {
  min-width: 0;
  word-break: break-word;
  overflow-wrap: anywhere;
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

  &.is-success {
    color: #67c23a;
  }
}

.url-preview,
.seo-preview,
.schedule-summary {
  display: grid;
  gap: 6px;
  margin-top: 10px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #fafbfc;
  border: 1px solid rgba(15, 76, 92, 0.08);
}

.preview-label {
  color: #909399;
  font-size: 12px;
  font-weight: 700;
}

.url-preview code,
.seo-preview code {
  color: #0f4c5c;
  font-size: 12px;
  word-break: break-all;
}

.seo-preview strong,
.schedule-summary strong {
  color: #303133;
  font-size: 14px;
}

.seo-preview p,
.schedule-summary p {
  margin: 0;
  color: #606266;
  font-size: 13px;
  line-height: 1.7;
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

.status-explainer {
  margin-top: 10px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(15, 76, 92, 0.08);
  background: #fafbfc;

  strong {
    display: block;
    margin-bottom: 4px;
    color: #303133;
    font-size: 14px;
  }

  p {
    margin: 0;
    color: #606266;
    font-size: 13px;
    line-height: 1.7;
  }

  &.is-draft {
    background: linear-gradient(135deg, rgba(15, 76, 92, 0.06), rgba(255, 255, 255, 1));
  }

  &.is-published {
    background: linear-gradient(135deg, rgba(106, 153, 78, 0.08), rgba(255, 255, 255, 1));
  }

  &.is-unpublished {
    background: linear-gradient(135deg, rgba(188, 71, 73, 0.08), rgba(255, 255, 255, 1));
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

.tag-suggestions {
  margin-top: 10px;
}

.tag-suggestion-list,
.quick-action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.tag-suggestion-chip,
.quick-action-chip {
  border: 1px solid rgba(234, 85, 4, 0.16);
  border-radius: 999px;
  background: #ffffff;
  padding: 7px 12px;
  color: #ea5504;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    transform 0.2s ease;

  &:hover {
    border-color: rgba(234, 85, 4, 0.32);
    background: #fff7f0;
    transform: translateY(-1px);
  }
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

@media (max-width: 1024px) {
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

@media (max-width: 768px) {
  .layout {
    gap: 12px;
  }
}
</style>
