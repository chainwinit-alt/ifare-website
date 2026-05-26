<template>
  <main-header>
    <template #subtitle v-if="!isAdd">
      <sub class="sub-title sub-createDate">{{ formatDate(form.createDate) }}</sub>
      <sub class="sub-title sub-number">{{ recordId }}</sub>
    </template>

    <template #btnsRight>
      <span
        v-if="draftStatusChip"
        class="draft-chip"
        :class="`is-${draftState}`"
        :title="draftStatusDescription"
      >
        {{ draftStatusChip }}
      </span>
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
              <div class="item-group span-2" :class="{ 'has-error': errors.title }" data-focus="title">
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

              <div class="item-group" :class="{ 'has-error': errors.slug }" data-focus="slug">
                <label class="input-title required">頁面網址</label>
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
                <div v-if="slugSuggestions.length" class="slug-suggestions">
                  <span class="slug-suggestions-label">建議改用：</span>
                  <button
                    v-for="s in slugSuggestions"
                    :key="s"
                    type="button"
                    class="slug-suggestion-chip"
                    @click="applySlugSuggestion(s)"
                  >
                    {{ s }}
                  </button>
                </div>
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

        <!-- 2026-05-25 #94 內容完整度檢查卡 -->
        <div class="section-main-card card-fullsize">
          <div class="card-info completeness-card" :class="`overall-${completenessOverallState}`">
            <div class="completeness-head">
              <div class="completeness-title-row">
                <h4 class="section-title no-border">完成度檢查</h4>
                <span class="completeness-count">{{ completenessPassCount }} / {{ completenessTotalCount }} 通過</span>
              </div>
              <p class="completeness-headline">{{ completenessHeadline }}</p>
              <div class="completeness-bar">
                <div
                  class="completeness-progress"
                  :class="`is-${completenessOverallState}`"
                  :style="{ width: completenessPercent + '%' }"
                ></div>
              </div>
            </div>

            <div class="completeness-grid">
              <button
                v-for="check in completenessChecks"
                :key="check.key"
                type="button"
                class="completeness-item"
                :class="[`is-${check.state}`, { 'is-clickable': check.focusTarget || check.focusSectionId }]"
                :disabled="!check.focusTarget && !check.focusSectionId"
                :title="check.focusTarget || check.focusSectionId ? '點擊跳到對應位置' : ''"
                @click="scrollToField(check.focusTarget, check.focusSectionId)"
              >
                <span class="completeness-icon">{{ COMPLETENESS_ICON[check.state] }}</span>
                <div class="completeness-copy">
                  <strong>{{ check.label }}</strong>
                  <span>{{ check.hint }}</span>
                </div>
                <span v-if="check.focusTarget" class="completeness-jump">↗</span>
              </button>
            </div>
          </div>
        </div>

        <div class="section-main-card card-fullsize" data-focus="sections">
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

                <div class="item-group" data-focus="meta">
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

                <div class="item-group" data-focus="cover">
                  <label class="input-title">封面圖片</label>
                  <ImagePicker
                    :model-value="form.coverImage || ''"
                    :show-preview="true"
                    placeholder="從媒體庫挑、上傳或貼網址"
                    @update:model-value="form.coverImage = $event"
                  />
                </div>

                <div v-if="form.coverImage" class="item-group">
                  <label class="input-title">封面替代文字</label>
                  <el-input v-model="form.coverImageAlt" placeholder="描述這張封面圖的內容" />
                </div>

                <div class="item-group">
                  <label class="input-title">社群分享圖</label>
                  <ImagePicker
                    :model-value="form.ogImage || ''"
                    :show-preview="true"
                    placeholder="FB / LINE 分享時顯示的圖片"
                    @update:model-value="form.ogImage = $event"
                  />
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
                      :disabled-date="disablePastUnpublishDate"
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
import { computed, getCurrentInstance, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
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
import ImagePicker from '@/components/PageBuilder/ImagePicker.vue';
import PreviewPane from '@/components/PageBuilder/PreviewPane.vue';
import SectionList from '@/components/PageBuilder/SectionList.vue';
import {
  createDefaultPage,
  createDefaultSection,
  isSectionEmpty,
  slugify,
  useDynamicPages,
  validatePage,
  waitForLastSync,
  type DynamicPage,
  type Section,
} from '@/composables/useDynamicPages';
import { FRONTEND_BASE_URL } from '@/config/adminEnv';
import { escapeHtml } from '@/utils/sanitizeHtml';

type PagePresetKey = 'blank' | 'story' | 'service' | 'campaign' | 'event' | 'news' | 'contact';

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
const { success, error: showError, errorWithNextStep, info, warning, successWithLink } = useFeedback();
const FRONTEND_PREVIEW_BASE = FRONTEND_BASE_URL;

const routeNameType = route?.name?.toString().toLocaleLowerCase() || '';
const isAdd = ref(routeNameType.includes('add'));
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
const selectedPresetKey = ref<PagePresetKey | null>(isAdd.value ? 'blank' : null);
// 優化 A — 必填欄位 inline 錯誤訊息（field name → error message）
const errors = ref<Record<string, string>>({});
const suggestedTags = ['基金會介紹', '活動公告', '志工招募', '補助資訊', '常見問題', '專案成果'];
const slugStatus = ref<'idle' | 'checking' | 'available'>('idle');
// 2026-05-25 O — slug 衝突時自動算 2-3 個可用替代版本
const slugSuggestions = ref<string[]>([]);
const draftState = ref<DraftState>('idle');
const draftSavedAt = ref('');

const draftStorageKey = computed(() => `${DRAFT_STORAGE_PREFIX}:${isAdd.value ? 'new' : recordId.value || 'new'}`);
const slugHintText = computed(() => {
  if (!form.slug.trim()) return '通常不用手動重打，可先輸入頁面名稱再按右側按鈕自動產生。';
  if (slugStatus.value === 'checking') return '正在檢查這個網址是否已被其他頁面使用。';
  if (slugStatus.value === 'available') return '這個網址目前可使用。';
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

// 2026-05-25 #65 折衷：原本的 draft-status 大卡片已被刪（視覺雜訊），
// 改成 header 旁的小 chip，只在 saving/saved/restored 時顯示。
const draftStatusChip = computed(() => {
  if (draftState.value === 'saving') return '草稿暫存中…';
  if (draftState.value === 'saved' && draftSavedAt.value) {
    return `已暫存 ${formatDate(draftSavedAt.value).slice(11, 16)}`;
  }
  if (draftState.value === 'restored') return '已還原草稿';
  return '';
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

// 2026-05-25 #94 內容完整度檢查 — 必填紅、建議橘、通過綠，使用者可一眼看缺什麼
type FocusTarget = 'title' | 'slug' | 'sections' | 'meta' | 'cover' | 'imageAlt' | 'ctaLink';

interface CompletenessCheck {
  key: string;
  label: string;
  hint: string;
  state: 'pass' | 'warn' | 'fail';
  focusTarget?: FocusTarget;
  // 2026-05-25 B+ — imageAlt / ctaLink 直接跳到第一個有缺的 section
  focusSectionId?: string;
}

const completenessChecks = computed<CompletenessCheck[]>(() => {
  const checks: CompletenessCheck[] = [];

  // === 必填（fail = 紅）===
  checks.push({
    key: 'title',
    label: '頁面標題',
    hint: form.title.trim() ? form.title.trim().slice(0, 16) : '尚未填寫',
    state: form.title.trim() ? 'pass' : 'fail',
    focusTarget: 'title',
  });

  const slugTrimmed = form.slug.trim();
  const slugConflict = slugTrimmed && isSlugConflict(slugTrimmed, isAdd.value ? undefined : form.id);
  checks.push({
    key: 'slug',
    label: '頁面網址',
    hint: !slugTrimmed ? '尚未填寫' : slugConflict ? '與其他頁衝突' : `/${slugTrimmed}`,
    state: !slugTrimmed || slugConflict ? 'fail' : 'pass',
    focusTarget: 'slug',
  });

  const filledSections = form.sections.filter((s) => !isSectionEmpty(s)).length;
  checks.push({
    key: 'sections',
    label: '頁面區塊',
    hint:
      form.sections.length === 0
        ? '尚未加任何區塊'
        : `${filledSections} / ${form.sections.length} 個已填內容`,
    state:
      form.sections.length === 0
        ? 'fail'
        : filledSections === form.sections.length
          ? 'pass'
          : 'warn',
    focusTarget: 'sections',
  });

  // === 建議（warn = 橘 / 通過 = 綠）===
  const metaLen = form.metaDescription.trim().length;
  checks.push({
    key: 'meta',
    label: 'SEO 描述',
    hint: metaLen === 0 ? '建議 50-160 字' : metaLen < 50 ? `目前 ${metaLen} 字，太短` : `${metaLen} 字`,
    state: metaLen >= 50 ? 'pass' : 'warn',
    focusTarget: 'meta',
  });

  checks.push({
    key: 'cover',
    label: '封面圖片',
    hint: form.coverImage?.trim() ? '已設定' : '社群分享會用到',
    state: form.coverImage?.trim() ? 'pass' : 'warn',
    focusTarget: 'cover',
  });

  // 動態檢查：有 image-text 時才檢 alt
  const imageTextSections = form.sections.filter((s) => s.type === 'image-text') as Array<{
    imageSrc: string;
    imageAlt: string;
  }>;
  const imageTextWithSrc = imageTextSections.filter((s) => s.imageSrc.trim());
  if (imageTextWithSrc.length > 0) {
    const missingAltSections = imageTextWithSrc.filter((s) => !s.imageAlt.trim());
    const firstMissingAlt = form.sections.find(
      (s) => s.type === 'image-text' && s.imageSrc?.trim() && !s.imageAlt?.trim(),
    );
    checks.push({
      key: 'imageAlt',
      label: '圖片替代文字',
      hint: missingAltSections.length === 0 ? '全部圖片都有 alt' : `${missingAltSections.length} 張圖缺 alt`,
      state: missingAltSections.length === 0 ? 'pass' : 'warn',
      focusTarget: 'sections',
      focusSectionId: firstMissingAlt?.id,
    });
  }

  // CTA 連結檢查：cta-card 或 image-text 有 ctaText 但沒 ctaUrl
  const ctaIssueCount = form.sections.reduce((count, s) => {
    if (s.type === 'cta-card') {
      return count + s.cards.filter((c) => c.ctaText.trim() && !c.ctaUrl.trim()).length;
    }
    if (s.type === 'image-text' && s.ctaText?.trim() && !s.ctaUrl?.trim()) {
      return count + 1;
    }
    return count;
  }, 0);
  if (ctaIssueCount > 0) {
    const firstCtaIssue = form.sections.find((s) => {
      if (s.type === 'cta-card') return s.cards.some((c) => c.ctaText.trim() && !c.ctaUrl.trim());
      if (s.type === 'image-text') return s.ctaText?.trim() && !s.ctaUrl?.trim();
      return false;
    });
    checks.push({
      key: 'ctaLink',
      label: 'CTA 連結',
      hint: `${ctaIssueCount} 個按鈕缺連結`,
      state: 'warn',
      focusTarget: 'sections',
      focusSectionId: firstCtaIssue?.id,
    });
  }

  return checks;
});

// 2026-05-25 B — 點擊完成度 chip 滾到對應欄位（advanced 區塊會自動展開）
// 2026-05-25 B+ — 若提供 sectionId 則優先跳到那個 section（imageAlt / ctaLink chip 用）
async function scrollToField(target?: FocusTarget, sectionId?: string) {
  if (!target && !sectionId) return;

  // meta / cover 在「進階設定」內，先展開
  if (target === 'meta' || target === 'cover') {
    advancedOpen.value = true;
  }

  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 60));

  // 優先 sectionId 命中（imageAlt / ctaLink 跳到第一個有缺的 section）
  if (sectionId) {
    const sectionEl = document.querySelector(`[data-section-id="${sectionId}"]`) as HTMLElement | null;
    if (sectionEl) {
      sectionEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // 模擬點擊讓該 section 展開（SectionList 監聽 click → selectSection → 展開）
      sectionEl.click();
      return;
    }
  }

  if (!target) return;
  const el = document.querySelector(`[data-focus="${target}"]`) as HTMLElement | null;
  if (!el) return;

  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const input = el.querySelector('input, textarea') as HTMLElement | null;
  input?.focus();
}

const completenessPassCount = computed(
  () => completenessChecks.value.filter((c) => c.state === 'pass').length,
);
const completenessFailCount = computed(
  () => completenessChecks.value.filter((c) => c.state === 'fail').length,
);
const completenessWarnCount = computed(
  () => completenessChecks.value.filter((c) => c.state === 'warn').length,
);
const completenessTotalCount = computed(() => completenessChecks.value.length);
const completenessPercent = computed(() =>
  completenessTotalCount.value === 0
    ? 0
    : Math.round((completenessPassCount.value / completenessTotalCount.value) * 100),
);
const completenessHeadline = computed(() => {
  if (completenessFailCount.value > 0) return `還有 ${completenessFailCount.value} 個必填項目沒完成`;
  if (completenessWarnCount.value > 0) return `必填都完成，還有 ${completenessWarnCount.value} 個建議項目可加分`;
  return '全部完成，可以放心發布';
});

const completenessOverallState = computed<'pass' | 'warn' | 'fail'>(() => {
  if (completenessFailCount.value > 0) return 'fail';
  if (completenessWarnCount.value > 0) return 'warn';
  return 'pass';
});

const COMPLETENESS_ICON: Record<'pass' | 'warn' | 'fail', string> = {
  pass: '✓',
  warn: '!',
  fail: '✕',
};

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
  // 2026-05-25 #92 — 新增 3 個常用頁型
  {
    key: 'event',
    label: '活動報名頁',
    description: '適合單一活動的詳情頁，主視覺 + 活動說明 + 報名亮點 + 行動。',
    structure: '主視覺 / 活動圖文 / 四個亮點 / 行動卡',
    suggestedTitle: '活動報名',
    suggestedSlug: 'event-signup',
    buildSections: () => [
      buildHeroSection('活動報名', 'EVENT', '時間、地點、對象一次看清楚'),
      buildImageTextSection(
        '活動說明',
        '說明活動主題、時間、地點、對象與報名資訊。',
        'left',
        '我要報名',
        '/contact',
      ),
      buildFourCardSection('活動亮點'),
      buildCtaCardSection(),
    ],
  },
  {
    key: 'news',
    label: '最新公告頁',
    description: '適合單篇公告、聲明、政策說明等以文字為主的頁面。',
    structure: '主視覺 / 多段內文',
    suggestedTitle: '最新公告',
    suggestedSlug: 'news-announcement',
    buildSections: () => [
      buildHeroSection('最新公告', 'NEWS', '基金會官方說明'),
      buildTextSection('公告內容', [
        '請在此填寫第一段公告內容。',
        '請在此填寫第二段補充說明，可包含背景、原因、相關連結等。',
        '如需更多段落可繼續新增。',
      ]),
    ],
  },
  {
    key: 'contact',
    label: '聯絡頁',
    description: '適合放電話、地址、Email 等聯絡資訊，搭配兩個主要聯繫方式。',
    structure: '主視覺 / 聯絡說明 / 雙管道行動卡',
    suggestedTitle: '聯絡我們',
    suggestedSlug: 'contact-us',
    buildSections: () => [
      buildHeroSection('聯絡我們', 'CONTACT', '我們很期待聽到你的聲音'),
      buildTextSection('聯絡資訊', [
        '電話：(02) 0000-0000（週一至週五 09:00-18:00）',
        '地址：請於此填寫辦公室或服務據點地址。',
        'Email：請填寫對外服務信箱。',
      ]),
      buildCtaCardSection(),
    ],
  },
];

const presetMap = new Map<PagePresetKey, PagePresetOption>(
  pagePresets.map((preset) => [preset.key, preset]),
);

if (!isAdd.value && recordId.value) {
  const existing = getById(recordId.value);

  if (existing) {
    Object.assign(form, JSON.parse(JSON.stringify(existing)));
    if (!Array.isArray(form.sections)) form.sections = [];
  } else {
    showError('找不到要編輯的頁面');
    router.replace({ name: 'PageManagement_DataList' });
  }
}

if (isAdd.value) {
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
    return '頁面網址只能使用英文、數字、斜線（/）、底線（_）與連字號（-）。';
  }
  if (isSlugConflict(slug, isAdd.value ? undefined : form.id)) {
    return `頁面網址已被使用：${slug}`;
  }
  return '';
}

function computeSlugSuggestions(slug: string): string[] {
  // 去掉結尾的 -數字 才不會一直建議 -2-2-2
  const base = slug.replace(/-\d+$/, '') || 'page';
  const out: string[] = [];
  for (let n = 2; n <= 20 && out.length < 3; n += 1) {
    const candidate = `${base}-${n}`;
    if (!isSlugConflict(candidate, isAdd.value ? undefined : form.id)) {
      out.push(candidate);
    }
  }
  return out;
}

function scheduleSlugCheck(value: string) {
  clearSlugCheckTimer();

  const slug = value.trim();
  if (!slug) {
    slugStatus.value = 'idle';
    slugSuggestions.value = [];
    if (errors.value.slug?.startsWith('頁面網址')) errors.value.slug = '';
    return;
  }

  slugStatus.value = 'checking';
  slugCheckTimer = setTimeout(() => {
    const validationMessage = getSlugValidationMessage(slug);
    if (validationMessage) {
      errors.value.slug = validationMessage;
      slugStatus.value = 'idle';
      // 2026-05-25 O — 只在「被佔用」時提供替代建議；格式錯誤就讓使用者自己改
      slugSuggestions.value = validationMessage.includes('已被使用')
        ? computeSlugSuggestions(slug)
        : [];
      return;
    }

    errors.value.slug = '';
    slugStatus.value = 'available';
    slugSuggestions.value = [];
  }, SLUG_CHECK_DELAY_MS);
}

function applySlugSuggestion(slug: string) {
  form.slug = slug;
  // watch form.slug 會自動觸發 scheduleSlugCheck → 清掉 suggestions
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
  if (!form.title.trim() || isAdd.value) form.title = preset.suggestedTitle;
  if (!form.slug.trim() || isAdd.value) form.slug = slugify(form.title || preset.suggestedSlug);

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
  if (isAdd.value && !form.slug.trim() && form.title.trim()) {
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

function disablePastUnpublishDate(time: Date): boolean {
  if (!publishTimeModel.value) return false;
  const pub = new Date(publishTimeModel.value);
  // 比較到「日」層級，同一天讓使用者自由選時間（time 部分由 validatePage 在送出時擋）
  pub.setHours(0, 0, 0, 0);
  return time.getTime() < pub.getTime();
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

function getEmbeddedImageSectionIndex() {
  return form.sections.findIndex((section) => section.type === 'image-text' && section.imageSrc.startsWith('data:image/'));
}

// 2026-05-25 #48 — 拆成 nextStep,讓 errorWithNextStep 用區塊呈現「下一步」
function getSaveNextStep(err: unknown) {
  if (err instanceof DOMException && err.name === 'QuotaExceededError') {
    return '瀏覽器暫存容量已滿。請確認圖片不是舊版 data:image 內嵌資料,改用「選擇本機圖片」重新上傳後再儲存。';
  }

  if (err instanceof Error && /quota|storage/i.test(err.message)) {
    return '資料量超過瀏覽器暫存容量。請重新上傳圖片,避免儲存很長的 data:image 圖片資料。';
  }

  return '請稍後再試;若剛更新圖片,請確認前台 dev server 已啟動並重新選擇圖片。';
}

function afterSave() {
  saving.value = false;
  isDirty.value = false;
  originalSnapshot = JSON.stringify(form);
  removeDraftStorage();
}

async function onSave() {
  const validationErrors = validatePage(form, isSlugConflict, isAdd.value ? undefined : form.id);

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

    // 2026-05-25 P — 自動滾到第一個錯誤欄位 + focus
    const errorFieldToFocus: Record<string, FocusTarget> = {
      title: 'title',
      slug: 'slug',
      section: 'sections',
      unpublishTime: 'meta', // unpublishTime 在進階區，展開後可看到（沒 data-focus 就先指到附近）
    };
    const target = errorFieldToFocus[firstError.field];
    if (target) scrollToField(target);
    return;
  }

  const embeddedImageSectionIndex = getEmbeddedImageSectionIndex();
  if (embeddedImageSectionIndex >= 0) {
    warning(
      `第 ${embeddedImageSectionIndex + 1} 個圖文並列仍是舊版內嵌圖片資料，請按「選擇本機圖片」重新上傳後再儲存。`,
      7000,
    );
    return;
  }

  // 2026-05-25 #97 發布前 checklist — 只在「狀態為已發布 + 有建議項未完成」才攔，草稿或全綠都直接放行
  if (form.status === 'published' && completenessWarnCount.value > 0) {
    const warnItems = completenessChecks.value.filter((c) => c.state === 'warn');
    // c.label 為固定字串、c.hint 可能含 form.title / form.slug 等 user 輸入，需 escape 後插入
    const html = `
      <div style="text-align: left;">
        <p style="margin: 0 0 12px; color: #606266;">下列項目尚未完成，建議補上後再發布到前台：</p>
        <ul style="padding-left: 1.2em; margin: 0 0 12px;">
          ${warnItems
            .map(
              (c) =>
                `<li style="margin-bottom: 4px;"><strong>${escapeHtml(c.label)}</strong>：<span style="color: #909399;">${escapeHtml(c.hint)}</span></li>`,
            )
            .join('')}
        </ul>
        <p style="margin: 0; color: #909399; font-size: 12px;">這些不會影響功能，但會影響 SEO、社群分享或無障礙體驗。</p>
      </div>
    `;
    try {
      await ElMessageBox.confirm(html, '發布前提醒', {
        type: 'warning',
        confirmButtonText: '我知道，繼續發布',
        cancelButtonText: '返回修改',
        dangerouslyUseHTMLString: true,
      });
    } catch {
      // 使用者選擇返回修改 → 中止 save
      return;
    }
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

  try {
    let actionLabel = '頁面已更新';
    let isNewlyAdded = false;

    if (isAdd.value) {
      const newPage = insert(payload);
      form.id = newPage.id;
      isAdd.value = false;
      afterSave();
      // 留頁體驗：改 query 不切 route name，避免 unmount 重新初始化
      router.replace({ query: { ...route.query, id: newPage.id } });
      actionLabel = '頁面已新增，可繼續編輯';
      isNewlyAdded = true;
    } else {
      const didUpdate = update(form.id, payload);
      if (!didUpdate) {
        throw new Error('Page not found');
      }
      afterSave();
    }

    // 2026-05-25 D — 等同步 Nuxt 結果，避免「儲存成功但前台其實沒收到」的假成功
    const syncResult = await waitForLastSync();

    if (!syncResult.ok) {
      warning(
        `${actionLabel}（已寫入後台暫存），但同步到前台失敗：${syncResult.error}。` +
          `請確認前端 dev server（${FRONTEND_PREVIEW_BASE}）已啟動再按一次儲存。`,
        9000,
      );
    } else if (form.status === 'published') {
      successWithLink({
        title: actionLabel,
        message: '已同步到前端',
        linkLabel: '前往前端預覽',
        linkHref: `${FRONTEND_PREVIEW_BASE}/${form.slug}`,
      });
    } else {
      warning('頁面已暫存為草稿，前端不會顯示。要上線請切「已發布」再儲存。', 6000);
    }

    if (!isNewlyAdded) {
      window.removeEventListener('beforeunload', beforeUnloadHandler);
      router.back();
    }
  } catch (err) {
    // 2026-05-25 #48 — 用 errorWithNextStep 顯示「主訊息 + 原因 + 下一步」分區
    errorWithNextStep({
      title: '儲存失敗',
      nextStep: getSaveNextStep(err),
      err,
    });
    saving.value = false;
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

// 2026-05-25 把斷點往上調，避免「預覽開著+一般筆電視窗（1366-1600）」時 edit-pane 被擠到中文 label 直書
@media (max-width: 1600px) {
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

// 2026-05-25 O — slug 衝突自動建議 chip
.slug-suggestions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.slug-suggestions-label {
  font-size: 12px;
  color: #909399;
  font-weight: 600;
}

.slug-suggestion-chip {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid #ea5504;
  background: #fff7f0;
  color: #ea5504;
  font-size: 12px;
  font-weight: 700;
  font-family: Consolas, monospace;
  cursor: pointer;
  transition: all 0.18s ease;

  &:hover {
    background: #ea5504;
    color: #ffffff;
    transform: translateY(-1px);
  }
}

// 2026-05-25 #65 折衷小 chip — 取代被刪掉的 .draft-status 大卡片，只在 header 右側出現
.draft-chip {
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 12px;
  margin-right: 4px;
  border-radius: 999px;
  background: #f5f7fa;
  color: #606266;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
  transition: background-color 0.2s ease, color 0.2s ease;

  &.is-saving {
    background: rgba(234, 85, 4, 0.1);
    color: #ea5504;
  }

  &.is-saved {
    background: rgba(103, 194, 58, 0.14);
    color: #67c23a;
  }

  &.is-restored {
    background: rgba(64, 158, 255, 0.14);
    color: #409eff;
  }
}

// 2026-05-25 #94 完成度檢查卡
.completeness-card {
  display: grid;
  gap: 16px;
}

.completeness-head {
  display: grid;
  gap: 8px;
}

.completeness-title-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.completeness-count {
  font-size: 13px;
  font-weight: 700;
  color: #606266;
  white-space: nowrap;
}

.completeness-headline {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: #606266;

  .overall-pass & {
    color: #67c23a;
  }

  .overall-warn & {
    color: #e6a23c;
  }

  .overall-fail & {
    color: #f56c6c;
  }
}

.completeness-bar {
  position: relative;
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: #ebeef5;
  overflow: hidden;
}

.completeness-progress {
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s ease, background-color 0.3s ease;

  &.is-pass {
    background: #67c23a;
  }

  &.is-warn {
    background: #e6a23c;
  }

  &.is-fail {
    background: #f56c6c;
  }
}

.completeness-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 8px;
}

.completeness-item {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #ebeef5;
  background: #fafbfc;
  text-align: left;
  font-family: inherit;
  font-size: inherit;
  color: inherit;
  cursor: default;
  transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.18s ease;

  &.is-clickable {
    cursor: pointer;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 12px -10px rgba(15, 76, 92, 0.35);
    }
  }

  &:disabled {
    cursor: default;
  }

  &.is-pass {
    background: rgba(103, 194, 58, 0.06);
    border-color: rgba(103, 194, 58, 0.25);
  }

  &.is-warn {
    background: rgba(230, 162, 60, 0.08);
    border-color: rgba(230, 162, 60, 0.3);
  }

  &.is-fail {
    background: rgba(245, 108, 108, 0.08);
    border-color: rgba(245, 108, 108, 0.3);
  }
}

.completeness-jump {
  font-size: 14px;
  color: #909399;
  font-weight: 700;
  flex-shrink: 0;
  transition: color 0.18s ease;

  .is-clickable:hover & {
    color: #ea5504;
  }
}

.completeness-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
  background: #c0c4cc;
  flex-shrink: 0;

  .is-pass & {
    background: #67c23a;
  }

  .is-warn & {
    background: #e6a23c;
  }

  .is-fail & {
    background: #f56c6c;
  }
}

.completeness-copy {
  display: grid;
  gap: 2px;
  min-width: 0;

  strong {
    font-size: 13px;
    font-weight: 700;
    color: #303133;
    white-space: nowrap;
  }

  span {
    font-size: 12px;
    color: #909399;
    line-height: 1.5;
    word-break: break-word;
  }
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

// 2026-05-25 把 overflow-wrap: anywhere 拔掉 — 中文 label 在窄寬會被拆成「一字一行」
// 僅保留 min-width: 0（允許 grid item 收縮）+ word-break: break-word（長 URL 仍可斷行）
.preset-grid > *,
.basic-grid > *,
.item-group-list > * {
  min-width: 0;
  word-break: break-word;
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
  // 2026-05-25 防止「頁面/名/稱」被中文逐字斷成直書
  white-space: nowrap;

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
