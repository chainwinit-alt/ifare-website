<template>
  <div class="app-body" :name="$route.name">
    <div class="bg-sector-bottom"></div>
    <div class="part-bg">
      <div
        class="bg-ifare"
        :class="{
          'ic-ifare-bg':
            $route.name == 'ifare' || $route.name == 'ifare-result',
        }"
      ></div>
    </div>
    <div class="page-navs" v-show="$route.name != 'ifare'" :name="$route.name">
      <ul class="list-unstyled">
        <li v-for="_page in $route.matched">
          <NuxtLink :to="`${_page.meta.toLink}`">{{
            _page.meta.toLinkName
          }}</NuxtLink>
        </li>
      </ul>
      <h3 class="nav-title" v-show="$route.name == 'ifare-result'">搜尋結果</h3>
    </div>
    <div class="ifare-index section-list bg-section-list" v-if="$route.name == 'ifare'">
      <section class="section-top">
        <div class="title-comp">
          <h1 class="ifare-title">
            <span class="ic-ifare-logo">
              <!-- <i class="ic-title-pattern"></i> -->
              <!-- <i class="ic-i-mini-logo"></i> -->
            </span>
            <span class="mini-title">福利好幫手</span>
          </h1>
          <h3 class="ifare-subtitle">
            <span>找尋適合您的社會福利</span>
          </h3>
        </div>
        <div class="life-event-guide" aria-labelledby="life-event-title">
          <div class="life-event-guide__top">
            <h2 id="life-event-title">從人生事件開始找福利</h2>
            <p>不用先懂政策分類，先選目前遇到的情境。</p>
          </div>
          <div class="life-event-list">
            <button
              v-for="event in welfareLifeEvents"
              :key="event.key"
              class="life-event-card transition-general"
              type="button"
              @click="SearchByLifeEvent(event)"
            >
              <span class="life-event-card__name">{{ event.name }}</span>
              <span class="life-event-card__desc">{{ event.description }}</span>
            </button>
          </div>
        </div>
        <div class="card-ifare-filter" role="search" aria-labelledby="ifare-search-title">
          <span id="ifare-search-title" class="sr-only">i-Fare 福利搜尋表單</span>
          <div class="item item-policy">
            <label class="filter-name" id="label-policy" for="select-policy">受助者情況</label>
            <CompSelect
              id="select-policy"
              placeholder="選擇受助情境"
              select-title="受助情境"
              select-type="policy"
              :select-list="policySelectList"
              aria-labelledby="label-policy"
              @update:select-value="getSelectValue"
              @is-opened="isSelectOpen"
            />
          </div>
          <div class="item item-recipient transition-general" :class="{'visible': isVisibleRecipient}">
            <label class="filter-name" id="label-recipient">受助者年齡區間</label>
            <div class="btn-tag-list" role="group" aria-labelledby="label-recipient">
              <span
                class="btn btn-tag transition-general"
                :class="{ active: _recipient.isActive }"
                role="button"
                tabindex="0"
                :aria-pressed="_recipient.isActive"
                @click="SwitchRecipient(_recipient.val)"
                @keydown.enter.prevent="SwitchRecipient(_recipient.val)"
                @keydown.space.prevent="SwitchRecipient(_recipient.val)"
                :name="_recipient.name"
                v-for="_recipient in recipientSelectList"
                :key="_recipient.val"
                >{{ _recipient.name }}</span
              >
            </div>
          </div>
          <div class="item item-identity">
            <label class="filter-name" id="label-area" for="select-area">受助者戶籍地</label>
            <CompSelect
              id="select-area"
              placeholder="選擇受助者所在戶籍"
              select-title="戶籍地"
              select-type="area"
              :select-list="areaSelectList"
              aria-labelledby="label-area"
              @update:select-value="getSelectValue"
              @is-opened="isSelectOpen"
            />
          </div>
          <div class="item item-query">
            <label class="filter-name">關鍵字</label>
            <div class="query-input-wrap">
              <input
                v-model="searchQuery"
                class="input-query"
                type="text"
                maxlength="50"
                placeholder="請輸入關鍵字"
              />
              <button
                v-show="searchQuery.trim()"
                class="btn-clear-query transition-general"
                type="button"
                aria-label="清空關鍵字"
                @click="ClearSearchQuery"
              >
                <i class="icon ic-close" aria-hidden="true"></i>
              </button>
              <div class="query-count" aria-live="polite">{{ searchQuery.length }}/50</div>
            </div>
          </div>
          <div class="item item-bottom">
            <button
              class="btn-filter transition-general"
              type="submit"
              @click="Search"
              :disabled="!canSearch"
              :aria-disabled="!canSearch"
            >
              <span>搜尋</span>
              <i class="icon ic-search" aria-hidden="true"></i>
            </button>
            <p
              v-if="hasAttemptedSearch && !canSearch"
              class="search-error"
              role="alert"
            >請至少填一個篩選條件</p>
          </div>
        </div>

        <!-- 2026-05-25 UIUX #4 — 熱門搜尋快速入口(hardcoded 一組,後續可串 GA4 真實熱門資料) -->
        <div class="hot-searches" aria-label="熱門搜尋">
          <h3 class="hot-searches__title">
            <span class="hot-searches__icon" aria-hidden="true">🔥</span>
            熱門搜尋
          </h3>
          <ul class="hot-searches__list">
            <li v-for="kw in HOT_KEYWORDS" :key="kw">
              <button
                type="button"
                class="hot-search-chip transition-general"
                @click="applyHotKeyword(kw)"
              >{{ kw }}</button>
            </li>
          </ul>
        </div>

        <!-- 2026-05-25 UIUX #5 — 最近搜尋紀錄,點 chip 直接執行同樣的搜尋 -->
        <div v-if="recentSearches.items.value.length > 0" class="recent-searches" aria-label="最近搜尋紀錄">
          <div class="recent-searches__head">
            <h3 class="recent-searches__title">
              <i class="ic-recent" aria-hidden="true"></i>
              最近搜尋
            </h3>
            <button
              type="button"
              class="recent-searches__clear"
              @click="recentSearches.clear"
            >清除全部</button>
          </div>
          <ul class="recent-searches__list">
            <li
              v-for="(item, idx) in recentSearches.items.value"
              :key="item.timestamp"
              class="recent-search-item"
            >
              <button
                type="button"
                class="recent-search-chip transition-general"
                @click="applyRecentSearch(item)"
                :title="`再次搜尋:${item.label}`"
              >
                <span>{{ item.label }}</span>
              </button>
              <button
                type="button"
                class="recent-search-remove"
                @click="recentSearches.remove(idx)"
                :aria-label="`移除「${item.label}」`"
              >×</button>
            </li>
          </ul>
        </div>
      </section>
      <section class="section-agency bg-section">
        <div class="bg-radial"></div>
        <div class="part-top">
          <div class="title-component">
            <i class="ic-title-pattern"></i>
            <h3 class="comp-title">相關福利機構</h3>
            <span class="comp-shadow">AGENCY</span>
          </div>
        </div>
        <div class="part-body">
          <div class="part-list">
            <div v-if="isLoadingOffice" class="part-empty">相關福利機構載入中...</div>
            <div v-else-if="hasErrorOffice" class="part-empty part-error" role="alert">
              <p>{{ officeErrorMessage }}</p>
              <button class="btn-retry transition-general" type="button" @click="loadOfficeList">重新載入</button>
            </div>
            <div v-else-if="officeList.length === 0" class="part-empty">
              <p>目前沒有相關福利機構資料</p>
            </div>
            <ul v-else class="list-unstyled agency-list">
              <li
                class="agency-item"
                v-for="_office in officeList"
                :key="_office.id"
              >
                <NuxtLink
                    :to="{ path: '/ifare/contact', query: { id: _office.id } }"
                    class="item-page-link"
                  >
                  <span class="agency-name">{{ _office.title }}</span>
                  <i class="ic-open link-url"
                  ></i>
                </NuxtLink>
              </li>
            </ul>
          </div>
          <div v-if="!isLoadingOffice && !hasErrorOffice && officeList.length > 0" class="part-pages">
            <!-- 2026-05-25 UIUX #51 — 合併後 CompPage 用 mode="num" 取代原 CompPageNum -->
            <CompPage mode="num" :page-list="pageNums_office" @change-page="PageChange_Office"/>
          </div>
        </div>
      </section>
      <section class="section-faq bg-section">
        <div class="part-top">
          <div class="title-component">
            <i class="ic-title-pattern"></i>
            <h3 class="comp-title">常見福利問題</h3>
            <span class="comp-shadow">FAQ</span>
          </div>
        </div>
        <div class="part-body">
          <div class="part-faq">
            <div v-if="isLoadingQA" class="part-empty">常見福利問題載入中...</div>
            <div v-else-if="hasErrorQA" class="part-empty part-error" role="alert">
              <p>{{ qaErrorMessage }}</p>
              <button class="btn-retry transition-general" type="button" @click="loadQAList">重新載入</button>
            </div>
            <div v-else-if="qaList.length === 0" class="part-empty">
              <p>目前沒有常見福利問題</p>
            </div>
            <ul v-else class="list-unstyled faq-list">
              <li
                class="faq-item transition-general"
                :class="{ active: item.isActive }"
                @click="ToggleQA(item)"
                @keydown.enter.prevent="ToggleQA(item)"
                @keydown.space.prevent="ToggleQA(item)"
                v-for="(item, i) in qaList"
                :key="i"
                role="button"
                tabindex="0"
                :aria-expanded="item.isActive"
                :aria-controls="`faq-info-${i}`"
              >
                <div class="faq-comp">
                  <h5 class="faq-title">
                    <i
                      class="faq-logo ic-faq transition-general"
                      aria-hidden="true"
                    ></i>
                    <span>{{ item.question }}</span>
                  </h5>
                  <i
                    class="open-switch transition-general"
                    :class="{
                      'ic-plus': !item.isActive,
                      'ic-dash-primary-dark': item.isActive,
                    }"
                    aria-hidden="true"
                  ></i>
                </div>
                <div class="faq-info transition-general" :id="`faq-info-${i}`" :aria-hidden="!item.isActive">
                  <span class="info-content transition-general">{{ item.answer }}</span>
                </div>
              </li>
            </ul>
          </div>
          <div v-if="!isLoadingQA && !hasErrorQA && qaList.length > 0" class="part-pages">
            <CompPage mode="num" :page-list="pageNums_QA" @change-page="PageChange_QA"/>
          </div>
        </div>
      </section>
    </div>
    <NuxtPage v-else />
  </div>
</template>

<script setup lang="ts">
const _isSelect = ref(false)
useHead({
  title: 'i-Fare',
  bodyAttrs: {
    class: {
      "overflow-disabled": _isSelect,
      "select-mode": _isSelect
    }
  }
})
definePageMeta({
  title: "ifare",
  toLinkName: "首頁",
  toLink: "/",
});
const { $WebApiGet, $WebApiGetDetailed } = useNuxtApp();
const { getApiResultArray } = useApiResult();
const { getApiErrorMessage } = useApiErrorMessage();
const { welfareLifeEvents } = useWelfareLifeEvents();
const { loadWelfareProfile, saveWelfareProfile } = useWelfareProfile();
const $router = useRouter();
import CompSelect from "../components/CompSelect.vue";
import CompPage from "../components/CompPage.vue"

interface selectItem {
  name: string;
  val: string;
  isActive: boolean;
}

const ALL_POLICY_VALUE = "__all_policy";
const ALL_AREA_VALUE = "__all_area";

// 2026-05-25 UIUX #5 — 最近搜尋紀錄
const recentSearches = useRecentSearches();
onMounted(() => recentSearches.load());

// 2026-05-25 UIUX #4 — 熱門搜尋(hardcoded 一組常見福利關鍵字;未來可串 GA4 真實 query)
const HOT_KEYWORDS = [
  '育兒津貼',
  '老人福利',
  '身心障礙',
  '低收入戶',
  '租屋補助',
  '托育補助',
  '醫療補助',
  '就業協助',
];

function applyHotKeyword(keyword: string) {
  $router.push({
    path: '/ifare/result',
    query: { query: keyword },
  });
  // 同步記到「最近搜尋」
  recentSearches.add({ label: `「${keyword}」`, query: { query: keyword } });
}

/** 點最近搜尋 chip:用儲存的 query 直接跳到結果頁 */
function applyRecentSearch(item: ReturnType<typeof useRecentSearches>['items']['value'][number]) {
  $router.push({ path: '/ifare/result', query: item.query });
}

/** 從目前選的條件組「最近搜尋」label,顯示中文比較好認 */
function buildRecentSearchLabel(): string {
  const parts: string[] = [];
  // 找 select-list 對應的中文名
  const policyName = policySelectList.find((p) => p.val === codeSelect_policy.value)?.name;
  const recipientName = recipientSelectList.find((p) => p.val === codeSelectRecipient.value)?.name;
  const areaName = areaSelectList.find((p) => p.val === codeSelect_area.value)?.name;
  if (policyName && policyName !== '全部') parts.push(policyName);
  if (recipientName) parts.push(recipientName);
  if (areaName && areaName !== '全國') parts.push(areaName);
  if (searchQuery.value.trim()) parts.push(`「${searchQuery.value.trim()}」`);
  return parts.join(' · ');
}

function isSelectOpen(type: string, val: boolean) {
  _isSelect.value = val
  // useHead({
  //   bodyAttrs: {
  //     class: {
  //       "overflow-disabled": val,
  //       "select-mode": val
  //     }
  //   }
  // })
}

const policySelectList = reactive<Array<selectItem>>([]);
const codeSelect_policy = ref("");
const areaSelectList = reactive<Array<selectItem>>([]);
const codeSelect_area = ref("");
const searchQuery = ref("");
const recipientSelectList = reactive<Array<selectItem>>([]);
const codeSelectRecipient = ref("");
const isVisibleRecipient = ref(false)
const selectedLifeEvent = ref("");
const canSearch = computed(() => {
  return Boolean(
    codeSelect_policy.value ||
    codeSelectRecipient.value ||
    codeSelect_area.value ||
    searchQuery.value.trim()
  );
});

// #1 — 篩選不完整時錯誤訊息。使用者點過搜尋且 canSearch 仍為 false 時顯示
const hasAttemptedSearch = ref(false);

function getSelectValue(type: string, val: string) {
  if (type == "policy") {
    codeSelect_policy.value = val;
    if (val) isVisibleRecipient.value = true;
  }

  if (type == "area") {
    codeSelect_area.value = val;
  }
}

// Code Policy
const codePolicy = $WebApiGet("/Code/GetCodePolicyList");
codePolicy.then((res: any) => {
  const _data = getApiResultArray<any>(res);
  if (_data.length === 0) return;

let _list: Array<selectItem> = _data.map((item: any, i: number) => {
    return {
      name: item.codeName,
      val: item.id,
    };
  });

  policySelectList.push({ name: "全部", val: ALL_POLICY_VALUE, isActive: false }, ..._list);
});

// Code area
const codeArea = $WebApiGet("/Code/GetCodeDomicileList");
codeArea.then((res: any) => {
  const _data = getApiResultArray<any>(res);
  if (_data.length === 0) return;

let _list: Array<selectItem> = _data.map((item: any, i: number) => {
    return {
      name: item.codeName,
      val: item.id,
    };
  });

  areaSelectList.push({ name: "全國", val: ALL_AREA_VALUE, isActive: false }, ..._list);
});

// Code recipient
const codeRecipient = $WebApiGet("/Code/GetCodeRecipientList");
codeRecipient.then((res: any) => {
  const _data = getApiResultArray<any>(res);
  if (_data.length === 0) return;

  let _list: Array<selectItem> = _data.slice(1).map((item: any, i: number) => {
    return {
      name: item.codeName,
      val: item.id,
      isActive: false,
    };
  });

  recipientSelectList.push(..._list);
});

function SwitchRecipient(codeVal: any) {
  const selectedItem = recipientSelectList.find((item) => item.val == codeVal);
  if (selectedItem?.isActive) {
    selectedItem.isActive = false;
    codeSelectRecipient.value = "";
    return;
  }

  recipientSelectList.forEach((item, i) => {
    item.isActive = item.val == codeVal;
    if (item.isActive) {
      codeSelectRecipient.value = item.val;
    }
  });
}

function Search() {
  hasAttemptedSearch.value = true;
  if (!canSearch.value) return false;
  let query: any = {};
  if (codeSelect_policy.value) query.policy = codeSelect_policy.value;
  if (codeSelectRecipient.value) query.recipient = codeSelectRecipient.value;
  if (codeSelect_area.value) query.area = codeSelect_area.value;
  if (searchQuery.value.trim()) query.query = searchQuery.value.trim();
  if (selectedLifeEvent.value) query.event = selectedLifeEvent.value;
  saveWelfareProfile({
    policy: codeSelect_policy.value,
    recipient: codeSelectRecipient.value,
    area: codeSelect_area.value,
    query: searchQuery.value.trim(),
    lifeEvent: selectedLifeEvent.value,
  });
  // 2026-05-25 UIUX #5 — 把這次搜尋條件加入「最近搜尋」(自動 dedup,只留最近 5 筆)
  const label = buildRecentSearchLabel();
  if (label) {
    recentSearches.add({ label, query });
  }
  $router.push({ path: "/ifare/result", query: query });
  // Init value.
  codeSelect_policy.value = ""
  codeSelectRecipient.value = ""
  recipientSelectList.forEach((item, i) => {
    item.isActive = false;
  });
  codeSelect_area.value = ""
  searchQuery.value = ""
  selectedLifeEvent.value = ""
}

function ClearSearchQuery() {
  searchQuery.value = "";
}

function SearchByLifeEvent(event: any) {
  selectedLifeEvent.value = event.key;
  searchQuery.value = event.query;
  saveWelfareProfile({
    query: event.query,
    lifeEvent: event.key,
  });
  // 2026-05-25 UIUX #5 — 人生事件搜尋也加入「最近搜尋」
  recentSearches.add({
    label: event.name || event.query,
    query: { query: event.query, event: event.key },
  });
  $router.push({
    path: "/ifare/result",
    query: {
      query: event.query,
      event: event.key,
    },
  });
}

// Office Unit
interface OfficeUnitItem {
  id: number;
  title: string;
}

interface pageNum {
  num: number;
  isActive: boolean;
  isHide: boolean;
}

const officeList = reactive<Array<OfficeUnitItem>>([]);
const storageOfficeList = reactive<Array<OfficeUnitItem>>([]);
const pageNums_office = reactive<Array<pageNum>>([]);
const PAGEITEMMAX_OFFICE = 6;
const isLoadingOffice = ref(true);
const hasErrorOffice = ref(false);
const officeErrorMessage = ref('相關福利機構載入失敗');

async function loadOfficeList() {
  isLoadingOffice.value = true;
  hasErrorOffice.value = false;
  officeErrorMessage.value = '相關福利機構載入失敗';
  officeList.splice(0);
  storageOfficeList.splice(0);
  pageNums_office.splice(0);

  try {
    const { data, error } = await $WebApiGetDetailed("/FareOfficeUnit/GetIFareOfficeUnitList");
    const list = getApiResultArray<any>(data);
    if (error || list.length === 0) {
      throw error || new Error('Empty office response');
    }

    const _newsList: Array<OfficeUnitItem> = list
      .filter((p: any) => p.id != 1)
      .map((item: any) => ({
        id: item.id,
        title: item.title,
      }));

    storageOfficeList.push(..._newsList);
    officeList.push(
      ..._newsList.slice(
        0,
        _newsList.length > PAGEITEMMAX_OFFICE
          ? PAGEITEMMAX_OFFICE
          : _newsList.length
      )
    );

    for (let n = 0; n <= officeList.length / PAGEITEMMAX_OFFICE; n++) {
      pageNums_office.push({
        num: n + 1,
        isActive: n == 0,
        isHide: false
      });
    }
  } catch (error) {
    hasErrorOffice.value = true;
    officeErrorMessage.value = getApiErrorMessage(error, '相關福利機構載入失敗');
  } finally {
    isLoadingOffice.value = false;
  }
}

function PageChange_Office(pageNum: number) {
  officeList.splice(0);

  const index_S = (pageNum - 1) * PAGEITEMMAX_OFFICE;
  const index_E =
    pageNum <= storageOfficeList.length / PAGEITEMMAX_OFFICE
      ? pageNum * PAGEITEMMAX_OFFICE
      : storageOfficeList.length;

  let nextItems = storageOfficeList.slice(index_S, index_E);
  officeList.push(...nextItems);
}

function PageSwitch_Office(pageNum: number) {
  pageNums_office.forEach((_page, i) => {
    _page.isActive = _page.num == pageNum;
  });

  officeList.splice(0);

  const index_S = (pageNum - 1) * PAGEITEMMAX_OFFICE;
  const index_E =
    pageNum <= storageOfficeList.length / PAGEITEMMAX_OFFICE
      ? pageNum * PAGEITEMMAX_OFFICE
      : storageOfficeList.length;

  let nextItems = storageOfficeList.slice(index_S, index_E);
  officeList.push(...nextItems);
}

// QA
interface QAItem {
  isActive: boolean;
  question: string;
  answer: string;
}

interface pageNum_QA {
  num: number;
  isActive: boolean;
  isHide: boolean;
}

const qaList = reactive<Array<QAItem>>([]);
const storageQAList = reactive<Array<QAItem>>([]);
const pageNums_QA = reactive<Array<pageNum_QA>>([]);
const PAGEITEMMAX_QA = 9;
const isLoadingQA = ref(true);
const hasErrorQA = ref(false);
const qaErrorMessage = ref('常見福利問題載入失敗');

async function loadQAList() {
  isLoadingQA.value = true;
  hasErrorQA.value = false;
  qaErrorMessage.value = '常見福利問題載入失敗';
  qaList.splice(0);
  storageQAList.splice(0);
  pageNums_QA.splice(0);

  try {
    const { data, error } = await $WebApiGetDetailed("/FareQA/GetIFareQAList");
    const list = getApiResultArray<any>(data);
    if (error || list.length === 0) {
      throw error || new Error('Empty QA response');
    }

    const _newsList: Array<QAItem> = list
      .filter((p: any) => p.id != 1)
      .map((item: any) => ({
        id: item.id,
        question: item.question,
        answer: item.answer,
        isActive: false,
      }));

    storageQAList.push(..._newsList);
    qaList.push(
      ..._newsList.slice(
        0,
        _newsList.length > PAGEITEMMAX_QA ? PAGEITEMMAX_QA : _newsList.length
      )
    );

    for (let n = 0; n <= storageQAList.length / PAGEITEMMAX_QA; n++) {
      pageNums_QA.push({
        num: n + 1,
        isActive: n == 0,
        isHide: false
      });
    }
  } catch (error) {
    hasErrorQA.value = true;
    qaErrorMessage.value = getApiErrorMessage(error, '常見福利問題載入失敗');
  } finally {
    isLoadingQA.value = false;
  }
}

function PageChange_QA(pageNum: number) {
  qaList.splice(0);

  const index_S = (pageNum - 1) * PAGEITEMMAX_QA;
  const index_E =
    pageNum <= storageQAList.length / PAGEITEMMAX_QA
      ? pageNum * PAGEITEMMAX_QA
      : storageQAList.length;

  let nextItems = storageQAList.slice(index_S, index_E);
  qaList.push(...nextItems);
}

function PageSwitch_QA(pageNum: number) {
  pageNums_QA.forEach((_page, i) => {
    _page.isActive = _page.num == pageNum;
  });

  qaList.splice(0);

  const index_S = (pageNum - 1) * PAGEITEMMAX_QA;
  const index_E =
    pageNum <= storageQAList.length / PAGEITEMMAX_QA
      ? pageNum * PAGEITEMMAX_QA
      : storageQAList.length;

  let nextItems = storageQAList.slice(index_S, index_E);
  qaList.push(...nextItems);
}

function ToggleQA(item: QAItem) {
  item.isActive = !item.isActive;
}

const currentPage_Office = ref(1);
const currentPage_QA = ref(1);

// function PageControl(target: string, controlType: string, currentPage: number) {
//   if (controlType == "next") {
//     if (target == "Office") {
//       if (currentPage >= storageOfficeList.length / PAGEITEMMAX_OFFICE) {
//         return false;
//       }

//       currentPage_Office.value += 1;
//     }

//     if (target == "QA") {
//       if (currentPage >= storageQAList.length / PAGEITEMMAX_QA) {
//         return false;
//       }

//       currentPage_QA.value += 1;
//     }
//   }

//   if (controlType == "prev") {
//     if (target == "Office") {
//       if (currentPage <= 1) {
//         return false;
//       }

//       currentPage_Office.value -= 1;
//     }

//     if (target == "QA") {
//       if (currentPage <= 1) {
//         return false;
//       }

//       currentPage_QA.value -= 1;
//     }
//   }

//   if (target == "Office") PageSwitch_Office(currentPage_Office.value);
//   if (target == "QA") PageSwitch_QA(currentPage_QA.value);
//   console.log(storageQAList.length)
// }

loadOfficeList();
loadQAList();

onMounted(() => {
  const profile = loadWelfareProfile();
  if (!profile) return;

  if (!codeSelect_policy.value && profile.policy) {
    codeSelect_policy.value = profile.policy;
    isVisibleRecipient.value = true;
  }
  if (!codeSelect_area.value && profile.area) codeSelect_area.value = profile.area;
  if (!codeSelectRecipient.value && profile.recipient) codeSelectRecipient.value = profile.recipient;
  if (!searchQuery.value && profile.query) searchQuery.value = profile.query;
  if (!selectedLifeEvent.value && profile.lifeEvent) selectedLifeEvent.value = profile.lifeEvent;
});
</script>

<style scoped>
.life-event-guide {
  width: min(100%, 980px);
  margin: 0 auto 24px;
}

.life-event-guide__top {
  margin-bottom: 12px;
  text-align: center;
}

.life-event-guide__top h2 {
  margin: 0 0 6px;
  font-size: 1.35rem;
  line-height: 1.35;
}

.life-event-guide__top p {
  margin: 0;
  color: #52616b;
  line-height: 1.6;
}

.life-event-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.life-event-card {
  display: flex;
  min-height: 94px;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  padding: 16px;
  border: 1px solid rgba(44, 80, 97, 0.18);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 10px 24px rgba(27, 55, 70, 0.08);
  color: #1f3640;
  text-align: left;
  cursor: pointer;
}

.life-event-card:hover,
.life-event-card:focus-visible {
  border-color: #f08a24;
  transform: translateY(-2px);
}

.life-event-card__name {
  font-weight: 700;
  font-size: 1.08rem;
}

.life-event-card__desc {
  color: #52616b;
  font-size: 0.92rem;
  line-height: 1.45;
}

@media (max-width: 768px) {
  .life-event-guide {
    padding: 0 16px;
  }

  .life-event-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .life-event-list {
    grid-template-columns: 1fr;
  }
}

/* 2026-05-25 UIUX #4 — 熱門搜尋 chips */
.hot-searches {
  width: min(100%, 980px);
  margin: 16px auto 0;
  padding: 14px 18px;
  background: linear-gradient(135deg, rgba(234, 85, 4, 0.06), rgba(229, 0, 110, 0.04));
  border: 1px solid rgba(234, 85, 4, 0.2);
  border-radius: 12px;
}

.hot-searches__title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 700;
  color: #1f3640;
}

.hot-searches__icon {
  font-size: 14px;
}

.hot-searches__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hot-search-chip {
  border: 1px solid rgba(234, 85, 4, 0.3);
  background: #ffffff;
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 13px;
  color: #1f3640;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
}

.hot-search-chip:hover {
  background: #ea5504;
  color: #ffffff;
  border-color: #ea5504;
  transform: translateY(-1px);
}

@media (max-width: 520px) {
  .hot-searches {
    margin: 12px 16px 0;
  }
}

/* 2026-05-25 UIUX #5 — 最近搜尋 chips */
.recent-searches {
  width: min(100%, 980px);
  margin: 16px auto 0;
  padding: 14px 18px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(234, 85, 4, 0.18);
  border-radius: 12px;
}

.recent-searches__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.recent-searches__title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #1f3640;

  &::before {
    content: '🕒';
    font-size: 14px;
  }
}

.recent-searches__title .ic-recent {
  display: none; /* 用 ::before emoji 代替 */
}

.recent-searches__clear {
  border: 0;
  background: transparent;
  color: #909399;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.18s ease, color 0.18s ease;
}

.recent-searches__clear:hover {
  background: rgba(245, 108, 108, 0.12);
  color: #f56c6c;
}

.recent-searches__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.recent-search-item {
  display: inline-flex;
  align-items: center;
  background: #ffffff;
  border: 1px solid rgba(234, 85, 4, 0.25);
  border-radius: 999px;
  overflow: hidden;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.recent-search-item:hover {
  border-color: #ea5504;
  box-shadow: 0 4px 12px -6px rgba(234, 85, 4, 0.35);
}

.recent-search-chip {
  border: 0;
  background: transparent;
  padding: 6px 14px;
  font-size: 13px;
  color: #1f3640;
  cursor: pointer;
  max-width: 240px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recent-search-chip:hover {
  color: #ea5504;
}

.recent-search-remove {
  border: 0;
  background: transparent;
  color: #c0c4cc;
  cursor: pointer;
  padding: 4px 10px 4px 4px;
  font-size: 16px;
  line-height: 1;
  transition: color 0.18s ease;
}

.recent-search-remove:hover {
  color: #f56c6c;
}

@media (max-width: 520px) {
  .recent-searches {
    margin: 12px 16px 0;
  }
}
</style>
