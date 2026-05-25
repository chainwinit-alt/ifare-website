<template>
  <div class="app-body" name="articles">
    <div class="bg-sector-top"></div>
    <CompBreadCrumb />
    <div class="section-list bg-section-list" v-if="$route.name === 'articles'">
      <section class="section section-welfare bg-section">
        <div class="bg-radial"></div>
        <div class="part-top">
          <div class="title-component">
            <i class="ic-title-pattern"></i>
            <h3 id="articleWelfare" class="comp-title">福利專欄</h3>
            <span class="comp-shadow">ARTICLE</span>
          </div>
          <div class="part-filter">
            <CompSelect
              placeholder="選擇分類"
              select-title="分類"
              select-type="policy"
              :select-list="policySelectList"
              @update:select-value="setFilter"
              @is-opened="isSelectOpen"
            />
            <CompSelect
              placeholder="選擇關鍵字"
              select-title="關鍵字"
              select-type="keyword"
              :select-list="keywordSelectList"
              @update:select-value="setFilter"
              @is-opened="isSelectOpen"
            />
            <button class="btn-icon btn-search" @click="FilterWelfare">
              <i class="ic-search"></i>
            </button>
          </div>
        </div>
        <div class="part-body">
          <div class="part-articles">
            <div v-if="isLoadingWelfare" class="loading-hint" role="status" aria-live="polite">
              <span class="loading-spinner" aria-hidden="true"></span>
              <span>福利專欄搜尋中…</span>
            </div>
            <ul class="list-unstyled article-list" v-if="isLoadingWelfare">
              <li class="article-item article-item-skeleton" v-for="n in 4" :key="`welfare-skeleton-${n}`">
                <div class="skeleton-line skeleton-line-title"></div>
                <div class="skeleton-line"></div>
                <div class="skeleton-line skeleton-line-info"></div>
              </li>
            </ul>
            <div class="part-empty part-error" v-else-if="hasErrorWelfare">
              <p>{{ welfareErrorMessage }}</p>
              <button class="btn-retry transition-general" @click="loadWelfareList">重新載入</button>
            </div>
            <div class="part-empty" v-else-if="welfareList.length === 0">
              <p>目前沒有符合條件的福利專欄</p>
            </div>
            <ul class="list-unstyled article-list" v-else>
              <!-- 2026-05-25 UIUX #34 — 已讀標記 -->
              <li
                class="article-item transition-general"
                :class="{ 'is-read': readMarksWelfare.isRead(_welfare.id) }"
                v-for="_welfare in welfareList"
                :key="_welfare.id"
              >
                <span class="badge-read" v-if="readMarksWelfare.isRead(_welfare.id)">已讀</span>
                <NuxtLink
                  class="item-page-link"
                  :to="{
                    path: '/articles/welfare',
                    query: { id: _welfare.id },
                  }"
                >
                  <div class="item-top">
                    <span class="btn btn-tag active">{{ _welfare.codePolicy }}</span>
                    <span class="item-date">{{ formatDisplayDate(_welfare.releaseTime) }}</span>
                  </div>
                  <div class="item-title">
                    <h2 class="article-title">{{ _welfare.title }}</h2>
                    <ul class="list-unstyled tags-list tags-list-clamp">
                      <li v-for="_keyword in _welfare.codeKeywords" :key="`${_welfare.id}-${_keyword.val}`">
                        {{ _keyword.name }}
                      </li>
                    </ul>
                  </div>
                  <div class="item-body">
                    <div class="item-info">
                      {{ _welfare.content }}
                    </div>
                    <i class="ic-arrow-right link-url transition-general"></i>
                  </div>
                </NuxtLink>
              </li>
            </ul>
          </div>
          <div class="part-pages" v-if="!isLoadingWelfare && !hasErrorWelfare && pageNums_welfare.length > 0">
            <CompPage :page-list="pageNums_welfare" @change-page="PageChange_Welfare"/>
          </div>
        </div>
      </section>

      <section class="section section-lazy bg-section">
        <div class="part-top">
          <div class="title-component">
            <i class="ic-title-pattern"></i>
            <h3 id="articleDummies" class="comp-title">懶人包</h3>
            <span class="comp-shadow">FOR DUMMIES</span>
          </div>
          <div class="part-filter">
            <CompSelect
              placeholder="選擇關鍵字"
              select-title="關鍵字"
              select-type="keyword"
              :select-list="keywordSelectList"
              @update:select-value="FilterLazy"
              @is-opened="isSelectOpen"
            />
          </div>
        </div>
        <div class="part-body">
          <div class="part-articles">
            <div v-if="isLoadingLazy" class="loading-hint" role="status" aria-live="polite">
              <span class="loading-spinner" aria-hidden="true"></span>
              <span>福利懶人包搜尋中…</span>
            </div>
            <ul class="list-unstyled article-list" v-if="isLoadingLazy">
              <li class="article-item article-item-skeleton" v-for="n in 4" :key="`lazy-skeleton-${n}`">
                <div class="skeleton-line skeleton-line-title"></div>
                <div class="skeleton-line"></div>
                <div class="skeleton-line skeleton-line-info"></div>
              </li>
            </ul>
            <div class="part-empty part-error" v-else-if="hasErrorLazy">
              <p>{{ lazyErrorMessage }}</p>
              <button class="btn-retry transition-general" @click="loadLazyList">重新載入</button>
            </div>
            <div class="part-empty" v-else-if="lazyList.length === 0">
              <p>目前沒有符合條件的懶人包</p>
            </div>
            <ul class="list-unstyled article-list" v-else>
              <!-- 2026-05-25 UIUX #34 — 已讀標記 -->
              <li
                class="article-item transition-general"
                :class="{ 'is-read': readMarksLazy.isRead(_lazy.id) }"
                v-for="_lazy in lazyList"
                :key="_lazy.id"
              >
                <span class="badge-read" v-if="readMarksLazy.isRead(_lazy.id)">已讀</span>
                <NuxtLink
                  class="item-page-link"
                  :to="{ path: '/articles/lazy', query: { id: _lazy.id } }"
                >
                  <div class="item-info">
                    <i class="ic-box item-pattern"></i>
                    <div class="item-content">
                      <h5 class="item-title">{{ _lazy.title }}</h5>
                      <ul class="list-unstyled tags-list tags-list-clamp">
                        <li v-for="_keyword in _lazy.codeKeywords" :key="`${_lazy.id}-${_keyword.val}`">
                          {{ _keyword.name }}
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div class="item-link">
                    <i class="ic-arrow-right link-url transition-general"></i>
                  </div>
                </NuxtLink>
              </li>
            </ul>
          </div>
          <div class="part-pages" v-if="!isLoadingLazy && !hasErrorLazy && pageNums_lazy.length > 0">
            <CompPage :page-list="pageNums_lazy" @change-page="PageChange_Lazy"/>
          </div>
        </div>
      </section>
    </div>
    <NuxtPage v-else />
  </div>
</template>

<script setup lang="ts">
import CompSelect from "../components/CompSelect.vue";
import CompPage from "../components/CompPage.vue";

// 2026-05-25 UIUX #34 — 已讀標記(welfare / lazy 各自獨立)
const readMarksWelfare = useReadMarks('articles-welfare')
const readMarksLazy = useReadMarks('articles-lazy')
onMounted(() => {
  readMarksWelfare.load()
  readMarksLazy.load()
})

const isSelectOpened = ref(false);

useHead({
  title: "福利專欄",
  bodyAttrs: {
    class: {
      "overflow-disabled": isSelectOpened,
      "select-mode": isSelectOpened,
    },
  },
});

definePageMeta({
  title: "福利專欄",
  toLinkName: "首頁",
  toLink: "/",
});

const { $WebApiGet, $WebApiGetDetailed } = useNuxtApp();
const { formatDisplayDate } = useDateFormatter();
const { getApiErrorMessage } = useApiErrorMessage();
const { getApiResultArray } = useApiResult();

const PAGEITEMMAX_WELFARE = 4;
const PAGEITEMMAX_LAZY = 8;

const isLoadingWelfare = ref(true);
const hasErrorWelfare = ref(false);
const welfareErrorMessage = ref('福利專欄載入失敗');
const isLoadingLazy = ref(true);
const hasErrorLazy = ref(false);
const lazyErrorMessage = ref('懶人包載入失敗');

interface selectItem {
  name: string;
  val: string | number;
}

interface welfareItem {
  id: number;
  title: string;
  releaseTime: string;
  content: string;
  codePolicy: string;
  codePolicy_ID: number;
  codeKeywords: Array<selectItem>;
}

interface lazyItem {
  id: number;
  title: string;
  codeKeywords: Array<selectItem>;
}

interface pageNum {
  num: number;
  isActive: boolean;
  isHide: boolean;
}

const policySelectList = reactive<Array<selectItem>>([]);
const keywordSelectList = reactive<Array<selectItem>>([]);

async function loadPolicyOptions() {
  const res: any = await $WebApiGet("/Code/GetCodePolicyList");
  const nextList: Array<selectItem> = getApiResultArray<any>(res).map((item: any) => ({
    val: item.id,
    name: item.codeName,
  }));

  policySelectList.splice(0);
  policySelectList.push({ val: "all", name: "全部" });
  policySelectList.push(...nextList);
}

async function loadKeywordOptions() {
  const res: any = await $WebApiGet("/Code/GetCodeKeywordList");
  const nextList: Array<selectItem> = getApiResultArray<any>(res).map((item: any) => ({
    val: item.id,
    name: item.codeName,
  }));

  keywordSelectList.splice(0);
  keywordSelectList.push({ val: "all", name: "全部" });
  keywordSelectList.push(...nextList);
}

const welfareList = reactive<Array<welfareItem>>([]);
const storage_welfareList = reactive<Array<welfareItem>>([]);
const storageAll_welfareList = reactive<Array<welfareItem>>([]);
const pageNums_welfare = reactive<Array<pageNum>>([]);
const welfareFilterPolicy = ref<string | number | undefined>();
const welfareFilterKeyword = ref<string | number | undefined>();

function setPageNums(target: Array<pageNum>, totalItems: number, pageSize: number) {
  target.splice(0);
  const totalPages = Math.ceil(totalItems / pageSize);

  for (let index = 0; index < totalPages; index += 1) {
    target.push({
      num: index + 1,
      isActive: index === 0,
      isHide: false,
    });
  }
}

function syncWelfareDisplay(list: Array<welfareItem>) {
  storage_welfareList.splice(0);
  welfareList.splice(0);
  storage_welfareList.push(...list);
  welfareList.push(...list.slice(0, PAGEITEMMAX_WELFARE));
  setPageNums(pageNums_welfare, list.length, PAGEITEMMAX_WELFARE);
}

function applyWelfareFilter() {
  let nextList = [...storageAll_welfareList];

  if (welfareFilterPolicy.value && welfareFilterPolicy.value !== "all") {
    nextList = nextList.filter((item) => item.codePolicy_ID == welfareFilterPolicy.value);
  }

  if (welfareFilterKeyword.value && welfareFilterKeyword.value !== "all") {
    nextList = nextList.filter((item) =>
      item.codeKeywords.map((keyword) => keyword.val).includes(welfareFilterKeyword.value!)
    );
  }

  syncWelfareDisplay(nextList);
}

async function loadWelfareList() {
  isLoadingWelfare.value = true;
  hasErrorWelfare.value = false;
  welfareErrorMessage.value = '福利專欄載入失敗';
  storage_welfareList.splice(0);
  welfareList.splice(0);
  pageNums_welfare.splice(0);

  try {
    const { data, error } = await $WebApiGetDetailed("/ArticlesWelfare/GetArticlesWelfareList");
    const list = getApiResultArray<any>(data);
    if (error || list.length === 0) {
      throw error || new Error("Empty welfare response");
    }

    const nextList: Array<welfareItem> = list.map((item: any) => ({
      id: item.id,
      title: item.title,
      releaseTime: item.releaseTime,
      content: item.detail,
      codePolicy_ID: item.codePolicy_ID,
      codePolicy: item.codePolicy_LabelName,
      codeKeywords: item.codeKeywordList.map((_code: any) => ({
        name: _code.codeName,
        val: _code.id,
      })),
    }));

    storageAll_welfareList.splice(0);
    storageAll_welfareList.push(...nextList);
    applyWelfareFilter();
  } catch (error) {
    console.warn("[articles][welfare] load failed:", error);
    hasErrorWelfare.value = true;
    welfareErrorMessage.value = getApiErrorMessage(error, '福利專欄載入失敗');
    storageAll_welfareList.splice(0);
  } finally {
    isLoadingWelfare.value = false;
  }
}

function PageChange_Welfare(pageNum: number) {
  welfareList.splice(0);
  const indexStart = (pageNum - 1) * PAGEITEMMAX_WELFARE;
  const indexEnd = Math.min(pageNum * PAGEITEMMAX_WELFARE, storage_welfareList.length);
  welfareList.push(...storage_welfareList.slice(indexStart, indexEnd));
}

function setFilter(type: string, val: string | number) {
  if (type === "policy") welfareFilterPolicy.value = val;
  if (type === "keyword") welfareFilterKeyword.value = val;
}

let welfareFilterTimer: ReturnType<typeof setTimeout> | null = null;
watch([welfareFilterPolicy, welfareFilterKeyword], () => {
  if (welfareFilterTimer) clearTimeout(welfareFilterTimer);
  welfareFilterTimer = setTimeout(() => applyWelfareFilter(), 300);
});

function FilterWelfare() {
  applyWelfareFilter();
}

const lazyList = reactive<Array<lazyItem>>([]);
const storage_lazyList = reactive<Array<lazyItem>>([]);
const storageAll_lazy = reactive<Array<lazyItem>>([]);
const pageNums_lazy = reactive<Array<pageNum>>([]);
const lazyFilterKeyword = ref<string | undefined>();

function syncLazyDisplay(list: Array<lazyItem>) {
  storage_lazyList.splice(0);
  lazyList.splice(0);
  storage_lazyList.push(...list);
  lazyList.push(...list.slice(0, PAGEITEMMAX_LAZY));
  setPageNums(pageNums_lazy, list.length, PAGEITEMMAX_LAZY);
}

function applyLazyFilter() {
  const nextList =
    lazyFilterKeyword.value && lazyFilterKeyword.value !== "all"
      ? storageAll_lazy.filter((item) =>
          item.codeKeywords.map((keyword) => keyword.val).includes(lazyFilterKeyword.value!)
        )
      : [...storageAll_lazy];

  syncLazyDisplay(nextList);
}

async function loadLazyList() {
  isLoadingLazy.value = true;
  hasErrorLazy.value = false;
  lazyErrorMessage.value = '懶人包載入失敗';
  storage_lazyList.splice(0);
  lazyList.splice(0);
  pageNums_lazy.splice(0);

  try {
    const { data, error } = await $WebApiGetDetailed("/ArticlesLazy/GetArticlesLazyList");
    const list = getApiResultArray<any>(data);
    if (error || list.length === 0) {
      throw error || new Error("Empty lazy response");
    }

    const nextList: Array<lazyItem> = list.map((item: any) => ({
      id: item.id,
      title: item.title,
      codeKeywords: item.codeKeywordList.map((_code: any) => ({
        name: _code.codeName,
        val: _code.id,
      })),
    }));

    storageAll_lazy.splice(0);
    storageAll_lazy.push(...nextList);
    applyLazyFilter();
  } catch (error) {
    console.warn("[articles][lazy] load failed:", error);
    hasErrorLazy.value = true;
    lazyErrorMessage.value = getApiErrorMessage(error, '懶人包載入失敗');
    storageAll_lazy.splice(0);
  } finally {
    isLoadingLazy.value = false;
  }
}

function PageChange_Lazy(pageNum: number) {
  lazyList.splice(0);
  const indexStart = (pageNum - 1) * PAGEITEMMAX_LAZY;
  const indexEnd = Math.min(pageNum * PAGEITEMMAX_LAZY, storage_lazyList.length);
  lazyList.push(...storage_lazyList.slice(indexStart, indexEnd));
}

function FilterLazy(type: string, val: string) {
  lazyFilterKeyword.value = val;
  applyLazyFilter();
}

function isSelectOpen(type: string, val: boolean) {
  isSelectOpened.value = val;
}

void Promise.allSettled([
  loadPolicyOptions(),
  loadKeywordOptions(),
  loadWelfareList(),
  loadLazyList(),
]);

onBeforeUnmount(() => {
  if (welfareFilterTimer) {
    clearTimeout(welfareFilterTimer);
  }
});
</script>
