<template>
  <div class="app-body" name="collaborator">
    <CompBreadCrumb />
    <div class="section-list bg-section-list">
      <section class="section section-collaborator bg-section">
        <div class="bg-radial"></div>
        <div class="part-top">
          <div class="title-component">
            <i class="ic-title-pattern"></i>
            <h3 class="comp-title">公益夥伴</h3>
            <span class="comp-shadow">PARTNER</span>
          </div>
        </div>

        <DynamicChildLinks parent-key="collaborator" parent-label="公益夥伴" title="公益夥伴延伸頁面" />

        <div class="collaborator-filter" role="search" aria-labelledby="collaborator-filter-title">
          <span id="collaborator-filter-title" class="sr-only">公益夥伴篩選</span>

          <div class="filter-row filter-row-tags" data-mascot-tip="這裡可以切換公益夥伴分類，像兒少、老人或身心障礙。">
            <span class="filter-label" id="label-category">分類</span>
            <div class="btn-tag-list" role="group" aria-labelledby="label-category">
              <button
                v-for="cat in CATEGORIES"
                :key="cat.name"
                type="button"
                class="chip transition-general"
                :class="{
                  active: isCategorySelected(cat.name),
                  disabled: categoryCounts[cat.name] === 0 && cat.name !== '全部',
                }"
                :aria-pressed="isCategorySelected(cat.name)"
                :disabled="categoryCounts[cat.name] === 0 && cat.name !== '全部'"
                @click="toggleCategory(cat.name)"
              >{{ cat.name }}<small>{{ categoryCounts[cat.name] }}</small></button>
            </div>
          </div>

          <form class="filter-row filter-row-search" data-mascot-tip="這裡可以用夥伴名稱、服務需求或完整問題尋找合作單位。" @submit.prevent="runAiSearch">
            <label class="filter-label" for="collaborator-search">關鍵字</label>
            <div class="search-field">
              <div class="search-controls">
                <div class="search-input-wrap">
                  <i class="ic-search input-icon" aria-hidden="true"></i>
                  <input
                    id="collaborator-search"
                    v-model="searchQuery"
                    type="search"
                    placeholder="輸入團體名稱、服務需求或問題"
                    autocomplete="off"
                    maxlength="100"
                    @input="handleSearchInput"
                  />
                  <button
                    v-if="searchQuery"
                    type="button"
                    class="btn-clear-text"
                    @click="clearSearch"
                    aria-label="清空關鍵字"
                  >×</button>
                </div>
                <button
                  type="submit"
                  class="btn-ai-search transition-general"
                  :disabled="!searchQuery.trim() || isAiSearching"
                  :aria-busy="isAiSearching"
                >
                  <span v-if="isAiSearching" class="search-spinner" aria-hidden="true"></span>
                  <i v-else class="ic-search" aria-hidden="true"></i>
                  <span>搜尋</span>
                </button>
              </div>
              <span v-if="isAiSearching" class="sr-only" aria-live="polite">搜尋中</span>
            </div>
          </form>
        </div>
        <div class="part-body">
          <p class="result-summary" v-if="hasFilter" aria-live="polite">
            共 <strong>{{ filteredList.length }}</strong> 個團體
            <span v-if="selectedCategories.length">屬於「{{ selectedCategories.join('、') }}」</span>
            <span v-if="appliedSearchQuery">符合「{{ appliedSearchQuery }}」</span>
          </p>
          <!-- #38 載入中 skeleton -->
          <div class="card-list" v-if="isLoading" aria-busy="true">
            <div class="card-partner card-partner-skeleton" v-for="n in 3" :key="`skel-${n}`">
              <div class="skeleton-line skeleton-line-title"></div>
              <div class="skeleton-line skeleton-line-info"></div>
              <div class="skeleton-line skeleton-line-info"></div>
            </div>
          </div>
          <!-- #38 載入失敗 -->
          <div v-else-if="hasError" class="empty-state empty-error" role="alert" data-mascot-tip="這裡可以重新載入公益夥伴列表。">
            <p>{{ errorMessage }}</p>
            <button type="button" class="btn-retry transition-general" @click="LoadCollaborators">重新載入</button>
          </div>
          <!-- 正常資料 -->
          <div class="card-list" v-else>
            <div class="card-partner transition-general" v-for="_coll in filteredList" :key="_coll.id" :data-mascot-tip="`這裡可以查看 ${_coll.title} 的服務內容與網站。`">
              <div class="card-title">
                <!-- #7 imageFile／url 都已在 LoadCollaborators 過白名單，不合法會是空字串，直接不渲染 -->
                <img v-if="_coll.imageFile" width="56" height="52" :src="_coll.imageFile" :alt="`${_coll.title} logo`" loading="lazy" />
                <h4 class="partner-title">{{ _coll.title }}</h4>
              </div>
              <ul class="list-unstyled card-infos">
                <li name="tel">{{ _coll.tel }}</li>
                <li name="service">{{ _coll.serviceItem }}</li>
                <li name="website" v-if="_coll.url">
                  <a
                    :href="_coll.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    :aria-label="`前往 ${_coll.title} 官網（另開視窗）`"
                  >前往官網</a>
                </li>
              </ul>
            </div>
          </div>
          <div v-if="!isLoading && !hasError && hasFilter && filteredList.length === 0" class="empty-state" data-mascot-tip="這裡可以清掉篩選條件，重新查看全部公益夥伴。">
            <p>找不到符合條件的公益夥伴</p>
            <button type="button" class="btn-reset-filter" @click="resetFilter">清空篩選</button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { normalizeRespectfulPolicyTerm } from '~/utils/ifareIntent';

useHead({
  title: '公益夥伴'
})
definePageMeta({
  title: '公益夥伴',
  toLinkName: '首頁',
  toLink: '/'
})
const { $WebApiGetDetailed } = useNuxtApp()
const { getApiErrorMessage } = useApiErrorMessage()
const { getApiResultArray } = useApiResult()

interface collaboratorItem {
    id: number,
    title: string,
    serviceItem: string,
    tel: string,
    url: string,
    imageFile: string
}

interface CollaboratorSearchResponse {
  matchedIds?: number[];
  intent?: string;
  source?: string;
  model?: string;
  errorMessage?: string;
}

interface pageNum {
    num: number,
    isActive: boolean
}

interface category {
  name: string;
  keywords: string[]; // 空陣列代表「全部」(無條件 match)
}

// #134 v1: 前端基本分類 — 用 serviceItem + title 關鍵字對應分類
const CATEGORIES: category[] = [
  { name: '全部', keywords: [] },
  { name: '兒少', keywords: ['兒童', '兒少', '嬰幼兒', '青少年', '青年'] },
  { name: '老人', keywords: ['老人', '長者', '銀髮'] },
  { name: '婦女', keywords: ['婦女'] },
  { name: '身心障礙', keywords: ['身心障礙', '障礙', '失能'] },
  { name: '弱勢家庭', keywords: ['弱勢', '家庭', '脫貧', '親子'] },
];

const collaboratorList = reactive<Array<collaboratorItem>>([]);

// #7 外連與圖片一律先過 scheme 白名單再進畫面。
// 後端資料若被塞入 `javascript:` 之類的位址，直接綁在 :href／:src 上，
// 訪客點一下「前往官網」就等於執行那段字串（stored XSS）。
// 寫法比照 pages/articles/lazy.vue 的 normalizeImageSrc：不合法就回空字串，
// 由 template 的 v-if 決定整個連結／圖片不渲染。
function safeText(value: unknown) {
  if (value === null || value === undefined) return '';
  return String(value);
}

function normalizeExternalUrl(value: unknown) {
  const url = safeText(value).trim();
  // 官網連結一定是絕對位址，只放行 http(s)
  return /^https?:\/\//i.test(url) ? url : '';
}

function normalizeImageSrc(value: unknown) {
  const src = safeText(value).trim();
  // 另外放行本站根相對路徑（開頭單一斜線）：沒有 scheme 就不可能是 javascript:，
  // 後端若回的是站內圖檔路徑也不會被誤擋。protocol-relative(//) 不算。
  if (/^(https?:\/\/|data:image\/(?:png|jpe?g|gif|webp);base64,|\/(?!\/))/i.test(src)) {
    return src;
  }
  return '';
}

// #38 — 載入狀態 + 錯誤狀態,搭配 skeleton + retry
const isLoading = ref(true);
const hasError = ref(false);
const errorMessage = ref('載入公益夥伴時發生錯誤');

// 分類採 OR 複選；AI 搜尋結果再與分類條件採 AND。
const searchQuery = ref('');
const appliedSearchQuery = ref('');
const selectedCategories = ref<string[]>([]);
const aiMatchedIds = ref<Set<number> | null>(null);
const isAiSearching = ref(false);
let aiSearchRequestId = 0;

function categoryMatch(c: collaboratorItem, categoryName: string): boolean {
  const cat = CATEGORIES.find(x => x.name === categoryName);
  if (!cat || cat.keywords.length === 0) return true; // 「全部」or 找不到 → 全 pass
  const text = `${c.title} ${c.serviceItem}`.toLowerCase();
  return cat.keywords.some(k => text.includes(k.toLowerCase()));
}

function isCategorySelected(categoryName: string) {
  return categoryName === '全部'
    ? selectedCategories.value.length === 0
    : selectedCategories.value.includes(categoryName);
}

function toggleCategory(categoryName: string) {
  if (categoryName === '全部') {
    selectedCategories.value = [];
    return;
  }

  selectedCategories.value = selectedCategories.value.includes(categoryName)
    ? selectedCategories.value.filter(name => name !== categoryName)
    : [...selectedCategories.value, categoryName];
}

function matchesSelectedCategories(c: collaboratorItem) {
  return selectedCategories.value.length === 0
    || selectedCategories.value.some(categoryName => categoryMatch(c, categoryName));
}

const filteredList = computed(() => {
  return collaboratorList.filter(c => {
    const matchSearch = !appliedSearchQuery.value
      || aiMatchedIds.value === null
      || aiMatchedIds.value.has(c.id);
    return matchSearch && matchesSelectedCategories(c);
  });
});

// 每個分類有多少筆 (顯示在 chip 後面括號)
const categoryCounts = computed(() => {
  const counts: Record<string, number> = {};
  for (const cat of CATEGORIES) {
    counts[cat.name] = collaboratorList.filter(c => categoryMatch(c, cat.name)).length;
  }
  return counts;
});

const hasFilter = computed(() =>
  selectedCategories.value.length > 0 || appliedSearchQuery.value !== ''
);

function resetFilter() {
  clearSearch();
  selectedCategories.value = [];
}

function clearSearch() {
  aiSearchRequestId += 1;
  searchQuery.value = '';
  appliedSearchQuery.value = '';
  aiMatchedIds.value = null;
  isAiSearching.value = false;
}

function handleSearchInput() {
  if (!searchQuery.value.trim()) {
    clearSearch();
    return;
  }

  if (searchQuery.value.trim() !== appliedSearchQuery.value) {
    aiSearchRequestId += 1;
    appliedSearchQuery.value = '';
    aiMatchedIds.value = null;
    isAiSearching.value = false;
  }
}

function getLocalFallbackIds(query: string) {
  const normalized = normalizeRespectfulPolicyTerm(query).toLowerCase().replace(/\s+/g, '');
  const synonymGroups: Array<{ pattern: RegExp; terms: string[] }> = [
    { pattern: /兒童|兒少|孩子|小孩|嬰幼兒|青少年/, terms: ['兒童', '兒少', '嬰幼兒', '青少年', '青年', '親子'] },
    { pattern: /老人|長者|長輩|年長|高齡|銀髮|照顧/, terms: ['老人', '長者', '銀髮', '照顧', '長照'] },
    { pattern: /身心障礙|身障|障礙|失能|智能障礙|發展遲緩|早療/, terms: ['身心障礙', '障礙', '失能', '智能障礙', '發展遲緩', '早療'] },
    { pattern: /婦女|女性|媽媽|母親/, terms: ['婦女', '女性', '媽媽', '母親'] },
    { pattern: /弱勢|家庭|經濟|貧困|生活困難/, terms: ['弱勢', '家庭', '脫貧', '經濟', '生活'] },
  ];
  const terms = new Set<string>();
  for (const group of synonymGroups) {
    if (group.pattern.test(normalized)) group.terms.forEach(term => terms.add(term));
  }
  normalized
    .split(/[，。！？、,!?;；：:]/u)
    .map(term => term.trim())
    .filter(term => term.length >= 2)
    .forEach(term => terms.add(term));

  return collaboratorList
    .filter(item => {
      const text = `${item.title}${item.serviceItem}`.toLowerCase();
      return [...terms].some(term => text.includes(term.toLowerCase()));
    })
    .map(item => item.id);
}

async function runAiSearch() {
  const query = searchQuery.value.trim();
  if (!query || isAiSearching.value) return;

  const requestId = ++aiSearchRequestId;
  isAiSearching.value = true;

  try {
    const response = await $fetch<CollaboratorSearchResponse>('/api/llm/collaborator-search', {
      method: 'POST',
      body: {
        query,
        collaborators: collaboratorList.map(item => ({
          id: item.id,
          title: item.title,
          serviceItem: item.serviceItem,
        })),
      },
    });
    if (requestId !== aiSearchRequestId) return;

    const validIds = new Set(collaboratorList.map(item => item.id));
    aiMatchedIds.value = new Set(
      (response.matchedIds || []).filter(id => validIds.has(Number(id))).map(Number),
    );
    appliedSearchQuery.value = query;
  } catch (error) {
    if (requestId !== aiSearchRequestId) return;
    console.warn('[collaborator][ai-search]', error);
    aiMatchedIds.value = new Set(getLocalFallbackIds(query));
    appliedSearchQuery.value = query;
  } finally {
    if (requestId === aiSearchRequestId) isAiSearching.value = false;
  }
}

// #38 — 包成可重試的 function (LoadCollaborators),設 isLoading/hasError 狀態
async function LoadCollaborators() {
  isLoading.value = true;
  hasError.value = false;
  errorMessage.value = '載入公益夥伴時發生錯誤';
  collaboratorList.splice(0);

  try {
    const { data, error } = await $WebApiGetDetailed('/Collaborator/GetCollaboratorList');
    const list = getApiResultArray<any>(data);
    if (error || list.length === 0) {
      hasError.value = true;
      errorMessage.value = getApiErrorMessage(error, '載入公益夥伴時發生錯誤');
      return;
    }

    const _collaboratorList: Array<collaboratorItem> = list.map((item: any) => ({
      id: item.id,
      title: item.title,
      serviceItem: item.serviceItem,
      tel: item.tel,
      url: normalizeExternalUrl(item.url),
      imageFile: normalizeImageSrc(item.imageFile),
    }));
    collaboratorList.push(..._collaboratorList);
  } catch (error) {
    hasError.value = true;
    errorMessage.value = getApiErrorMessage(error, '載入公益夥伴時發生錯誤');
  } finally {
    isLoading.value = false;
  }
}

LoadCollaborators();
</script>

<style lang="scss" scoped>
// 對應 _color.scss 色票（scoped 無法直接 import 全域變數）
$c-orange: #EA5504;
$c-white: #FFFFFF;
$c-black: #171818;
$c-grey-500: #8B8B8B;
$c-grey-200: #D1D1D1;
$c-grey-50: #F3F3F3;

.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
}

// 篩選區塊 — 標題下方、無框、輕量設計避免搶走頁面視覺重心
.collaborator-filter {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 24px 0 32px;
  max-width: 920px;

  .filter-row {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  .filter-label {
    flex-shrink: 0;
    min-width: 56px;            // 確保「分類」「關鍵字」起點對齊（3 中文字寬度）
    font-size: 13px;
    color: $c-grey-500;
    letter-spacing: 0.05em;
  }

  .btn-tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  // chip — 輕量膠囊樣式（統一寬度 + 字體置中）
  .chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;                    // 字體水平置中
    gap: 4px;
    min-width: 100px;                           // 統一寬度 (容納「身心障礙 (X)」最長 case)
    padding: 5px 14px;
    border: 1px solid rgba($c-black, 0.08);    // 細邊提升桃色 bg 上對比
    border-radius: 999px;
    background: $c-white;                       // 實心白底，桃色背景上更明顯
    font-size: 13px;
    color: $c-black;
    text-align: center;
    cursor: pointer;
    user-select: none;
    font-family: inherit;

    small {
      font-size: 11px;
      color: $c-grey-500;
      font-weight: 400;
      &::before { content: '('; }
      &::after { content: ')'; }
    }

    &:hover:not(.disabled):not(.active) {
      border-color: $c-orange;
      color: $c-orange;
      small { color: $c-orange; }
    }

    &.active {
      background: $c-orange;
      border-color: $c-orange;
      color: $c-white;
      small { color: rgba(255, 255, 255, 0.8); }
    }

    &.disabled,
    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    &:focus-visible {
      outline: 2px solid $c-orange;
      outline-offset: 2px;
    }
  }

  // 搜尋輸入框 — 與 chip 同視覺語言：圓潤、輕量
  .search-field {
    flex: 1;
    min-width: 240px;
  }

  .search-controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .search-input-wrap {
    position: relative;
    flex: 1;
    min-width: 0;

    .input-icon {
      position: absolute;
      top: 50%;
      left: 14px;
      transform: translateY(-50%);
      width: 16px;
      height: 16px;
      opacity: 0.45;
      pointer-events: none;
    }

    input {
      width: 100%;
      height: 36px;
      padding: 0 38px;               // 左右對稱（給左 icon 跟右清空鈕留空間）
      border: 1px solid rgba($c-black, 0.08);
      border-radius: 999px;
      background: $c-white;          // 實心白底，與 chip 一致
      font-size: 14px;
      color: $c-black;
      text-align: center;            // 文字 + placeholder 置中
      outline: none;
      transition: border-color 0.2s ease, background 0.2s ease;

      &::placeholder { color: $c-grey-500; }
      &::-webkit-search-cancel-button { display: none; }

      &:focus {
        border-color: $c-orange;
        background: $c-white;
      }
    }

    .btn-clear-text {
      position: absolute;
      top: 50%;
      right: 8px;
      transform: translateY(-50%);
      width: 22px;
      height: 22px;
      padding: 0;
      border: none;
      background: rgba($c-black, 0.15);
      color: $c-white;
      border-radius: 50%;
      font-size: 13px;
      line-height: 1;
      cursor: pointer;

      &:hover { background: rgba($c-black, 0.3); }
    }
  }

  .btn-ai-search {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    flex: 0 0 104px;
    height: 36px;
    padding: 0 14px;
    border: 1px solid $c-orange;
    border-radius: 999px;
    background: $c-orange;
    color: $c-white;
    font-family: inherit;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;

    .ic-search {
      width: 15px;
      height: 15px;
      filter: brightness(0) invert(1);
    }

    &:disabled {
      border-color: $c-grey-200;
      background: $c-grey-200;
      cursor: not-allowed;
    }
  }

  .search-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba($c-white, 0.45);
    border-top-color: $c-white;
    border-radius: 50%;
    animation: collaborator-search-spin 0.8s linear infinite;
  }

}

@keyframes collaborator-search-spin {
  to { transform: rotate(360deg); }
}

.result-summary {
  margin: 0 0 20px;
  font-size: 14px;
  color: $c-grey-500;

  strong {
    color: $c-orange;
    font-weight: 700;
  }
}

.empty-state {
  text-align: center;
  padding: 56px 16px;
  color: $c-grey-500;

  p { margin: 0 0 16px; font-size: 15px; }

  .btn-reset-filter {
    padding: 8px 24px;
    border: 1px solid $c-orange;
    border-radius: 999px;
    background: transparent;
    color: $c-orange;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.2s ease, color 0.2s ease;

    &:hover { background: $c-orange; color: $c-white; }
  }
}

@media (max-width: 768px) {
  .collaborator-filter {
    margin: 16px 0 24px;
    gap: 14px;
    width: 100%;
    box-sizing: border-box;

    .filter-row {
      align-items: stretch;
      gap: 10px;
      flex-direction: column;
      width: 100%;
      box-sizing: border-box;
    }

    .filter-label {
      min-width: 0;
      width: 100%;
    }

    .btn-tag-list {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      width: 100%;
      box-sizing: border-box;
    }

    .chip {
      min-width: 0;
      width: 100%;
      max-width: 100%;
      height: 46px;
      padding: 0 10px;
      box-sizing: border-box;
      white-space: nowrap;
      overflow: hidden;

      small {
        flex-shrink: 0;
      }
    }

    .search-field,
    .search-input-wrap {
      max-width: 100%;
      min-width: 0;
      width: 100%;
      box-sizing: border-box;

      input {
        height: 44px;
        box-sizing: border-box;
        text-align: left;
      }
    }

    .search-controls {
      width: 100%;
    }

    .btn-ai-search {
      flex-basis: 96px;
      height: 44px;
      padding: 0 10px;
    }
  }

  .card-list {
    gap: 16px;
  }

  .card-partner {
    width: 100% !important;
    box-sizing: border-box;

    .card-title {
      flex-direction: row !important;
      align-items: center !important;
      gap: 12px;
    }

    .card-infos {
      margin-top: 20px !important;
    }
  }
}
</style>
