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
              :select-default="codeSelect_policy"
              aria-labelledby="label-policy"
              @update:select-value="getSelectValue"
              @is-opened="isSelectOpen"
            />
            <p class="filter-error" v-if="policyError" role="alert">
              <span>{{ policyError }}</span>
              <button type="button" class="btn-retry-inline transition-general" @click="loadPolicyList">重試</button>
            </p>
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
            <p class="filter-error" v-if="recipientError" role="alert">
              <span>{{ recipientError }}</span>
              <button type="button" class="btn-retry-inline transition-general" @click="loadRecipientList">重試</button>
            </p>
          </div>
          <div class="item item-identity">
            <label class="filter-name" id="label-area" for="select-area">受助者戶籍地</label>
            <CompSelect
              id="select-area"
              placeholder="選擇受助者所在戶籍"
              select-title="戶籍地"
              select-type="area"
              :select-list="areaSelectList"
              :select-default="codeSelectArea"
              aria-labelledby="label-area"
              @update:select-value="getSelectValue"
              @is-opened="isSelectOpen"
            />
            <p class="filter-error" v-if="areaError" role="alert">
              <span>{{ areaError }}</span>
              <button type="button" class="btn-retry-inline transition-general" @click="loadAreaList">重試</button>
            </p>
          </div>
          <div class="item item-query">
            <label class="filter-name">關鍵字</label>
            <div class="query-action-row">
              <div class="query-field">
                <!--
                  placeholder 從「請輸入關鍵字」改成一句示範：最需要這個網站的人，
                  正是不知道該打什麼關鍵字的人。搜尋本來就吃得下口語與處境描述，
                  只是沒人告訴使用者可以這樣打，所以直接把用法示範在提示裡。
                  aria-label 維持「搜尋福利關鍵字」——提示文字一打字就消失，
                  不能拿來當報讀軟體念的名稱。
                -->
                <IfareSearchAutocomplete
                  v-model="searchQuery"
                  :filters="autocompleteFilters"
                  placeholder="用您的狀況描述，例如：我媽媽需要人照顧"
                  aria-label="搜尋福利關鍵字"
                  @submit="Search"
                />
              </div>
              <button
                class="btn-filter transition-general btn-query-submit"
                type="submit"
                @click="Search"
                :disabled="!canSearch"
                :aria-disabled="!canSearch"
              >
                <span>搜尋</span>
                <i class="icon ic-search" aria-hidden="true"></i>
              </button>
            </div>
            <!--
              範例問法：光把 placeholder 換成示範句還不夠，那行字一按下輸入框就不見了。
              這排是可以直接點的真按鈕，點下去＝幫使用者把句子填進關鍵字欄再送出，
              走的是跟自己打字後按「搜尋」完全相同的 Search()。
            -->
            <div class="query-examples" role="group" aria-labelledby="label-query-examples">
              <span class="query-examples-label" id="label-query-examples">不知道怎麼描述？試試看：</span>
              <button
                class="btn-query-example transition-general"
                type="button"
                v-for="_example in searchExamples"
                :key="_example"
                @click="SearchExample(_example)"
              >{{ _example }}</button>
            </div>
          </div>
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
          <!-- API 掛掉時給明確錯誤與重試，取代原本靜默的空清單（#21） -->
          <div class="part-empty part-error" v-if="officeError" role="alert">
            <p>{{ officeError }}</p>
            <button class="btn-retry transition-general" type="button" @click="loadOfficeList">重新載入</button>
          </div>
          <div class="part-list" v-if="!officeError">
            <ul class="list-unstyled agency-list">
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
          <div class="part-pages" v-if="!officeError">
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
          <!-- API 掛掉時給明確錯誤與重試，取代原本靜默的空區塊（#21） -->
          <div class="part-empty part-error" v-if="qaError" role="alert">
            <p>{{ qaError }}</p>
            <button class="btn-retry transition-general" type="button" @click="loadQAList">重新載入</button>
          </div>
          <div class="part-faq" v-if="!qaError">
            <ul class="list-unstyled faq-list">
              <li
                class="faq-item transition-general"
                :class="{ active: item.isActive }"
                @click="item.isActive = !item.isActive"
                @keydown.enter.prevent="item.isActive = !item.isActive"
                @keydown.space.prevent="item.isActive = !item.isActive"
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
          <div class="part-pages" v-if="!qaError">
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
// 這頁五個清單 API 全部改走 Detailed 版本：$WebApiGet 會把連線錯誤吞成 null（見
// plugins/WebAPI.ts），呼叫端無從分辨「API 掛了」還是「真的沒資料」，畫面只能一起
// 留白。Detailed 版本會一併回傳 error，才能在失敗時顯示提示與重試（#21）。
const { $WebApiGetDetailed } = useNuxtApp();
const { getApiResultArray } = useApiResult();
const { getApiErrorMessage } = useApiErrorMessage();
const $router = useRouter();
import CompSelect from "../components/CompSelect.vue";
import CompPage from "../components/CompPage.vue"
import IfareSearchAutocomplete from "~/components/IfareSearchAutocomplete.vue";

interface selectItem {
  name: string;
  val: string;
  isActive: boolean;
}

const ALL_POLICY_VALUE = "全部";
const ALL_AREA_VALUE = "全國";

// id 1 是後端各代碼／清單共用的「不限／中央」佔位項，固定放在資料第一筆。
// 對象別、機構清單、常見問題都靠它把佔位項濾掉；此約定由後端維護，
// 後端若日後改變佔位項的 id，下面幾處篩選要一起調整。
const UNRESTRICTED_CODE_ID = 1;

// 載入失敗時的預設說法（getApiErrorMessage 分不出確切類別時的墊底字串）
const CODE_ERROR_MESSAGE = "選項載入失敗，請重試。";
const OFFICE_ERROR_MESSAGE = "相關福利機構載入失敗，請稍後再試。";
const QA_ERROR_MESSAGE = "常見福利問題載入失敗，請稍後再試。";

function isSelectOpen(type: string, val: boolean) {
  // console.log(`[${type}] val => ${val} || type ${typeof val}`)
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

const policySelectList = reactive<Array<selectItem>>([
  { name: ALL_POLICY_VALUE, val: ALL_POLICY_VALUE, isActive: false },
]);
const codeSelect_policy = ref(ALL_POLICY_VALUE);
const areaSelectList = reactive<Array<selectItem>>([
  { name: ALL_AREA_VALUE, val: ALL_AREA_VALUE, isActive: false },
]);
const codeSelectArea = ref(ALL_AREA_VALUE);
const searchQuery = ref("");

// 搜尋框下方的範例問法。刻意用第一人稱的口語描述，而不是「失業補助」這種名詞，
// 因為要示範的正是「可以講人話」這件事。
// 這十二句都先在正式資料上逐句查過、確定搜得到結果（2026-08-27 走真實結果頁驗證），
// 要換句子前請一樣先確認搜得到東西——點下去卻是空結果，比不給範例更打擊人。
// 順序刻意把相近主題錯開（經濟、老人、兒少、身障各自分散），避免連續幾顆同一類。
const searchExamples = [
  "我最近失業沒有收入",
  "我媽媽需要人照顧",
  "我懷孕了有什麼補助",
  "家裡有身心障礙者",
  "我付不出房租",
  "家人得了癌症",
  "小孩發展比較慢",
  "老人家想裝假牙",
  "孩子的學費繳不出來",
  "需要輪椅或助行器",
  "我想申請低收入戶",
  "家人過世要辦後事",
];

const recipientSelectList = reactive<Array<selectItem>>([]);
const codeSelectRecipient = ref("");
const isVisibleRecipient = ref(true)
const canSearch = computed(() => {
  return Boolean(
    codeSelect_policy.value ||
    codeSelectRecipient.value ||
    codeSelectArea.value ||
    searchQuery.value.trim()
  );
});
const autocompleteFilters = computed(() => ({
  CodePolicy: codeSelect_policy.value && codeSelect_policy.value !== ALL_POLICY_VALUE ? codeSelect_policy.value : undefined,
  CodeRecipient: codeSelectRecipient.value || undefined,
  CodeDomicile: codeSelectArea.value !== ALL_AREA_VALUE ? codeSelectArea.value : undefined,
}));

function getSelectValue(type: string, val: string) {
  // console.log(`[${type}] val => ${val}`)
  if (type == "policy") {
    codeSelect_policy.value = val;
    // isVisibleRecipient.value = true
  }
  if (type == "area") {
    codeSelectArea.value = val || ALL_AREA_VALUE;
  }
}

// Code Policy
const policyError = ref("");
async function loadPolicyList() {
  policyError.value = "";
  const { data, error } = await $WebApiGetDetailed("/Code/GetCodePolicyList");
  // API 真的掛了才顯示錯誤與重試；連得上但沒資料維持原本行為（靜靜留著預設項）
  if (error) {
    policyError.value = getApiErrorMessage(error, CODE_ERROR_MESSAGE);
    return;
  }
  const _data = getApiResultArray<any>(data);

  let _list: Array<selectItem> = _data.map((item: any, i: number) => {
    return {
      name: item.codeName,
      val: String(item.id),
    };
  });

  // 只保留第 0 筆預設「全部」，其餘重建，重試時才不會把選項疊加兩份
  policySelectList.splice(1);
  policySelectList.push(..._list);
}
// #19 這頁五份清單都只餵畫面、沒有 SEO 需求，而且原本就是 setup 頂層的 fire-and-forget：
// SSR 不會等它們，伺服器打出去的那一輪結果直接被丟掉，客戶端還得再打一次。
// 改掛 onMounted 之後只在瀏覽器打一次，後端負載少一半，畫面表現與原本相同。
onMounted(() => {
  loadPolicyList();
});

// Code area
const areaError = ref("");
async function loadAreaList() {
  areaError.value = "";
  const { data, error } = await $WebApiGetDetailed("/Code/GetCodeDomicileList");
  if (error) {
    areaError.value = getApiErrorMessage(error, CODE_ERROR_MESSAGE);
    return;
  }
  const _data = getApiResultArray<any>(data);

  let _list: Array<selectItem> = _data.map((item: any, i: number) => {
    return {
      name: item.codeName,
      val: String(item.id),
    };
  });

  // 只保留第 0 筆預設「全國」，其餘重建，避免重試時重複疊加
  areaSelectList.splice(1);
  areaSelectList.push(..._list);
}
onMounted(() => {
  loadAreaList();
});

// Code recipient
const recipientError = ref("");
async function loadRecipientList() {
  recipientError.value = "";
  const { data, error } = await $WebApiGetDetailed("/Code/GetCodeRecipientList");
  if (error) {
    recipientError.value = getApiErrorMessage(error, CODE_ERROR_MESSAGE);
    return;
  }
  const _data = getApiResultArray<any>(data);

  // 原本用 _data.slice(1) 略過第 0 筆佔位項，改以 id 判斷：意圖更明確，也不再假設
  // 佔位項一定排在第一筆。濾掉「不限」佔位項（UNRESTRICTED_CODE_ID）後才是真正的對象別。
  let _list: Array<selectItem> = _data
    .filter((item: any) => item.id != UNRESTRICTED_CODE_ID)
    .map((item: any, i: number) => {
      return {
        name: item.codeName,
        val: String(item.id),
        isActive: false,
      };
    });

  // 重試時清空重建，避免標籤重複
  recipientSelectList.splice(0);
  recipientSelectList.push(..._list);
}
onMounted(() => {
  loadRecipientList();
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
  if (!canSearch.value) return false;
  let query: any = {
    policy: codeSelect_policy.value || ALL_POLICY_VALUE,
    area: codeSelectArea.value || ALL_AREA_VALUE,
  };
  if (codeSelectRecipient.value) query.recipient = codeSelectRecipient.value;
  if (searchQuery.value.trim()) query.query = searchQuery.value.trim();
  $router.push({ path: "/ifare/result", query: query });
  // Init value.
  codeSelect_policy.value = ALL_POLICY_VALUE
  codeSelectRecipient.value = ""
  recipientSelectList.forEach((item, i) => {
    item.isActive = false;
  });
  codeSelectArea.value = ALL_AREA_VALUE
  searchQuery.value = ""
}

// 點範例問法：只做「填字 + 送出」兩件事，其餘一律交回 Search()。
// 不另外寫跳轉邏輯，未來搜尋條件或路由怎麼改，這裡都會自動跟著一起改。
// Search() 是同步讀 searchQuery.value 的，先指派再呼叫即可，不必等 nextTick。
function SearchExample(example: string) {
  searchQuery.value = example;
  Search();
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

const officeError = ref("");
async function loadOfficeList() {
  officeError.value = "";
  // 重試前先清掉三份狀態再重建，避免資料疊加（storage 全量、officeList 當頁、pageNums 頁碼）
  storageOfficeList.splice(0);
  officeList.splice(0);
  pageNums_office.splice(0);

  const { data, error } = await $WebApiGetDetailed("/FareOfficeUnit/GetIFareOfficeUnitList");
  if (error) {
    officeError.value = getApiErrorMessage(error, OFFICE_ERROR_MESSAGE);
    return;
  }
  const _data = getApiResultArray<any>(data);

  let _newsList: Array<OfficeUnitItem> = _data
    .filter((p: any) => p.id != UNRESTRICTED_CODE_ID) // id 1＝中央／不限佔位項，機構清單不列
    .map((item: any, i: number) => {
      return {
        id: item.id,
        title: item.title,
      };
    });

  storageOfficeList.push(..._newsList);
  officeList.push(
    ..._newsList.slice(
      0,
      _newsList.length > PAGEITEMMAX_OFFICE
        ? PAGEITEMMAX_OFFICE
        : _newsList.length
    )
  );

  // Num page init.
  // #18 頁數要用 storage 全量長度算：officeList 這時已被截成當頁 6 筆，拿它算永遠只有 1～2 頁，
  // 機構超過 12 筆時第 3 頁以後根本不會產生。改用 Math.ceil 也順便修掉整除時多一頁空白。
  const totalPages_office = Math.ceil(storageOfficeList.length / PAGEITEMMAX_OFFICE);
  for (let n = 0; n < totalPages_office; n++) {
    pageNums_office.push({
      num: n + 1,
      isActive: n == 0,
      isHide: false
    });
  }
}
onMounted(() => {
  loadOfficeList();
});

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

const qaError = ref("");
async function loadQAList() {
  qaError.value = "";
  // 同 office：重試前先清空三份狀態，避免疊加
  storageQAList.splice(0);
  qaList.splice(0);
  pageNums_QA.splice(0);

  const { data, error } = await $WebApiGetDetailed("/FareQA/GetIFareQAList");
  if (error) {
    qaError.value = getApiErrorMessage(error, QA_ERROR_MESSAGE);
    return;
  }
  const _data = getApiResultArray<any>(data);

  let _newsList: Array<QAItem> = _data
    .filter((p: any) => p.id != UNRESTRICTED_CODE_ID) // id 1＝佔位項，常見問題不列
    .map((item: any, i: number) => {
      return {
        id: item.id,
        question: item.question,
        answer: item.answer,
        isActive: false,
      };
    });

  storageQAList.push(..._newsList);
  qaList.push(
    ..._newsList.slice(
      0,
      _newsList.length > PAGEITEMMAX_QA ? PAGEITEMMAX_QA : _newsList.length
    )
  );

  // Num page init.
  for (let n = 0; n <= storageQAList.length / PAGEITEMMAX_QA; n++) {
    pageNums_QA.push({
      num: n + 1,
      isActive: n == 0,
      isHide: false
    });
  }
}
onMounted(() => {
  loadQAList();
});

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
</script>

<style scoped>
/* 下拉／標籤選項載入失敗時的行內提示：比區塊級 .part-error 精簡，直接貼在該欄位下方，
   顏色沿用全站錯誤／空狀態的低彩度灰，不搶版面又看得到（#21） */
.filter-error {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  color: rgba(0, 0, 0, 0.55);
  font-size: 13px;
}

.btn-retry-inline {
  padding: 2px 12px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  background: #fff;
  color: inherit;
  font-size: 13px;
  cursor: pointer;
}

.btn-retry-inline:hover {
  border-color: rgba(0, 0, 0, 0.3);
  background: rgba(0, 0, 0, 0.02);
}

/* 範例問法：沿用卡片內既有的小標籤語彙（低彩度底色、無粗框、hover 才上色），
   但用主色系 pill 圓角，跟上方「受助者年齡區間」那排刻意做出區別——那排是會留著
   選取狀態的篩選標籤，這排點一下就直接送出搜尋，不該長得像可以複選的條件。
   外距交給 .item 既有的 flex gap（桌機 12px／手機 8px），這裡不再自己加 margin。 */
.query-examples {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.query-examples-label {
  color: rgba(23, 24, 24, 0.6);
  font-family: Noto Sans TC;
  font-size: 14px;
  line-height: 22px;
}

.btn-query-example {
  max-width: 100%;
  padding: 6px 14px;
  border: 1px solid rgba(0, 173, 178, 0.32);
  border-radius: 999px;
  background: rgba(0, 173, 178, 0.06);
  color: #007d81;
  font-family: Noto Sans TC;
  font-size: 14px;
  line-height: 20px;
  text-align: left;
  /* 極窄畫面時句子自己折行，寧可變成兩行也不要把卡片撐破 */
  overflow-wrap: anywhere;
  cursor: pointer;
}

.btn-query-example:hover {
  border-color: #00adb2;
  background: rgba(0, 173, 178, 0.14);
}

/* 鍵盤使用者要看得出焦點停在哪顆：外框沿用全站的橘色焦點樣式（error.vue 同款），
   另外一併加深底色，讓高對比模式下即使外框被蓋掉也還看得出來 */
.btn-query-example:focus-visible {
  outline: 2px solid rgba(234, 85, 4, 0.7);
  outline-offset: 2px;
  border-color: #00adb2;
  background: rgba(0, 173, 178, 0.14);
}

/* 手機：說明文字獨佔一行，標籤才有整行寬度可以排；字級跟著 .filter-name 一起降 */
@media (max-width: 768px) {
  .query-examples-label {
    flex: 1 0 100%;
    font-size: 13px;
    line-height: 20px;
  }

  .btn-query-example {
    padding: 6px 12px;
    font-size: 13px;
  }
}
</style>
