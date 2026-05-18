<template>
  <div class="app-body-child" :name="$route.name">
    <div class="section-list">
      <section class="section-filter">
        <div class="card-filter">
          <div class="part-top">
            <div class="filter-group">
              <label class="filter-title">受助者情況</label>
              <CompSelect
                placeholder="選擇受助者情況"
                select-title="受助者情況"
                select-type="policy"
                :select-list="policySelectList"
                :select-default="codeSelect_policy"
                @update:select-value="getSelectValue"
              />
            </div>
            <div class="filter-group">
              <label class="filter-title">受助者年齡區間</label>
              <div class="btn-tag-list">
                <span
                  class="btn btn-tag transition-general"
                  :class="{ active: _recipient.isActive}"
                  :name="_recipient.name"
                  v-for="_recipient in recipientSelectList"
                  :key="_recipient.val"
                  @click="SwitchRecipient(_recipient.val)"
                  >{{ _recipient.name }}</span
                >
              </div>
            </div>
            <div class="filter-group">
              <label class="filter-title">受助者戶籍地</label>
              <CompSelect
                placeholder="選擇受助者戶籍地"
                select-title="受助者戶籍地"
                select-type="area"
                :select-list="areaSelectList"
                :select-default="codeSelect_area"
                @update:select-value="getSelectValue"
              />
            </div>
            <div class="filter-group">
              <label class="filter-title">關鍵字</label>
              <div class="query-action-row">
                <div class="query-field">
                  <IfareSearchAutocomplete
                    v-model="searchQuery"
                    :filters="autocompleteFilters"
                    @submit="Search"
                  />
                </div>
                <button class="btn btn-filter btn-query-submit" @click="Search" :disabled="!isClientReady || !canSearch || isLoading">
                  <span>搜尋</span>
                  <i class="icon ic-search"></i>
                </button>
              </div>
            </div>
          </div>
          <div class="part-bottom" v-show="isOpts">
            <div class="filter-group">
              <label class="filter-title">經濟條件</label>
              <div class="btn-tag-list">
                <span
                  class="btn btn-tag transition-general"
                  :class="{ active: _income.isActive }"
                  v-for="_income in incomeSelectList"
                  :key="_income.val"
                  @click="SwitchIncome(_income.val)"
                  >{{ _income.name }}</span
                >
              </div>
            </div>
            <div class="filter-group">
              <label class="filter-title" name="identity">特殊身分</label>
              <div class="btn-tag-list">
                <span
                  class="btn btn-tag transition-general"
                  :class="{ active: _identity.isActive }"
                  v-for="_identity in identitySelectList"
                  :key="_identity.val"
                  @click="SwitchIdentity(_identity.val)"
                  >{{ _identity.name }}</span
                >
              </div>
            </div>
          </div>
          <div class="part-filter">
            <button
              class="btn btn-advance"
              :class="{ active: isOpts }"
              @click="isOpts = !isOpts"
            >
              <i
                :class="{ 'ic-options': !isOpts, 'ic-arrow-simple-up': isOpts }"
              ></i>
              <span>篩選</span>
            </button>
          </div>
          <div class="part-reset">
            <button class="btn btn-reset" :class="{ 'is-clearing': showResetFeedback }" @click="ResetParam">清空</button>
            <span class="reset-feedback" :class="{ 'is-visible': showResetFeedback }" aria-live="polite">已清空篩選條件</span>
          </div>
        </div>
        <div class="card-filter-mobile">
          <div class="part-filter-btns">
            <div class="part-start">
              <CompSelect
                placeholder="受助者情況"
                select-title="受助者情況"
                select-type="policy"
                :select-list="policySelectList"
                :select-default="codeSelect_policy"
                @is-opened="isSelectOpen"
                @update:select-value="getSelectValue"
              />
            <CompSelectRecipient 
                placeholder="受助者年齡區間"
                select-title="受助者年齡區間"
                select-type="recipient"
                :select-list="recipientSelectList"
                :select-default="codeSelectRecipient"
                @is-opened="isSelectOpen"
                @update:select-value="getSelectValue"
            />
            <CompSelect
                placeholder="受助者戶籍地"
                select-title="受助者戶籍地"
                select-type="area"
                :select-list="areaSelectList"
                :select-default="codeSelect_area"
                @is-opened="isSelectOpen"
                @update:select-value="getSelectValue"
              />
            </div>
            <div class="part-end">
              <CompSelectElse 
                select-title="篩選"
                select-type="else"
                :select-list-income="incomeSelectList"
                :select-list-identity="identitySelectList"
                @is-opened="isSelectOpen"
                @update:select-items="getSelectItems"
                />
              <button class="btn-filter" @click="Search" :disabled="!isClientReady || !canSearch || isLoading">
                <span></span>
                <i class="icon ic-search"></i>
              </button>
            </div>
          </div>
        </div>
        <div class="card-filter-reset">
          <button class="btn btn-reset" :class="{ 'is-clearing': showResetFeedback }" @click="ResetParam">清空</button>
          <span class="reset-feedback" :class="{ 'is-visible': showResetFeedback }" aria-live="polite">已清空篩選條件</span>
        </div>
      </section>
      <section class="section-result">
        <div class="part-list">
          <ClientOnly>
            <IfareSummaryCard
              :query="appliedSearchQuery"
              :cases="storageiFarePolicyList"
              :provider="llmProvider"
              :search-context="appliedSummarySearchContext"
              :summary-trigger-key="summaryTriggerKey"
              :summary-cache-key="routeSearchSignature"
              :summary-reset-key="summaryResetKey"
            />
            <span class="result-total">{{ storageiFarePolicyList.length }}</span>
            <div class="result-loading" v-if="isLoading">載入中...</div>
            <div class="result-loading result-error" v-else-if="hasError">
              <p>{{ errorMessage }}</p>
              <button class="btn btn-filter" type="button" @click="RetryLoad">重新載入</button>
            </div>
            <div class="result-loading result-empty" v-else-if="iFarePolicyList.length === 0" role="status">
              <div class="empty-illustration" aria-hidden="true">
                <i class="icon ic-search"></i>
              </div>
              <p class="empty-title">沒有找到符合條件的福利</p>
              <p class="empty-hint">試試放寬篩選條件、調整關鍵字，或看看所有福利政策。</p>
              <div class="empty-actions">
                <button class="btn btn-filter" type="button" @click="ScrollToFilter">
                  <span>修改搜尋條件</span>
                </button>
                <button class="btn btn-reset" type="button" @click="ResetParam">
                  <span>看全部福利</span>
                </button>
              </div>
            </div>
            <ul class="list-unstyled result-list" v-else>
              <li
                class="result-item transition-general"
                v-for="_item in iFarePolicyList"
                :key="_item.id"
              >
                <NuxtLink :to="{ path: '/ifare/info', query: { id: _item.id } }">
                  <h4 class="result-title">{{ _item.title }}</h4>
                  <div class="result-item-bottom">
                    <div class="result-filter">
                      <label class="result-filter-area">{{ _item.area }}</label>
                      <label class="result-filter-qualify">
                        <span :class="{ remark: _item.hasRecipient }">{{ _item.hasRecipient ? '有' : '無' }}</span>年齡限制、
                        <span :class="{ remark: _item.hasIncome }">{{ _item.hasIncome ? '有' : '無' }}</span>經濟限制、
                        <span :class="{ remark: _item.hasIndentity }">{{ _item.hasIndentity ? '有' : '無' }}</span>特殊身分
                      </label>
                    </div>
                    <i class="ic-arrow-right link-url transition-general"></i>
                  </div>
                </NuxtLink>
              </li>
            </ul>
            <template #fallback>
              <div class="result-loading">載入中...</div>
            </template>
          </ClientOnly>
        </div>
        <ClientOnly>
          <div class="part-pages" v-show="!isLoading">
            <CompPage :page-list="pageNums" @change-page="PageChange"/>
          </div>
        </ClientOnly>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
const _isSelect = ref(false)
useHead({
    bodyAttrs: {
        class: {
          "overflow-disabled": _isSelect,
          "select-mode": _isSelect
        }
    }
})
definePageMeta({
  title: "ifare",
  toLinkName: "i-Fare",
  toLink: "/ifare",
});
const { $WebApiGet } = useNuxtApp();
const { getApiResultArray } = useApiResult();
const { getApiErrorMessage } = useApiErrorMessage();
import CompSelect from "../components/CompSelect.vue";
import CompSelectRecipient from "../components/CompSelectRecipient.vue";
import CompSelectElse from "~/components/CompSelectElse.vue";
import CompPage from "../components/CompPage.vue"
import IfareSummaryCard from "~/components/IfareSummaryCard.vue";
import IfareSearchAutocomplete from "~/components/IfareSearchAutocomplete.vue";

const isOpts = ref(false);
const llmProvider = "gemini" as const;
const SEARCH_CACHE_KEY_PREFIX = "ifare-search-cache:";
const SEARCH_CACHE_TTL_MS = 30 * 60 * 1000;
const SEARCH_CACHE_MAX_ITEMS = 120;

// interface selectItem {
//   name: string;
//   val: string;
// }

interface selectItem {
  name: string;
  val: string;
  isActive: boolean;
}

const ALL_POLICY_VALUE = "__all_policy";
const ALL_AREA_VALUE = "__all_area";

const policySelectList = reactive<Array<selectItem>>([]);
const codeSelect_policy:Ref<string> = ref("");
const areaSelectList = reactive<Array<selectItem>>([]);
const codeSelect_area:Ref<string> = ref("");
const searchQuery = ref("");
const recipientSelectList = reactive<Array<selectItem>>([]);
const codeSelectRecipient:Ref<string> = ref("");
const incomeSelectList = reactive<Array<selectItem>>([]);
const codeSelectIncome = ref("");
const identitySelectList = reactive<Array<selectItem>>([]);
const codeSelectIdentity: any = ref([]);
const isLoading = ref(false);
const hasError = ref(false);
const errorMessage = ref('載入福利政策時發生錯誤');
const showResetFeedback = ref(false);
const RESET_FEEDBACK_MS = 1800;
let resetFeedbackTimer: ReturnType<typeof setTimeout> | null = null;
let lastQuery: any = {};
const isClientReady = ref(false);
const $route = useRoute();
const $router = useRouter();
const appliedSearchParams = ref<Record<string, any>>({});
const routeSearchParams = computed(() => buildQueryFromRoute($route.query as Record<string, any>));
const routeSearchSignature = computed(() => {
  return Object.keys(routeSearchParams.value || {})
    .sort()
    .map((key) => `${key}=${normalizeCacheValue(routeSearchParams.value[key])}`)
    .join("&");
});
const effectiveAppliedSearchParams = computed(() => {
  return Object.keys(appliedSearchParams.value || {}).length > 0
    ? appliedSearchParams.value
    : routeSearchParams.value;
});

function getSelectLabel(list: Array<selectItem>, value: string, isAllValue?: (value: any) => boolean) {
  if (!value) return "";
  if (isAllValue?.(value)) return "";
  return list.find((item) => String(item.val) === String(value))?.name || "";
}

const summarySearchContext = computed(() => ({
  policy: getSelectLabel(policySelectList, codeSelect_policy.value, isAllPolicyValue),
  recipient: getSelectLabel(recipientSelectList, codeSelectRecipient.value),
  area: getSelectLabel(areaSelectList, codeSelect_area.value, isAllAreaValue),
  query: searchQuery.value.trim(),
}));

const appliedSearchQuery = computed(() => String(effectiveAppliedSearchParams.value.Query || ""));

const appliedSearchSignature = computed(() => {
  return Object.keys(effectiveAppliedSearchParams.value || {})
    .sort()
    .map((key) => `${key}=${normalizeCacheValue(effectiveAppliedSearchParams.value[key])}`)
    .join("&");
});

const appliedSummarySearchContext = computed(() => ({
  policy: getSelectLabel(policySelectList, String(effectiveAppliedSearchParams.value.CodePolicy || ""), isAllPolicyValue),
  recipient: getSelectLabel(recipientSelectList, String(effectiveAppliedSearchParams.value.CodeRecipient || "")),
  area: getSelectLabel(areaSelectList, String(effectiveAppliedSearchParams.value.CodeDomicile || ""), isAllAreaValue),
  income: getSelectLabel(incomeSelectList, String(effectiveAppliedSearchParams.value.CodeIncome || "")),
  identity: Array.isArray(effectiveAppliedSearchParams.value.CodeIdentities)
    ? effectiveAppliedSearchParams.value.CodeIdentities
        .map((item: any) => identitySelectList.find((option) => String(option.val) === String(item))?.name)
        .filter(Boolean)
        .join("、")
    : "",
  query: String(effectiveAppliedSearchParams.value.Query || ""),
}));

function isAllPolicyValue(value: any) {
  return value == ALL_POLICY_VALUE || value == "全部";
}

function isAllAreaValue(value: any) {
  return value == ALL_AREA_VALUE || value == "全國";
}

function buildFarePolicyApiQuery() {
  let query: any = {};
  if (codeSelect_policy.value && !isAllPolicyValue(codeSelect_policy.value)) query.CodePolicy = codeSelect_policy.value;
  if (codeSelectRecipient.value) query.CodeRecipient = codeSelectRecipient.value;
  if (codeSelect_area.value && !isAllAreaValue(codeSelect_area.value)) query.CodeDomicile = codeSelect_area.value;
  if (codeSelectIncome.value) query.CodeIncome = codeSelectIncome.value;
  if (searchQuery.value.trim()) query.Query = searchQuery.value.trim();
  if (codeSelectIdentity.value.length > 0) query.CodeIdentities = codeSelectIdentity.value;
  return query;
}
const canSearch = computed(() => {
  const formQuery = buildFarePolicyApiQuery();
  const routeQuery = buildQueryFromRoute($route.query as Record<string, any>);
  return Object.keys({ ...routeQuery, ...formQuery }).length > 0;
});
const autocompleteFilters = computed(() => ({
  CodePolicy: codeSelect_policy.value && !isAllPolicyValue(codeSelect_policy.value) ? codeSelect_policy.value : undefined,
  CodeRecipient: codeSelectRecipient.value || undefined,
  CodeDomicile: codeSelect_area.value && !isAllAreaValue(codeSelect_area.value) ? codeSelect_area.value : undefined,
  CodeIncome: codeSelectIncome.value || undefined,
  CodeIdentities: codeSelectIdentity.value.length > 0 ? [...codeSelectIdentity.value] : undefined,
}));
function getSelectValue(type: string, val: string) {
  if (type == "policy") {
    codeSelect_policy.value = val;
  }

  if (type == "area") {
    codeSelect_area.value = val;
  }

  if (type == "recipient") {
    codeSelectRecipient.value = val
  }
}

function getSelectItems(type: string, items: any) {
  let selectIncome = items.find((p:any) => p.type == 'Income')
  codeSelectIncome.value = selectIncome ? selectIncome.value : ""

  let selectIdentitys = items.filter((p:any) => p.type == 'Identity')
  if (selectIdentitys.length > 0) {
    codeSelectIdentity.value.splice(0)
    if (selectIdentitys.find((p:any) => p.value == 1)) return false
    codeSelectIdentity.value.push(...selectIdentitys.map((p:any) => { return p.value}))
  } else {
    codeSelectIdentity.value.splice(0)
  }
}

function parseIdentityQuery(value: any) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildQueryFromRoute(routeQuery: Record<string, any>) {
  const nextQuery: any = {};
  if (routeQuery.policy && !isAllPolicyValue(routeQuery.policy)) nextQuery.CodePolicy = routeQuery.policy;
  if (routeQuery.recipient) nextQuery.CodeRecipient = routeQuery.recipient;
  if (routeQuery.area && !isAllAreaValue(routeQuery.area)) nextQuery.CodeDomicile = routeQuery.area;
  if (routeQuery.income) nextQuery.CodeIncome = routeQuery.income;
  if (routeQuery.query) nextQuery.Query = routeQuery.query;
  if (routeQuery.identity) nextQuery.CodeIdentities = parseIdentityQuery(routeQuery.identity);
  return nextQuery;
}

function syncFilterStateFromRoute(routeQuery: Record<string, any>) {
  codeSelect_policy.value = typeof routeQuery.policy == "string" ? routeQuery.policy : "";
  codeSelect_area.value = typeof routeQuery.area == "string" ? routeQuery.area : "";
  codeSelectRecipient.value = typeof routeQuery.recipient == "string" ? routeQuery.recipient : "";
  codeSelectIncome.value = typeof routeQuery.income == "string" ? routeQuery.income : "";
  searchQuery.value = typeof routeQuery.query == "string" ? routeQuery.query : "";

  const routeIdentities = parseIdentityQuery(routeQuery.identity);
  codeSelectIdentity.value.splice(0);
  codeSelectIdentity.value.push(...routeIdentities);

  recipientSelectList.forEach((item) => {
    item.isActive = String(item.val) === String(codeSelectRecipient.value);
  });

  incomeSelectList.forEach((item) => {
    item.isActive = String(item.val) === String(codeSelectIncome.value);
  });

  identitySelectList.forEach((item) => {
    item.isActive = routeIdentities.includes(String(item.val));
  });
}

function hydrateFromRoute(routeQuery: Record<string, any>) {
  syncFilterStateFromRoute(routeQuery);
  const nextQuery = buildQueryFromRoute(routeQuery);
  SetDataInit(nextQuery);
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
})
.then(() => {
  SwitchRecipient($route.query.recipient)
});

function SwitchRecipient(codeVal: any) {
  if (codeVal == "reset") {
    codeSelectRecipient.value = ""
    recipientSelectList.forEach((item) => {
      item.isActive = false
    })
    return
  }

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

// Code income
const codeIncome = $WebApiGet("/Code/GetCodeIncomeList");
codeIncome.then((res: any) => {
  const _data = getApiResultArray<any>(res);
  if (_data.length === 0) return;
  let _list: Array<selectItem> = _data.slice(1).map((item: any, i: number) => {
    return {
      name: item.codeName,
      val: item.id,
      isActive: false,
    };
  });
  incomeSelectList.push(..._list);
  if (typeof $route.query.income === "string") {
    SwitchIncome($route.query.income);
  }
});

function SwitchIncome(codeVal: any) {
  incomeSelectList.forEach((item, i) => {
    // item.isActive = item.val == codeVal;
    if (item.val == codeVal) {
      if (item.isActive) {
        codeSelectIncome.value = "";
        item.isActive = false;
      } else {
        codeSelectIncome.value = item.val;
        item.isActive = true;
      }
    } else {
      item.isActive = false;
    }
  });

  if (codeVal == "reset") {
    codeSelectIncome.value = ""
  }
}

// Code identity
const codeIdentity = $WebApiGet("/Code/GetCodeIdentityList");
codeIdentity.then((res: any) => {
  const _data = getApiResultArray<any>(res);
  if (_data.length === 0) return;
  let _list: Array<selectItem> = _data.slice(1).map((item: any, i: number) => {
    return {
      name: item.codeName == '?券' ? '銝?' : item.codeName,
      val: item.id,
      isActive: false,
    };
  });
  identitySelectList.push(..._list);
  const routeIdentities = parseIdentityQuery($route.query.identity);
  if (routeIdentities.length > 0) {
    codeSelectIdentity.value.splice(0);
    codeSelectIdentity.value.push(...routeIdentities);
    identitySelectList.forEach((item: any) => {
      item.isActive = routeIdentities.includes(String(item.val));
    });
  }
});

function SwitchIdentity(codeVal: any) {
  identitySelectList.forEach((item:any, i) => {
    if (item.val == codeVal) {
      if (item.isActive) {
        let codeIndex = codeSelectIdentity.value.findIndex(
          (p: any) => p == codeVal
        );
        codeSelectIdentity.value.splice(codeIndex, 1);
      } else {
        codeSelectIdentity.value.push(item.val);
      }

      item.isActive = !item.isActive;
    }
    if (codeVal == "reset" || codeVal == 1) {
      item.isActive = false;
    }
    if (codeVal == 1 && item.val == 1) {
      item.isActive = true
    }
    if (codeVal != 1 && item.val == 1 && item.isActive) {
      item.isActive = false
    }
  });

  if (codeVal == "reset") {
    codeSelectIdentity.value.splice(0)
  }
}

function Search() {
  if (!canSearch.value) return false;
  summaryResetKey.value += 1;
  const nextQuery = buildFarePolicyApiQuery();
  lastQuery = { ...nextQuery };
  const currentQuery = buildQueryFromRoute($route.query as Record<string, any>);
  const nextSignature = JSON.stringify(nextQuery);
  const currentSignature = JSON.stringify(currentQuery);

  if (nextSignature === currentSignature) {
    SetDataInit(nextQuery);
    return true;
  }

  syncRouteQueryFromSearch(nextQuery);
  return true;
}

// iFare Policy
const PAGEITEMMAX = 10;

interface iFarePolicyItem {
  id: number;
  title: string;
  qualification: string;
  area: string;
  hasIndentity: boolean;
  hasIncome: boolean;
  hasRecipient: boolean;
}

interface pageNum {
  num: number;
  isActive: boolean;
  isHide: boolean;
}

const iFarePolicyList = reactive<Array<iFarePolicyItem>>([]);
const storageiFarePolicyList = reactive<Array<iFarePolicyItem>>([]);
const pageNums = reactive<Array<pageNum>>([]);
const summaryTriggerKey = ref(0);
const summaryResetKey = ref(0);

function normalizeCacheValue(value: any): string {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).sort().join(",");
  }

  if (value === undefined || value === null || value === "") {
    return "";
  }

  return String(value);
}

function buildSearchCacheKey(query: Record<string, any>) {
  const normalizedQuery = Object.keys(query)
    .sort()
    .map((key) => `${key}=${normalizeCacheValue(query[key])}`)
    .join("&");

  return `${SEARCH_CACHE_KEY_PREFIX}${normalizedQuery || "default"}`;
}

function readSearchCache(query: Record<string, any>) {
  if (!process.client) return null;

  const raw = sessionStorage.getItem(buildSearchCacheKey(query));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as {
      savedAt?: number;
      items?: iFarePolicyItem[];
    };

    if (!parsed?.savedAt || Date.now() - parsed.savedAt > SEARCH_CACHE_TTL_MS) {
      sessionStorage.removeItem(buildSearchCacheKey(query));
      return null;
    }

    return Array.isArray(parsed.items) ? parsed.items : null;
  } catch {
    sessionStorage.removeItem(buildSearchCacheKey(query));
    return null;
  }
}

function writeSearchCache(query: Record<string, any>, items: iFarePolicyItem[]) {
  if (!process.client) return;

  const cacheKey = buildSearchCacheKey(query);
  const payload = JSON.stringify({
    savedAt: Date.now(),
    items: items.slice(0, SEARCH_CACHE_MAX_ITEMS),
  });

  try {
    sessionStorage.setItem(cacheKey, payload);
  } catch (error) {
    if (!isStorageQuotaExceeded(error)) {
      return;
    }

    clearIfareSearchCache();

    try {
      sessionStorage.setItem(cacheKey, payload);
    } catch {
    }
  }
}

function clearIfareSearchCache() {
  if (!process.client) return;

  const keysToRemove: string[] = [];
  for (let index = 0; index < sessionStorage.length; index += 1) {
    const key = sessionStorage.key(index);
    if (key?.startsWith(SEARCH_CACHE_KEY_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => sessionStorage.removeItem(key));
}

function isStorageQuotaExceeded(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.name === "QuotaExceededError" ||
    error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    error.message.includes("exceeded the quota");
}

function applyPolicyList(items: iFarePolicyItem[]) {
  storageiFarePolicyList.splice(0);
  iFarePolicyList.splice(0);
  pageNums.splice(0);

  storageiFarePolicyList.push(...items);
  iFarePolicyList.push(...items.slice(0, Math.min(PAGEITEMMAX, items.length)));
  summaryTriggerKey.value += 1;

  if (storageiFarePolicyList.length <= 0) return;

  for (let n = 0; n < storageiFarePolicyList.length / PAGEITEMMAX; n++) {
    pageNums.push({
      num: n + 1,
      isActive: n == 0,
      isHide: false
    });
  }

}

function SetDataInit(_q: any) {
  lastQuery = { ..._q };
  hasError.value = false;
  errorMessage.value = '載入福利政策時發生錯誤';
  appliedSearchParams.value = { ..._q };

  const cachedItems = readSearchCache(_q);
  if (cachedItems) {
    applyPolicyList(cachedItems);
    hasError.value = false;
    isLoading.value = false;
    return;
  }

  isLoading.value = true;
  const listNews = $WebApiGet("/FarePolicy/GetIFarePolicyList", _q);
  listNews.then((res: any) => {
    const _data = getApiResultArray<any>(res);
    if (_data.length === 0) {
      applyPolicyList([]);
      writeSearchCache(_q, []);
      return;
    }
    let _newsList: Array<iFarePolicyItem> = _data.map(
      (item: any, i: number) => {
        return {
          id: item.id,
          title: item.title,
          qualification: item.qualification,
          area: item.codeDomicile_LabelName,
          hasIndentity: item.codeIdentityList.findIndex((p:any) => p.id == 1) < 0,
          hasIncome: item.codeIncomeList.findIndex((p:any) => p.id == 1) < 0,
          hasRecipient: item.codeRecipientList.findIndex((p:any) => p.id == 1) < 0
        };
      }
    );

    applyPolicyList(_newsList);
    writeSearchCache(_q, _newsList);
  }).catch((error: any) => {
    hasError.value = true;
    errorMessage.value = getApiErrorMessage(error, '載入福利政策時發生錯誤');
  }).finally(() => {
    isLoading.value = false;
  });
}

function syncRouteQueryFromSearch(query: Record<string, any>) {
  const nextRouteQuery: Record<string, string> = {};

  if (query.CodePolicy) nextRouteQuery.policy = String(query.CodePolicy);
  if (query.CodeRecipient) nextRouteQuery.recipient = String(query.CodeRecipient);
  if (query.CodeDomicile) nextRouteQuery.area = String(query.CodeDomicile);
  if (query.CodeIncome) nextRouteQuery.income = String(query.CodeIncome);
  if (query.Query) nextRouteQuery.query = String(query.Query);
  if (Array.isArray(query.CodeIdentities) && query.CodeIdentities.length > 0) {
    nextRouteQuery.identity = query.CodeIdentities.map((item: any) => String(item)).join(",");
  }

  $router.push({
    path: "/ifare/result",
    query: nextRouteQuery,
  });
}

function PageChange(pageNum: number) {
  iFarePolicyList.splice(0);

  const index_S = (pageNum - 1) * PAGEITEMMAX;
  const index_E =
    pageNum <= storageiFarePolicyList.length / PAGEITEMMAX
      ? pageNum * PAGEITEMMAX
      : storageiFarePolicyList.length;

  let nextItems = storageiFarePolicyList.slice(index_S, index_E);
  iFarePolicyList.push(...nextItems);
}

function isSelectOpen(type: string, val: boolean) {
  _isSelect.value = val
  // useHead({
  //       bodyAttrs: {
  //           class: {
  //             "overflow-disabled": val,
  //             "select-mode": val
  //           }
  //       }
  //   })
}

function ResetParam() {
  codeSelect_area.value = ""
  const _tempArea = JSON.parse(JSON.stringify(areaSelectList))
  areaSelectList.splice(0)
  areaSelectList.push(..._tempArea)

  codeSelect_policy.value = ""
  const _tempPolicy = JSON.parse(JSON.stringify(policySelectList))
  policySelectList.splice(0)
  policySelectList.push(..._tempPolicy)

  searchQuery.value = ""

  SwitchRecipient("reset")
  SwitchIncome("reset")
  SwitchIdentity("reset")
  summaryResetKey.value += 1;
  lastQuery = {};
  syncRouteQueryFromSearch({});
  triggerResetFeedback()
}

function RetryLoad() {
  summaryResetKey.value += 1;
  SetDataInit(lastQuery);
}

function ScrollToFilter() {
  if (typeof window === 'undefined') return
  const el = document.querySelector('.section-filter')
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function clearResetFeedbackTimer() {
  if (!resetFeedbackTimer) {
    return;
  }

  clearTimeout(resetFeedbackTimer);
  resetFeedbackTimer = null;
}

function triggerResetFeedback() {
  clearResetFeedbackTimer();
  showResetFeedback.value = false;
  nextTick(() => {
    showResetFeedback.value = true;
    resetFeedbackTimer = setTimeout(() => {
      showResetFeedback.value = false;
    }, RESET_FEEDBACK_MS);
  });
}

watch(
  () => $route.fullPath,
  () => {
    hydrateFromRoute($route.query as Record<string, any>);
  },
  { immediate: true }
);

onMounted(() => {
  isClientReady.value = true;
});

onBeforeUnmount(() => {
  clearResetFeedbackTimer()
})
</script>

<style scoped>
.query-action-row {
  display: grid !important;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: stretch;
  gap: 12px;
  width: 100%;
  flex-direction: unset !important;
}

.query-field {
  flex: 1 1 auto;
  min-width: 0;
  width: 100% !important;
}

.btn-query-submit {
  flex: 0 0 auto;
  white-space: nowrap;
  width: auto !important;
  min-width: 110px;
}

:deep(.input-query) {
  min-width: 0 !important;
}
</style>
