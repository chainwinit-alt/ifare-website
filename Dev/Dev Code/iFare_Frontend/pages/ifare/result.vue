<template>
  <div class="app-body-child" :name="$route.name">
    <div class="section-list">
      <section ref="filterSectionRef" class="section-filter">
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
            <!-- 2026-05-25 UIUX #57 — 原 CompSelectRecipient 改用 CompSelect variant="tags" + allow-deselect -->
            <CompSelect
                variant="tags"
                :allow-deselect="true"
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
              <div class="query-field query-field-mobile">
                <div class="query-field-mobile-inner">
                  <IfareSearchAutocomplete
                    v-model="searchQuery"
                    :filters="autocompleteFilters"
                    placeholder="關鍵字搜尋"
                    :show-count="false"
                    @submit="Search"
                  />
                </div>
              </div>
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
        <div ref="resultContentRef" class="part-list">
          <ClientOnly>
            <div ref="summaryScrollAnchorRef" class="summary-scroll-anchor" aria-hidden="true"></div>
            <div ref="summarySectionRef">
              <IfareSummaryCard
                :query="appliedSearchQuery"
                :cases="storageiFarePolicyList"
                :provider="llmProvider"
                :results-loading="isLoading"
                :search-context="appliedSummarySearchContext"
                :summary-trigger-key="summaryTriggerKey"
                :summary-cache-key="routeSearchSignature"
                :summary-reset-key="summaryResetKey"
                @summary-complete="handleSummaryComplete"
              />
            </div>
            <span class="result-total">{{ storageiFarePolicyList.length }}</span>
            <div class="compare-toolbar" v-if="compareCount > 0">
              <span>已收藏 {{ compareCount }} 個福利</span>
              <NuxtLink class="btn btn-filter compare-toolbar__link" to="/ifare/compare">
                <span>查看比較</span>
              </NuxtLink>
            </div>
            <div class="result-loading" v-if="isLoading">載入中...</div>
            <div class="result-loading result-error" v-else-if="hasError">
              <p>{{ errorMessage }}</p>
              <button class="btn btn-filter" type="button" @click="RetryLoad">重新載入</button>
            </div>
            <div class="result-loading result-empty" v-else-if="!isLoading && iFarePolicyList.length === 0" role="status">
              <div class="empty-illustration" aria-hidden="true">
                <i class="icon ic-search"></i>
              </div>
              <p class="empty-title">沒有找到符合條件的福利</p>
              <p class="empty-hint">{{ emptyHint }}</p>
              <ul v-if="emptyDiagnosis.length > 0" class="empty-diagnosis-list">
                <li v-for="item in emptyDiagnosis" :key="item">{{ item }}</li>
              </ul>
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
                <button
                  class="compare-toggle"
                  :class="{ 'is-saved': isPolicySaved(_item.id) }"
                  type="button"
                  :aria-pressed="isPolicySaved(_item.id)"
                  @click.stop="ToggleCompare(_item)"
                >
                  {{ isPolicySaved(_item.id) ? '已收藏' : '收藏比較' }}
                </button>
                <NuxtLink :to="{ path: '/ifare/info', query: { id: _item.id } }">
                  <h4 class="result-title">{{ _item.title }}</h4>
                  <span
                    v-if="_item.deadlineInfo"
                    class="deadline-badge"
                    :class="`deadline-badge--${_item.deadlineInfo.level}`"
                  >{{ _item.deadlineInfo.label }}</span>
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
const bodyClass = computed(() => ({
  "overflow-disabled": _isSelect.value,
  "select-mode": _isSelect.value,
}));
useHead({
    bodyAttrs: {
        class: bodyClass
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
const { getDeadlineInfo } = usePolicyDeadline();
const { loadWelfareProfile, saveWelfareProfile, clearWelfareProfile } = useWelfareProfile();
const { getLifeEventByKey } = useWelfareLifeEvents();
const { count: compareCount, isSaved: isPolicySaved, togglePolicy } = useWelfareCompare();
import CompSelect from "../components/CompSelect.vue";
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
let summaryScrollLockTimer: ReturnType<typeof setInterval> | null = null;
let summaryResizeObserver: ResizeObserver | null = null;
let lastQuery: any = {};
const isClientReady = ref(false);
const $route = useRoute();
const $router = useRouter();
const selectedLifeEvent = ref("");
const appliedSearchParams = ref<Record<string, any>>({});
const filterSectionRef = ref<HTMLElement | null>(null);
const resultContentRef = ref<HTMLElement | null>(null);
const summaryScrollAnchorRef = ref<HTMLElement | null>(null);
const summarySectionRef = ref<HTMLElement | null>(null);
const pendingScrollToSummary = ref(false);
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
const canSearch = computed(() => {
  const formQuery = buildFarePolicyApiQuery();
  const routeQuery = buildQueryFromRoute($route.query as Record<string, any>);
  return Object.keys({ ...routeQuery, ...formQuery }).length > 0;
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

function markPendingSummaryScroll() {
  pendingScrollToSummary.value = true;
  if (process.client) {
    sessionStorage.setItem("ifare:scroll-to-summary", "1");
  }
}

function clearPendingSummaryScroll() {
  pendingScrollToSummary.value = false;
  if (process.client) {
    sessionStorage.removeItem("ifare:scroll-to-summary");
  }
}

function syncPendingSummaryScrollFromSession() {
  if (!process.client) return;
  pendingScrollToSummary.value = sessionStorage.getItem("ifare:scroll-to-summary") === "1";
}

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
  if (selectedLifeEvent.value) query.LifeEvent = selectedLifeEvent.value;
  return query;
}
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
  if (routeQuery.event) nextQuery.LifeEvent = routeQuery.event;
  return nextQuery;
}

function syncFilterStateFromRoute(routeQuery: Record<string, any>) {
  codeSelect_policy.value = typeof routeQuery.policy == "string" ? routeQuery.policy : "";
  codeSelect_area.value = typeof routeQuery.area == "string" ? routeQuery.area : "";
  codeSelectRecipient.value = typeof routeQuery.recipient == "string" ? routeQuery.recipient : "";
  codeSelectIncome.value = typeof routeQuery.income == "string" ? routeQuery.income : "";
  searchQuery.value = typeof routeQuery.query == "string" ? routeQuery.query : "";
  selectedLifeEvent.value = typeof routeQuery.event == "string" ? routeQuery.event : "";

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
  markPendingSummaryScroll();
  const nextQuery = buildFarePolicyApiQuery();
  lastQuery = { ...nextQuery };
  saveWelfareProfile({
    policy: codeSelect_policy.value,
    recipient: codeSelectRecipient.value,
    area: codeSelect_area.value,
    income: codeSelectIncome.value,
    identities: codeSelectIdentity.value.map((item: any) => String(item)),
    query: searchQuery.value.trim(),
    lifeEvent: selectedLifeEvent.value,
  });
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
  discontinuedTime: string;
  deadlineInfo: any;
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
const activeLifeEvent = computed(() => getLifeEventByKey(selectedLifeEvent.value));
const emptyHint = computed(() => {
  if (activeLifeEvent.value) {
    return `目前找不到與「${activeLifeEvent.value.name}」完全符合的福利，建議先放寬條件或調整關鍵字。`;
  }

  return '試試放寬篩選條件、調整關鍵字，或看看所有福利政策。';
});
const emptyDiagnosis = computed(() => {
  const hints: string[] = [];
  if (lastQuery.CodeDomicile) hints.push('戶籍地可能太精準，可先改成全國或清除地區。');
  if (lastQuery.CodeRecipient) hints.push('年齡區間可能不符合，可先清除年齡限制。');
  if (lastQuery.CodeIncome) hints.push('經濟條件可能限制結果，可先清除收入條件。');
  if (lastQuery.CodeIdentities?.length > 0) hints.push('特殊身分可能沒有對應方案，可先清除身分條件。');
  if (lastQuery.Query) hints.push('關鍵字可能太細，可改用較短詞，例如「補助」「照顧」「就學」。');
  return hints.slice(0, 4);
});

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
          hasRecipient: item.codeRecipientList.findIndex((p:any) => p.id == 1) < 0,
          discontinuedTime: item.discontinuedTime,
          deadlineInfo: getDeadlineInfo(item.discontinuedTime),
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
  if (query.LifeEvent) nextRouteQuery.event = String(query.LifeEvent);

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
  clearPendingSummaryScroll();
  lastQuery = {};
  selectedLifeEvent.value = ""
  clearWelfareProfile()
  syncRouteQueryFromSearch({});
  triggerResetFeedback()
}

function ToggleCompare(item: iFarePolicyItem) {
  togglePolicy({
    id: item.id,
    title: item.title,
    area: item.area,
    qualification: item.qualification,
    discontinuedTime: item.discontinuedTime,
    hasIndentity: item.hasIndentity,
    hasIncome: item.hasIncome,
    hasRecipient: item.hasRecipient,
  });
}

function RetryLoad() {
  summaryResetKey.value += 1;
  markPendingSummaryScroll();
  SetDataInit(lastQuery);
}

function ScrollToFilter() {
  if (typeof window === 'undefined') return
  const el = document.querySelector('.section-filter')
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function handleSummaryComplete() {
  if (typeof window === "undefined" || !pendingScrollToSummary.value) return;

  nextTick(() => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        scrollToSummaryAnchor("smooth");
        clearSummaryScrollLock();
        let ticks = 0;
        summaryScrollLockTimer = setInterval(() => {
          scrollToSummaryAnchor("auto");
          ticks += 1;

          if (ticks >= 10) {
            clearSummaryScrollLock();
            clearPendingSummaryScroll();
          }
        }, 120);
      });
    });
  });
}

function clearResetFeedbackTimer() {
  if (!resetFeedbackTimer) {
    return;
  }

  clearTimeout(resetFeedbackTimer);
  resetFeedbackTimer = null;
}

function clearSummaryScrollLock() {
  if (!summaryScrollLockTimer) {
    return;
  }

  clearInterval(summaryScrollLockTimer);
  summaryScrollLockTimer = null;
}

function scrollToSummaryAnchor(behavior: ScrollBehavior = "auto") {
  if (typeof window === "undefined") return;

  const anchor = summaryScrollAnchorRef.value || summarySectionRef.value;
  if (!anchor) return;

  anchor.scrollIntoView({
    behavior,
    block: "start",
  });
}

function setupSummaryResizeObserver() {
  if (typeof window === "undefined" || summaryResizeObserver || typeof ResizeObserver === "undefined") {
    return;
  }

  const observedElement = resultContentRef.value || summarySectionRef.value;
  if (!observedElement) return;

  summaryResizeObserver = new ResizeObserver(() => {
    if (!pendingScrollToSummary.value) return;
    scrollToSummaryAnchor("auto");
  });

  summaryResizeObserver.observe(observedElement);
}

function clearSummaryResizeObserver() {
  if (!summaryResizeObserver) {
    return;
  }

  summaryResizeObserver.disconnect();
  summaryResizeObserver = null;
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
    syncPendingSummaryScrollFromSession();
    hydrateFromRoute($route.query as Record<string, any>);
  },
  { immediate: true }
);

onMounted(() => {
  isClientReady.value = true;
  syncPendingSummaryScrollFromSession();
  nextTick(() => {
    setupSummaryResizeObserver();
  });
});

onBeforeUnmount(() => {
  clearResetFeedbackTimer()
  clearSummaryScrollLock()
  clearSummaryResizeObserver()
})

onMounted(() => {
  if (Object.keys($route.query).length > 0) return;

  const profile = loadWelfareProfile();
  if (!profile) return;

  codeSelect_policy.value = profile.policy || "";
  codeSelect_area.value = profile.area || "";
  codeSelectRecipient.value = profile.recipient || "";
  codeSelectIncome.value = profile.income || "";
  codeSelectIdentity.value.splice(0, codeSelectIdentity.value.length, ...(profile.identities ?? []));
  searchQuery.value = profile.query || "";
  selectedLifeEvent.value = profile.lifeEvent || "";

  const query: any = {};
  if (profile.policy && profile.policy != ALL_POLICY_VALUE) query.CodePolicy = profile.policy;
  if (profile.recipient) query.CodeRecipient = profile.recipient;
  if (profile.area && profile.area != ALL_AREA_VALUE) query.CodeDomicile = profile.area;
  if (profile.income) query.CodeIncome = profile.income;
  if (profile.query) query.Query = profile.query;
  if (profile.identities?.length) query.CodeIdentities = profile.identities;
  if (profile.lifeEvent) query.LifeEvent = profile.lifeEvent;
  if (Object.keys(query).length > 0) SetDataInit(query);
})
</script>

<style scoped>
.summary-scroll-anchor {
  display: block;
  width: 100%;
  height: 1px;
  scroll-margin-top: 88px;
}

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

.query-field-mobile {
  width: 100%;
}

.btn-query-submit {
  flex: 0 0 auto;
  white-space: nowrap;
  width: auto !important;
  min-width: 110px;
}

:deep(.ifare-search-autocomplete) {
  width: 100%;
}

:deep(.query-input-wrap) {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 44px;
  padding: 2px 10px 2px 20px;
  box-sizing: border-box;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 5px;
  background: #fff;
  box-shadow: none !important;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
  font-family: Noto Sans TC, sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 34px;
}

:deep(.query-input-wrap:focus-within),
:deep(.ifare-search-autocomplete.is-open .query-input-wrap) {
  border-color: rgba(20, 70, 72, 0.4);
  box-shadow: none !important;
}

:deep(.input-query) {
  display: block;
  align-self: center;
  width: 100%;
  min-width: 0 !important;
  height: 34px;
  margin: 0;
  padding: 0 44px 0 0;
  border: 0 !important;
  border-radius: 0;
  outline: none !important;
  background: transparent !important;
  box-shadow: none !important;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  font: inherit;
  color: #000;
  letter-spacing: 0;
  line-height: inherit;
  transform: translateY(-1px);
}

:deep(.input-query::placeholder) {
  color: rgba(0, 0, 0, 0.3);
}

:deep(.query-count) {
  right: 12px;
  color: rgba(0, 0, 0, 0.42);
}

:deep(.input-query:focus),
:deep(.input-query:focus-visible) {
  border: 0 !important;
  outline: none !important;
  box-shadow: none !important;
}

@media (max-width: 768px) {
  .summary-scroll-anchor {
    scroll-margin-top: 72px;
  }

  .query-field-mobile {
    width: 100%;
  }

  .query-field-mobile .query-field-mobile-inner {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
  }

  .query-field-mobile :deep(.ifare-search-autocomplete),
  .query-field-mobile :deep(.query-input-wrap) {
    width: 100%;
  }

  .query-field-mobile :deep(.query-input-wrap) {
    min-height: 44px;
    padding: 2px 10px 2px 20px;
    border: 1px solid rgba(0, 0, 0, 0.2) !important;
    border-radius: 5px;
    box-shadow: none !important;
    background: #fff !important;
  }

  .query-field-mobile :deep(.input-query) {
    display: block;
    align-self: center;
    width: 100%;
    min-width: 0;
    height: 34px;
    margin: 0;
    padding: 0 44px 0 0;
    border: 0 !important;
    border-radius: 0;
    background: transparent !important;
    box-shadow: none !important;
    outline: none !important;
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    font: inherit;
    color: #000;
    letter-spacing: 0;
    line-height: inherit;
    transform: translateY(-1px);
  }

  .query-field-mobile :deep(.input-query::placeholder) {
    color: rgba(0, 0, 0, 0.3);
  }

  .query-field-mobile :deep(.input-query:focus) {
    outline: none !important;
    border: 0 !important;
    box-shadow: none !important;
    background: transparent !important;
  }

  .query-field-mobile :deep(.search-suggestion-panel) {
    top: calc(100% + 8px);
    border-radius: 14px;
    padding: 10px;
    box-shadow: 0 16px 32px rgba(21, 74, 76, 0.12);
  }

  .query-field-mobile :deep(.query-count) {
    right: 12px;
  }
}

.compare-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 16px;
  padding: 12px 14px;
  border: 1px solid rgba(44, 80, 97, 0.14);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.88);
  color: #1f3640;
  font-weight: 700;
}

.compare-toolbar__link {
  min-width: auto;
  padding: 0 16px;
}

.result-item {
  position: relative;
}

.compare-toggle {
  position: absolute;
  z-index: 2;
  top: 14px;
  right: 14px;
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid rgba(234, 85, 4, 0.28);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.94);
  color: #c84804;
  cursor: pointer;
  font-size: 0.84rem;
  font-weight: 700;
}

.compare-toggle.is-saved {
  border-color: rgba(35, 84, 71, 0.28);
  background: #eef6f4;
  color: #235447;
}

.compare-toggle:hover {
  transform: translateY(-1px);
}

.result-title {
  padding-right: 96px;
}

.deadline-badge {
  display: inline-flex;
  width: fit-content;
  margin: 8px 0 0;
  padding: 4px 8px;
  border-radius: 6px;
  background: #eef6f4;
  color: #235447;
  font-size: 0.82rem;
  font-weight: 700;
}

.deadline-badge--soon {
  background: #fff5df;
  color: #8a5700;
}

.deadline-badge--urgent {
  background: #ffe8e2;
  color: #9f2f13;
}

.empty-diagnosis-list {
  display: grid;
  gap: 8px;
  max-width: 560px;
  margin: 12px auto 0;
  padding: 0;
  color: #4d5b63;
  list-style: none;
  text-align: left;
}

.empty-diagnosis-list li {
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.82);
}

@media (max-width: 560px) {
  .compare-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .compare-toolbar__link {
    width: 100%;
  }

  .compare-toggle {
    position: static;
    margin: 0 0 10px 14px;
  }

  .result-title {
    padding-right: 0;
  }
}
</style>
