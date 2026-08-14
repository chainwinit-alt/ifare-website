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
                :select-default="codeSelectArea"
                @update:select-value="getSelectValue"
              />
            </div>
            <div class="filter-group filter-group-query">
              <label class="filter-title">關鍵字</label>
              <div class="query-action-row">
                <IfareSearchAutocomplete
                  v-model="searchQuery"
                  :filters="autocompleteFilters"
                  placeholder="請輸入關鍵字"
                  @submit="Search"
                />
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
                  <button class="btn btn-filter" @click="Search" :disabled="!canSearch || isLoading">
                    <span v-if="isLoading" class="btn-loading-spinner" aria-hidden="true"></span>
                    <span>{{ isLoading ? '搜尋中' : '搜尋' }}</span>
                    <i v-if="!isLoading" class="icon ic-search"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="part-bottom" v-show="isOpts">
            <div class="filter-group">
              <label class="filter-title" name="multiple">經濟條件</label>
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
          <div class="part-reset">
            <button class="btn btn-reset" @click="ResetParam">清空</button>
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
                :select-default="codeSelectArea"
                @is-opened="isSelectOpen"
                @update:select-value="getSelectValue"
              />
            </div>
            <div class="part-mobile-query">
              <label class="sr-only" for="ifare-result-mobile-query">關鍵字</label>
              <IfareSearchAutocomplete
                v-model="searchQuery"
                :filters="autocompleteFilters"
                placeholder="請輸入關鍵字"
                :show-count="false"
                @submit="Search"
              />
            </div>
            <div class="part-end">
              <CompSelectElse 
                select-title="篩選"
                select-type="else"
                :select-list-income="incomeSelectList"
                :select-list-identity="identitySelectList"
                :selected-incomes="codeSelectIncomes"
                :selected-identities="codeSelectIdentity"
                @is-opened="isSelectOpen"
                @update:select-items="getSelectItems"
                />
              <button class="btn-filter" @click="Search" :disabled="!canSearch || isLoading">
                <span v-if="isLoading" class="btn-loading-spinner" aria-hidden="true"></span>
                <span v-if="isLoading">搜尋中</span>
                <i v-if="!isLoading" class="icon ic-search"></i>
              </button>
            </div>
          </div>
        </div>
        <div class="card-filter-reset">
          <button class="btn btn-reset" @click="ResetParam">清空</button>
        </div>
      </section>
      <section v-if="hasSummaryKeyword" ref="summarySectionRef" class="section-summary">
        <IfareSummaryCard
          :query="summaryQuery"
          :cases="storageiFarePolicyList"
          :results-loading="isLoading"
          :search-context="summarySearchContext"
          :summary-trigger-key="summaryTriggerKey"
          :summary-reset-key="summaryResetKey"
          :summary-cache-key="summaryCacheKey"
          :conversation-search="searchSummaryConversationPolicies"
          @summary-complete="handleSummaryComplete"
        />
      </section>
      <section ref="resultSectionRef" class="section-result">
        <div class="part-list">
          <span v-if="!isLoading" class="result-total">{{ storageiFarePolicyList.length }}</span>
          <div class="result-loading" v-if="isLoading">政策資料搜尋中...</div>
          <ul class="list-unstyled result-list" v-else>
            <li
              class="result-item transition-general"
              v-for="_item in iFarePolicyList"
              :key="_item.id"
            >
              <NuxtLink :to="{ path: '/ifare/info', query: { id: _item.id, reload: _item.id } }">
                <h4 class="result-title">{{ _item.title }}</h4>
                <div class="result-item-bottom">
                  <div class="result-filter">
                    <label class="result-filter-area" :title="_item.areaTitle">
                      <span class="result-filter-area-text">{{ _item.area }}</span>
                    </label>
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
        </div>
        <div class="part-pages" v-show="!isLoading">
          <CompPage :page-list="pageNums" @change-page="PageChange"/>
        </div>
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
const runtimeConfig = useRuntimeConfig();
import CompSelect from "~/components/CompSelect.vue";
import CompSelectRecipient from "~/components/CompSelectRecipient.vue";
import CompSelectElse from "~/components/CompSelectElse.vue";
import CompPage from "~/components/CompPage.vue"
import IfareSummaryCard from "~/components/IfareSummaryCard.vue";
import IfareSearchAutocomplete from "~/components/IfareSearchAutocomplete.vue";

const isOpts = ref(false);

// interface selectItem {
//   name: string;
//   val: string;
// }

interface selectItem {
  name: string;
  val: string;
  isActive: boolean;
}

const ALL_POLICY_VALUE = "全部";
const ALL_AREA_VALUE = "全國";
const LEGACY_ALL_POLICY_VALUE = "__all_policy";
const LEGACY_ALL_AREA_VALUE = "__all_area";

const policySelectList = reactive<Array<selectItem>>([
  { name: ALL_POLICY_VALUE, val: ALL_POLICY_VALUE, isActive: false },
]);
const codeSelect_policy:Ref<string> = ref(ALL_POLICY_VALUE);
const areaSelectList = reactive<Array<selectItem>>([
  { name: ALL_AREA_VALUE, val: ALL_AREA_VALUE, isActive: false },
]);
const codeSelectArea = ref(ALL_AREA_VALUE);
const searchQuery = ref("");
const recipientSelectList = reactive<Array<selectItem>>([]);
const codeSelectRecipient:Ref<string> = ref("");
const incomeSelectList = reactive<Array<selectItem>>([]);
const codeSelectIncomes = ref<string[]>([]);
const identitySelectList = reactive<Array<selectItem>>([]);
const codeSelectIdentity = ref<string[]>([]);
const isLoading = ref(false);
const summarySectionRef = ref<HTMLElement | null>(null);
const resultSectionRef = ref<HTMLElement | null>(null);
const summaryTriggerKey = ref(0);
const summaryResetKey = ref(0);
const latestSummaryText = ref("");
const resolvedPolicySearchQuery = ref("");
const activeSummaryState = reactive({
  policy: ALL_POLICY_VALUE,
  recipient: "",
  area: ALL_AREA_VALUE,
  incomes: [] as string[],
  identities: [] as string[],
  query: "",
});

function normalizeSummaryKeyword(value: unknown) {
  const keyword = String(value ?? "").trim();
  if (!keyword || /^(?:未指定|undefined|null)$/iu.test(keyword)) return "";
  return keyword;
}

const canSearch = computed(() => {
  return Boolean(
    codeSelect_policy.value ||
    codeSelectRecipient.value ||
    codeSelectArea.value ||
    searchQuery.value.trim()
  );
});

function isAllPolicyValue(value: any) {
  return value == ALL_POLICY_VALUE || value == LEGACY_ALL_POLICY_VALUE;
}

function isAllAreaValue(value: any) {
  return value == ALL_AREA_VALUE || value == LEGACY_ALL_AREA_VALUE;
}

function getPolicyRouteValue(value: any) {
  if (value == LEGACY_ALL_POLICY_VALUE) return ALL_POLICY_VALUE;
  return typeof value == "string" ? value : ALL_POLICY_VALUE;
}

function getRouteValues(value: any, fallback: string[] = []) {
  const routeValues = (Array.isArray(value) ? value : [value])
    .flatMap((entry) => String(entry ?? "").split(","))
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => entry == LEGACY_ALL_AREA_VALUE ? ALL_AREA_VALUE : entry);
  return routeValues.length > 0 ? [...new Set(routeValues)] : [...fallback];
}

function getSpecificArea(value = codeSelectArea.value) {
  return isAllAreaValue(value) ? undefined : value;
}

function buildFarePolicyApiQueries(keywordOverride?: string) {
  const baseQuery: Record<string, any> = {};
  const selectedPolicy = codeSelect_policy.value || ALL_POLICY_VALUE;

  if (!isAllPolicyValue(selectedPolicy)) baseQuery.CodePolicy = selectedPolicy;
  if (codeSelectRecipient.value) baseQuery.CodeRecipient = codeSelectRecipient.value;
  const keywordSource = keywordOverride === undefined ? searchQuery.value : keywordOverride;
  const keyword = normalizeSummaryKeyword(keywordSource);
  if (keyword) baseQuery.Query = keyword;
  if (codeSelectIdentity.value.length > 0) baseQuery.CodeIdentities = [...codeSelectIdentity.value];

  const incomeQueries: Array<string | undefined> = codeSelectIncomes.value.length > 0
    ? [...codeSelectIncomes.value]
    : [undefined];

  const area = getSpecificArea();
  return incomeQueries.map((income) => ({
    ...baseQuery,
    ...(area ? { CodeDomicile: area } : {}),
    ...(income ? { CodeIncome: income } : {}),
  }));
}
const autocompleteFilters = computed(() => ({
  CodePolicy: codeSelect_policy.value && !isAllPolicyValue(codeSelect_policy.value) ? codeSelect_policy.value : undefined,
  CodeRecipient: codeSelectRecipient.value || undefined,
  CodeDomicile: getSpecificArea(),
  CodeIncome: codeSelectIncomes.value[0],
  CodeIdentities: codeSelectIdentity.value.length > 0 ? [...codeSelectIdentity.value] : undefined,
}));

function getSelectedLabel(list: Array<selectItem>, value: any, fallback = "") {
  if (value === undefined || value === null || value === "") return fallback;
  const item = list.find((entry) => String(entry.val) == String(value) || entry.name == value);
  return item?.name || String(value || fallback);
}

function getSelectedLabels(list: Array<selectItem>, values: any[], fallback = "") {
  const labels = values
    .map((value) => getSelectedLabel(list, value, ""))
    .filter(Boolean);
  return labels.length > 0 ? labels.join("、") : fallback;
}

const activePolicyLabel = computed(() =>
  isAllPolicyValue(activeSummaryState.policy)
    ? ALL_POLICY_VALUE
    : getSelectedLabel(policySelectList, activeSummaryState.policy, ALL_POLICY_VALUE)
);

const activeRecipientLabel = computed(() =>
  activeSummaryState.recipient
    ? getSelectedLabel(recipientSelectList, activeSummaryState.recipient, "")
    : ""
);

const activeAreaLabel = computed(() => {
  return isAllAreaValue(activeSummaryState.area)
    ? ALL_AREA_VALUE
    : getSelectedLabel(areaSelectList, activeSummaryState.area, ALL_AREA_VALUE);
});

const activeIncomeLabel = computed(() =>
  getSelectedLabels(incomeSelectList, activeSummaryState.incomes, "")
);

const activeIdentityLabel = computed(() => {
  const labels = activeSummaryState.identities
    .map((value) => getSelectedLabel(identitySelectList, value, ""))
    .filter(Boolean);
  return labels.join("、");
});

const summaryQuery = computed(
  () =>
    normalizeSummaryKeyword(resolvedPolicySearchQuery.value) ||
    normalizeSummaryKeyword(activeSummaryState.query)
);
// PRD 移植版保留摘要程式碼，只透過建置設定暫時關閉掛載。
const ifareAiSummaryEnabled = computed(
  () => !["0", "false", "off"].includes(
    String(runtimeConfig.public.enableIfareAiSummary ?? true).toLowerCase()
  )
);
const hasSummaryKeyword = computed(
  () => ifareAiSummaryEnabled.value && Boolean(summaryQuery.value)
);

const summarySearchContext = computed(() => ({
  policy: activePolicyLabel.value,
  recipient: activeRecipientLabel.value || "未指定",
  area: activeAreaLabel.value,
  income: activeIncomeLabel.value || "未指定",
  identity: activeIdentityLabel.value || "未指定",
  query: activeSummaryState.query.trim() || "未指定",
}));

const summaryCacheKey = computed(() =>
  JSON.stringify({
    policy: activeSummaryState.policy || ALL_POLICY_VALUE,
    recipient: activeSummaryState.recipient || "",
    area: activeSummaryState.area,
    incomes: activeSummaryState.incomes,
    identities: activeSummaryState.identities,
    query: activeSummaryState.query.trim(),
    count: storageiFarePolicyList.length,
    resultIds: storageiFarePolicyList.slice(0, 5).map((item) => item.id),
  })
);

let summaryPinTimers: number[] = [];
let resultPinTimers: number[] = [];

function clearSummaryPinTimers() {
  if (!process.client) return;
  summaryPinTimers.forEach((timer) => window.clearTimeout(timer));
  summaryPinTimers = [];
}

function clearResultPinTimers() {
  if (!process.client) return;
  resultPinTimers.forEach((timer) => window.clearTimeout(timer));
  resultPinTimers = [];
}

function scrollToSummary() {
  if (!process.client) return;

  nextTick(() => {
    window.requestAnimationFrame(() => {
      const target = summarySectionRef.value;
      if (!target) return;

      const header = document.querySelector<HTMLElement>(".app-header");
      const headerOffset = (header?.offsetHeight || 0) + 12;
      const top = window.scrollY + target.getBoundingClientRect().top - headerOffset;
      window.scrollTo({
        top: Math.max(0, top),
        behavior: "auto",
      });
    });
  });
}

function pinSummaryViewport() {
  if (!process.client) return;
  clearSummaryPinTimers();
  if (!hasSummaryKeyword.value) return;
  scrollToSummary();
  summaryPinTimers = [120, 420].map((delay) =>
    window.setTimeout(() => scrollToSummary(), delay)
  );
}

function scrollToFirstResult() {
  if (!process.client) return;

  nextTick(() => {
    window.requestAnimationFrame(() => {
      const section = resultSectionRef.value;
      const target = section?.querySelector<HTMLElement>(".result-item") || section;
      if (!target) return;

      const header = document.querySelector<HTMLElement>(".app-header");
      const headerOffset = (header?.offsetHeight || 0) + 12;
      const top = window.scrollY + target.getBoundingClientRect().top - headerOffset;
      window.scrollTo({
        top: Math.max(0, top),
        behavior: "auto",
      });
    });
  });
}

function pinFirstResultViewport() {
  if (!process.client || hasSummaryKeyword.value || storageiFarePolicyList.length === 0) return;
  clearResultPinTimers();
  scrollToFirstResult();
  resultPinTimers = [120, 420].map((delay) =>
    window.setTimeout(() => scrollToFirstResult(), delay)
  );
}

function updateActiveSummaryState() {
  activeSummaryState.policy = codeSelect_policy.value || ALL_POLICY_VALUE;
  activeSummaryState.recipient = codeSelectRecipient.value || "";
  activeSummaryState.area = codeSelectArea.value;
  activeSummaryState.incomes = [...codeSelectIncomes.value];
  activeSummaryState.identities = [...codeSelectIdentity.value];
  activeSummaryState.query = normalizeSummaryKeyword(searchQuery.value);
}

function handleSummaryComplete(payload: { summary: string }) {
  latestSummaryText.value = payload.summary;
  pinSummaryViewport();
}

function getSelectValue(type: string, val: string) {
  if (type == "policy") {
    codeSelect_policy.value = val;
  }

  if (type == "recipient") {
    codeSelectRecipient.value = val
  }
  if (type == "area") {
    codeSelectArea.value = val || ALL_AREA_VALUE;
  }
}

function getSelectItems(type: string, items: any) {
  const selectIncomes = items.filter((item: any) => item.type == "Income");
  codeSelectIncomes.value = selectIncomes.map((item: any) => String(item.value));

  const selectIdentities = items.filter((item: any) => item.type == "Identity");
  codeSelectIdentity.value = selectIdentities.map((item: any) => String(item.value));
}

// Code Policy
const codePolicy = $WebApiGet("/Code/GetCodePolicyList");
codePolicy.then((res: any) => {
  if (!res?.result?.result) return;
  const _data = res.result.result;
  let _list: Array<selectItem> = _data.map((item: any, i: number) => {
    return {
      name: item.codeName,
      val: String(item.id),
    };
  });
  policySelectList.push(..._list);
});

// Code area
const codeArea = $WebApiGet("/Code/GetCodeDomicileList");
codeArea.then((res: any) => {
  if (!res?.result?.result) return;
  const _data = res.result.result;
  let _list: Array<selectItem> = _data.map((item: any, i: number) => {
    return {
      name: item.codeName,
      val: String(item.id),
    };
  });
  areaSelectList.push(..._list);
});

// Code recipient
const codeRecipient = $WebApiGet("/Code/GetCodeRecipientList");
codeRecipient.then((res: any) => {
  if (!res?.result?.result) return;
  const _data = res.result.result;
  let _list: Array<selectItem> = _data.slice(1).map((item: any, i: number) => {
    return {
      name: item.codeName,
      val: String(item.id),
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
  if (!res?.result?.result) return;
  const _data = res.result.result;
  let _list: Array<selectItem> = _data.slice(1).map((item: any, i: number) => {
    return {
      name: item.codeName,
      val: String(item.id),
      isActive: false,
    };
  });
  incomeSelectList.push(..._list);
  incomeSelectList.forEach((item) => {
    item.isActive = codeSelectIncomes.value.includes(item.val);
  });
});

function SwitchIncome(codeVal: any) {
  if (codeVal == "reset") {
    codeSelectIncomes.value = [];
  } else {
    const value = String(codeVal);
    codeSelectIncomes.value = codeSelectIncomes.value.includes(value)
      ? codeSelectIncomes.value.filter((item) => item !== value)
      : [...codeSelectIncomes.value, value];
  }

  incomeSelectList.forEach((item) => {
    item.isActive = codeSelectIncomes.value.includes(item.val);
  });
}

// Code identity
const codeIdentity = $WebApiGet("/Code/GetCodeIdentityList");
codeIdentity.then((res: any) => {
  if (!res?.result?.result) return;
  const _data = res.result.result;
  let _list: Array<selectItem> = _data.slice(1).map((item: any, i: number) => {
    return {
      name: item.codeName == '?券' ? '銝?' : item.codeName,
      val: String(item.id),
      isActive: false,
    };
  });
  identitySelectList.push(..._list);
  identitySelectList.forEach((item) => {
    item.isActive = codeSelectIdentity.value.includes(item.val);
  });
});

function SwitchIdentity(codeVal: any) {
  if (codeVal == "reset") {
    codeSelectIdentity.value = [];
  } else {
    const value = String(codeVal);
    const noIdentityValue = identitySelectList.find((item) => item.name.trim() === "無")?.val;

    if (value === noIdentityValue) {
      codeSelectIdentity.value = codeSelectIdentity.value.includes(value) ? [] : [value];
    } else {
      const withoutNoIdentity = codeSelectIdentity.value.filter((item) => item !== noIdentityValue);
      codeSelectIdentity.value = withoutNoIdentity.includes(value)
        ? withoutNoIdentity.filter((item) => item !== value)
        : [...withoutNoIdentity, value];
    }
  }

  identitySelectList.forEach((item) => {
    item.isActive = codeSelectIdentity.value.includes(item.val);
  });
}

function Search() {
  if (!canSearch.value) return false;
  const routeQuery: Record<string, string> = {
    policy: codeSelect_policy.value || ALL_POLICY_VALUE,
    area: codeSelectArea.value || ALL_AREA_VALUE,
  };
  if (codeSelectRecipient.value) routeQuery.recipient = codeSelectRecipient.value;
  if (codeSelectIncomes.value.length > 0) routeQuery.income = codeSelectIncomes.value.join(",");
  if (codeSelectIdentity.value.length > 0) routeQuery.identities = codeSelectIdentity.value.join(",");
  if (searchQuery.value.trim()) routeQuery.query = searchQuery.value.trim();
  void $router.replace({ query: routeQuery });
  void SetDataInit();
}

// iFare Policy
const PAGEITEMMAX = 10;
const $route = useRoute();
const $router = useRouter();

// Init filter default value.
codeSelect_policy.value = getPolicyRouteValue($route.query.policy)
codeSelectArea.value = getRouteValues($route.query.area, [ALL_AREA_VALUE])[0] || ALL_AREA_VALUE
codeSelectRecipient.value = typeof $route.query.recipient == "string" ? $route.query.recipient : ""
codeSelectIncomes.value = getRouteValues($route.query.income)
codeSelectIdentity.value = getRouteValues($route.query.identities)
searchQuery.value = normalizeSummaryKeyword(
  typeof $route.query.query == "string" ? $route.query.query : ""
)

interface iFarePolicyItem {
  id: number;
  title: string;
  qualification: string;
  area: string;
  areaTitle: string;
  hasIndentity: boolean;
  hasIncome: boolean;
  hasRecipient: boolean;
}

interface pageNum {
  num: number;
  isActive: boolean;
  isHide: boolean;
}

function normalizePolicySignatureText(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function getPolicyCodeListSignature(value: unknown) {
  if (!Array.isArray(value)) return "";

  return value
    .map((item: any) => String(item?.id ?? item?.ID ?? item?.codeName ?? ""))
    .filter(Boolean)
    .sort()
    .join(",");
}

const unrestrictedPolicyCodeNames = new Set([
  "全選",
  "全部",
  "不限",
  "不限制",
  "無限制",
  "無經濟限制",
  "無特殊身分",
  "無",
]);

function hasPolicyRestriction(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) return false;

  return value.some((item: any) => {
    const id = Number(item?.id ?? item?.ID);
    const name = String(
      item?.codeName ?? item?.CodeName ?? item?.labelName ?? item?.name ?? ""
    ).trim();

    if (id === 1 || unrestrictedPolicyCodeNames.has(name)) return false;
    return (Number.isFinite(id) && id > 0) || Boolean(name);
  });
}

function getPolicyContentSignature(item: any) {
  return JSON.stringify([
    normalizePolicySignatureText(item?.title),
    normalizePolicySignatureText(item?.qualification),
    String(item?.codePolicy_ID ?? ""),
    getPolicyCodeListSignature(item?.codeKeywordList),
    getPolicyCodeListSignature(item?.codeIdentityList),
    getPolicyCodeListSignature(item?.codeIncomeList),
    getPolicyCodeListSignature(item?.codeRecipientList),
    String(item?.releaseTime ?? ""),
    String(item?.discontinuedTime ?? ""),
  ]);
}

function getUniquePolicySearchResults(rawItems: Array<any>) {
  if (!isAllAreaValue(codeSelectArea.value)) {
    const uniqueItems = new Map<string, any>();
    rawItems.forEach((item: any) => uniqueItems.set(String(item.id), item));
    return [...uniqueItems.values()];
  }

  const policyGroups = new Map<string, { item: any; areas: Set<string> }>();
  rawItems.forEach((item: any) => {
    const signature = getPolicyContentSignature(item);
    const area = normalizePolicySignatureText(item?.codeDomicile_LabelName);
    const existing = policyGroups.get(signature);

    if (existing) {
      if (area) existing.areas.add(area);
      return;
    }

    policyGroups.set(signature, {
      item,
      areas: new Set(area ? [area] : []),
    });
  });

  return [...policyGroups.values()].map(({ item, areas }) => {
    const areaList = [...areas];
    const fullAreaLabel = areaList.join("、") || item.codeDomicile_LabelName;
    const displayAreaLabel = areaList.length > 1
      ? `${areaList[0]}等`
      : fullAreaLabel;

    return {
      ...item,
      codeDomicile_LabelName: displayAreaLabel,
      codeDomicile_FullLabelName: fullAreaLabel,
    };
  });
}

const iFarePolicyList = reactive<Array<iFarePolicyItem>>([]);
const storageiFarePolicyList = reactive<Array<iFarePolicyItem>>([]);
const pageNums = reactive<Array<pageNum>>([]);

type SearchIntentResult = {
  searchQuery?: string;
  intent?: string;
  area?: string;
  recipient?: string;
  income?: string;
  identities?: string[];
  source?: "groq" | "gemini" | "fallback" | "skipped";
  model?: string;
  errorMessage?: string;
};

type SummaryConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

type SummaryConversationSearchPayload = {
  query: string;
  conversation: SummaryConversationMessage[];
};

type PolicySearchRequestPlan = {
  query: Record<string, any>;
  source: "original" | "ai";
  weight: number;
};

let policySearchRequestId = 0;

function getPolicyResponseItems(response: any) {
  return Array.isArray(response?.result?.result) ? response.result.result : [];
}

function getPolicyTimestamp(value: unknown) {
  if (!value) return 0;
  const rawValue = String(value).trim();
  const directTimestamp = Date.parse(rawValue);
  if (Number.isFinite(directTimestamp)) return directTimestamp;

  const normalizedValue = rawValue
    .replace(/^(\d{4})\.(\d{1,2})\.(\d{1,2})/, "$1-$2-$3")
    .replace(" ", "T");
  const timestamp = Date.parse(normalizedValue);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function comparePolicyRecency(a: any, b: any) {
  const releaseDiff = getPolicyTimestamp(b?.releaseTime) - getPolicyTimestamp(a?.releaseTime);
  if (releaseDiff !== 0) return releaseDiff;

  const createDiff = getPolicyTimestamp(b?.createTime) - getPolicyTimestamp(a?.createTime);
  if (createDiff !== 0) return createDiff;

  return Number(b?.id ?? 0) - Number(a?.id ?? 0);
}

function sortPolicyResultsByNewest(items: any[]) {
  return [...items].sort(comparePolicyRecency);
}

const policySearchConceptPattern =
  /長期照顧|長照|照顧者|照顧|生育|懷孕|孕婦|新生兒|育兒|托育|身心障礙|智能障礙|身障|低能兒|老人|長者|高齡|兒少|兒童|青少年|低收入|中低收入|經濟弱勢|原住民|新住民|醫療|教育|就學|學費|租屋|住宅|失業|就業|急難|喪葬|交通|輔具|看護|居家|喘息|補助|津貼/giu;

const genericPolicySearchTerms = new Set([
  "補助",
  "津貼",
  "福利",
  "服務",
  "政策",
  "申請",
]);

function normalizePolicySearchText(value: unknown) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}]+/gu, "");
}

function getPolicySearchTerms(query: string) {
  const normalizedQuery = String(query ?? "").normalize("NFKC").toLowerCase().trim();
  if (!normalizedQuery) return [];

  const terms = new Set<string>();
  const compactQuery = normalizePolicySearchText(normalizedQuery);
  if (compactQuery.length >= 2 && compactQuery.length <= 8) terms.add(compactQuery);

  normalizedQuery
    .split(/[\s,，、。！？?；;：:／/]+/u)
    .map((term) => normalizePolicySearchText(term))
    .filter((term) => term.length >= 2 && term.length <= 8)
    .forEach((term) => terms.add(term));

  for (const match of normalizedQuery.matchAll(policySearchConceptPattern)) {
    const term = normalizePolicySearchText(match[0]);
    if (term) terms.add(term);
  }

  return [...terms];
}

function getPolicyCodeNames(value: unknown) {
  if (!Array.isArray(value)) return "";
  return value
    .map((item: any) => item?.codeName ?? item?.CodeName ?? item?.labelName ?? item?.name ?? "")
    .join(" ");
}

type PolicyKeywordMatchMetrics = {
  exactLevel: number;
  specificCoverage: number;
  specificTitleMatches: number;
  matchedSpecificTerms: number;
  score: number;
};

function getPolicyKeywordMatchMetrics(item: any, query: string): PolicyKeywordMatchMetrics {
  const terms = getPolicySearchTerms(query);
  if (terms.length === 0) {
    return {
      exactLevel: 0,
      specificCoverage: 0,
      specificTitleMatches: 0,
      matchedSpecificTerms: 0,
      score: 0,
    };
  }

  const title = normalizePolicySearchText(item?.title);
  const keywords = normalizePolicySearchText(getPolicyCodeNames(item?.codeKeywordList));
  const qualification = normalizePolicySearchText(item?.qualification);
  const fullQuery = normalizePolicySearchText(query);
  const specificTerms = terms.filter((term) =>
    !genericPolicySearchTerms.has(term) && term !== fullQuery
  );
  let exactLevel = 0;
  let specificTitleMatches = 0;
  let matchedSpecificTerms = 0;
  let score = 0;

  if (fullQuery.length >= 2) {
    if (title.includes(fullQuery)) {
      exactLevel = 3;
      score += 24;
    } else if (keywords.includes(fullQuery)) {
      exactLevel = 2;
      score += 16;
    } else if (qualification.includes(fullQuery)) {
      exactLevel = 1;
      score += 6;
    }
  }

  for (const term of terms) {
    const weight = genericPolicySearchTerms.has(term) ? 0.35 : 1;
    const titleMatched = title.includes(term);
    const keywordMatched = keywords.includes(term);
    const qualificationMatched = qualification.includes(term);

    if (titleMatched) score += 8 * weight;
    if (keywordMatched) score += 5 * weight;
    if (qualificationMatched) score += 2 * weight;
    if (!genericPolicySearchTerms.has(term) && term !== fullQuery) {
      if (titleMatched) specificTitleMatches += 1;
      if (titleMatched || keywordMatched || qualificationMatched) matchedSpecificTerms += 1;
    }
  }

  return {
    exactLevel,
    specificCoverage: specificTerms.length > 0
      ? matchedSpecificTerms / specificTerms.length
      : 0,
    specificTitleMatches,
    matchedSpecificTerms,
    score,
  };
}

function mergeRankedPolicySearchResults(
  plans: PolicySearchRequestPlan[],
  responses: any[],
  originalQuery: string,
  resolvedQuery: string
) {
  const rankedItems = new Map<string, {
    item: any;
    score: number;
    keywordMatch: PolicyKeywordMatchMetrics;
    aiMatch: PolicyKeywordMatchMetrics;
    bestOriginalRank: number;
    firstOrder: number;
  }>();
  let firstOrder = 0;

  responses.forEach((response, responseIndex) => {
    const plan = plans[responseIndex];
    if (!plan) return;

    getPolicyResponseItems(response).forEach((item: any, rank: number) => {
      const itemId = String(item?.id ?? item?.ID ?? "");
      if (!itemId) return;

      const current = rankedItems.get(itemId) || {
        item,
        score: 0,
        keywordMatch: getPolicyKeywordMatchMetrics(item, originalQuery),
        aiMatch: getPolicyKeywordMatchMetrics(item, resolvedQuery),
        bestOriginalRank: Number.POSITIVE_INFINITY,
        firstOrder: firstOrder++,
      };

      // Reciprocal-rank fusion keeps literal matches dominant while allowing
      // AI-expanded terms to supplement results the original wording missed.
      current.score += plan.weight / (60 + rank + 1);
      if (plan.source === "original") {
        current.bestOriginalRank = Math.min(current.bestOriginalRank, rank);
        current.item = item;
      }
      rankedItems.set(itemId, current);
    });
  });

  return [...rankedItems.values()]
    .sort((a, b) => {
      // Original wording always wins. AI intent only breaks ties between items
      // with the same direct keyword relevance.
      const originalComparisons = [
        b.keywordMatch.exactLevel - a.keywordMatch.exactLevel,
        b.keywordMatch.specificCoverage - a.keywordMatch.specificCoverage,
        b.keywordMatch.specificTitleMatches - a.keywordMatch.specificTitleMatches,
        b.keywordMatch.matchedSpecificTerms - a.keywordMatch.matchedSpecificTerms,
        b.keywordMatch.score - a.keywordMatch.score,
      ];
      const originalDiff = originalComparisons.find(diff => Math.abs(diff) > Number.EPSILON);
      if (originalDiff !== undefined) return originalDiff;

      const aiComparisons = [
        b.aiMatch.exactLevel - a.aiMatch.exactLevel,
        b.aiMatch.specificCoverage - a.aiMatch.specificCoverage,
        b.aiMatch.score - a.aiMatch.score,
      ];
      const aiDiff = aiComparisons.find(diff => Math.abs(diff) > Number.EPSILON);
      if (aiDiff !== undefined) return aiDiff;

      const scoreDiff = b.score - a.score;
      if (Math.abs(scoreDiff) > Number.EPSILON) return scoreDiff;

      const originalRankDiff = Number.isFinite(a.bestOriginalRank) && Number.isFinite(b.bestOriginalRank)
        ? a.bestOriginalRank - b.bestOriginalRank
        : Number.isFinite(a.bestOriginalRank)
          ? -1
          : Number.isFinite(b.bestOriginalRank)
            ? 1
            : 0;
      if (originalRankDiff !== 0) return originalRankDiff;

      const recencyDiff = comparePolicyRecency(a.item, b.item);
      return recencyDiff !== 0 ? recencyDiff : a.firstOrder - b.firstOrder;
    })
    .map((entry) => entry.item);
}

onMounted(() => {
  void SetDataInit();
});

type ResolvedPolicySearchIntent = {
  query: string;
  area: string;
  recipient: string;
  income: string;
  identities: string[];
};

function normalizeAreaLabel(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/^臺/u, "台")
    .replace(/\s+/g, "");
}

async function applyResolvedSearchArea(areaName: string) {
  const normalizedArea = normalizeAreaLabel(areaName);
  if (!normalizedArea) return false;

  await codeArea.catch(() => undefined);
  const areaItem = areaSelectList.find(
    item => normalizeAreaLabel(item.name) === normalizedArea,
  );
  if (!areaItem || codeSelectArea.value === areaItem.val) return false;

  codeSelectArea.value = areaItem.val;
  activeSummaryState.area = areaItem.val;
  const routeQuery = { ...$route.query, area: areaItem.val };
  await $router.replace({ query: routeQuery });
  return true;
}

const EMPTY_RESOLVED_INTENT_CONDITIONS = {
  area: "",
  recipient: "",
  income: "",
  identities: [] as string[],
};

async function resolvePolicySearchIntent(
  originalQuery: string,
  conversation: SummaryConversationMessage[] = [],
): Promise<ResolvedPolicySearchIntent> {
  const normalizedQuery = normalizeSummaryKeyword(originalQuery);
  if (!normalizedQuery || !process.client) {
    return { query: normalizedQuery, ...EMPTY_RESOLVED_INTENT_CONDITIONS };
  }

  try {
    const result = await $fetch<SearchIntentResult>("/api/llm/search-intent", {
      method: "POST",
      body: {
        query: normalizedQuery,
        conversation,
        context: summarySearchContext.value,
      },
    });
    return {
      query: normalizeSummaryKeyword(result?.searchQuery) || normalizedQuery,
      area: normalizeAreaLabel(result?.area),
      recipient: String(result?.recipient || "").trim(),
      income: String(result?.income || "").trim(),
      identities: Array.isArray(result?.identities)
        ? result.identities.map((item) => String(item || "").trim()).filter(Boolean)
        : [],
    };
  } catch (error) {
    console.warn("[iFare][search-intent]", error);
    return { query: normalizedQuery, ...EMPTY_RESOLVED_INTENT_CONDITIONS };
  }
}

/** 篩選選項標籤比對：容忍「＆、及、和」與繁簡寫差異 */
function matchFilterLabel(optionName: string, target: string) {
  const normalize = (value: string) =>
    String(value || "")
      .replace(/臺/gu, "台")
      .replace(/[＆&及和\s　]/gu, "");
  const option = normalize(optionName);
  const wanted = normalize(target);
  if (!option || !wanted) return false;
  return option === wanted || option.includes(wanted) || wanted.includes(option);
}

/**
 * 把意圖解析出的條件自動套進篩選器。
 * 原則：戶籍地沿用既有行為（明確地名可切換）；年齡／經濟／身分只在
 * 「使用者尚未自行選擇」時才自動帶入，絕不覆蓋使用者手動設定的條件。
 */
async function applyResolvedSearchFilters(intent: ResolvedPolicySearchIntent) {
  let changed = await applyResolvedSearchArea(intent.area);

  if (intent.recipient && !codeSelectRecipient.value) {
    await codeRecipient.catch(() => undefined);
    const item = recipientSelectList.find((entry) => matchFilterLabel(entry.name, intent.recipient));
    if (item) {
      SwitchRecipient(item.val);
      activeSummaryState.recipient = codeSelectRecipient.value;
      changed = true;
    }
  }

  if (intent.income && codeSelectIncomes.value.length === 0) {
    await codeIncome.catch(() => undefined);
    const item = incomeSelectList.find((entry) => matchFilterLabel(entry.name, intent.income));
    if (item) {
      SwitchIncome(item.val);
      activeSummaryState.incomes = [...codeSelectIncomes.value];
      changed = true;
    }
  }

  if (intent.identities.length > 0 && codeSelectIdentity.value.length === 0) {
    await codeIdentity.catch(() => undefined);
    let identityChanged = false;
    for (const label of intent.identities) {
      const item = identitySelectList.find((entry) => matchFilterLabel(entry.name, label));
      if (item && !codeSelectIdentity.value.includes(item.val)) {
        SwitchIdentity(item.val);
        identityChanged = true;
      }
    }
    if (identityChanged) {
      activeSummaryState.identities = [...codeSelectIdentity.value];
      changed = true;
    }
  }

  if (changed) {
    const routeQuery: Record<string, any> = { ...$route.query };
    if (codeSelectRecipient.value) routeQuery.recipient = codeSelectRecipient.value;
    else delete routeQuery.recipient;
    if (codeSelectIncomes.value.length > 0) routeQuery.income = codeSelectIncomes.value.join(",");
    else delete routeQuery.income;
    if (codeSelectIdentity.value.length > 0) routeQuery.identities = codeSelectIdentity.value.join(",");
    else delete routeQuery.identities;
    await $router.replace({ query: routeQuery });
  }

  return changed;
}

/**
 * 複數關鍵字（「低收入戶 新北市老人津貼」）拆成分段，各自多打一次搜尋 API，
 * 由 reciprocal-rank fusion 合併。單一關鍵字回空陣列、不多發請求。
 */
function splitQuerySegments(query: string) {
  const segments = String(query || "")
    .split(/[\s　,，、;；/／]+/u)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2);
  const unique = [...new Set(segments)].filter((item) => item !== query.trim());
  return unique.length >= 2 ? unique : [];
}

function mapPolicySearchItems(items: any[]): iFarePolicyItem[] {
  return items.map((item: any) => {
    const recipientList = Array.isArray(item.codeRecipientList)
      ? item.codeRecipientList
      : [];

    return {
      id: item.id,
      title: item.title,
      qualification: item.qualification ?? "",
      area: item.codeDomicile_LabelName,
      areaTitle: item.codeDomicile_FullLabelName ?? item.codeDomicile_LabelName,
      hasIndentity: hasPolicyRestriction(item.codeIdentityList),
      hasIncome: hasPolicyRestriction(item.codeIncomeList),
      hasRecipient: recipientList.findIndex((entry: any) => entry.id == 1) < 0,
    };
  });
}

function replacePolicySearchItems(items: iFarePolicyItem[]) {
  storageiFarePolicyList.splice(0, storageiFarePolicyList.length, ...items);
  iFarePolicyList.splice(0, iFarePolicyList.length, ...items.slice(0, PAGEITEMMAX));
  pageNums.splice(0);

  for (let index = 0; index < items.length / PAGEITEMMAX; index += 1) {
    pageNums.push({
      num: index + 1,
      isActive: index === 0,
      isHide: false,
    });
  }
}

async function searchSummaryConversationPolicies(
  payload: SummaryConversationSearchPayload,
) {
  const requestId = ++policySearchRequestId;
  const originalQuery = normalizeSummaryKeyword(
    activeSummaryState.query || payload.query || searchQuery.value,
  );
  const userMemory = payload.conversation
    .filter(item => item.role === "user")
    .map(item => normalizeSummaryKeyword(item.content))
    .filter(Boolean);
  const literalMemoryQuery = [originalQuery, ...userMemory].join(" ").trim();
  const resolvedIntent = await resolvePolicySearchIntent(originalQuery, payload.conversation);
  const resolvedQuery = resolvedIntent.query;
  if (requestId !== policySearchRequestId) {
    return { query: resolvedQuery || originalQuery, cases: [...storageiFarePolicyList] };
  }
  await applyResolvedSearchFilters(resolvedIntent);
  if (requestId !== policySearchRequestId) {
    return { query: resolvedQuery || originalQuery, cases: [...storageiFarePolicyList] };
  }

  const originalQueries = buildFarePolicyApiQueries(originalQuery);
  const hasMemoryExpansion = Boolean(resolvedQuery && resolvedQuery !== originalQuery);
  const memoryQueries = hasMemoryExpansion ? buildFarePolicyApiQueries(resolvedQuery) : [];
  const plans: PolicySearchRequestPlan[] = [
    ...originalQueries.map(query => ({ query, source: "original" as const, weight: hasMemoryExpansion ? 0.7 : 1 })),
    ...memoryQueries.map(query => ({ query, source: "ai" as const, weight: 0.3 })),
  ];
  const responses = await Promise.all(
    plans.map(plan => $WebApiGet("/FarePolicy/GetIFarePolicyList", plan.query)),
  );
  if (requestId !== policySearchRequestId) {
    return { query: resolvedQuery || originalQuery, cases: [...storageiFarePolicyList] };
  }

  const rawItems = mergeRankedPolicySearchResults(
    plans,
    responses,
    literalMemoryQuery || originalQuery,
    resolvedQuery || originalQuery,
  );
  const nextItems = mapPolicySearchItems(getUniquePolicySearchResults(rawItems));
  replacePolicySearchItems(nextItems);
  await nextTick();
  // Keep the current question in view during follow-up searches.

  return {
    query: resolvedQuery || originalQuery,
    cases: nextItems,
  };
}

async function SetDataInit() {
  const requestId = ++policySearchRequestId;
  clearResultPinTimers();
  updateActiveSummaryState();
  latestSummaryText.value = "";
  summaryResetKey.value += 1;
  storageiFarePolicyList.splice(0);
  iFarePolicyList.splice(0);
  pageNums.splice(0);
  isLoading.value = true;
  pinSummaryViewport();
  const originalQuery = normalizeSummaryKeyword(searchQuery.value);
  const prefetchedOriginalQueries = buildFarePolicyApiQueries(originalQuery);
  const prefetchedOriginalResponse = Promise.all(
    prefetchedOriginalQueries.map((query) => $WebApiGet("/FarePolicy/GetIFarePolicyList", query))
  );
  const resolvedIntent = await resolvePolicySearchIntent(originalQuery);
  const resolvedQuery = resolvedIntent.query;
  if (requestId !== policySearchRequestId) return;
  const filtersChanged = await applyResolvedSearchFilters(resolvedIntent);
  if (requestId !== policySearchRequestId) return;
  const originalQueries = filtersChanged
    ? buildFarePolicyApiQueries(originalQuery)
    : prefetchedOriginalQueries;
  const originalResponsePromise = filtersChanged
    ? Promise.all(
        originalQueries.map((query) => $WebApiGet("/FarePolicy/GetIFarePolicyList", query))
      )
    : prefetchedOriginalResponse;
  resolvedPolicySearchQuery.value = resolvedQuery;
  const hasAiExpansion = Boolean(resolvedQuery && resolvedQuery !== originalQuery);
  const originalWeight = hasAiExpansion ? 0.7 : 1;
  const requestPlans: PolicySearchRequestPlan[] = originalQueries.map((query) => ({
    query,
    source: "original",
    weight: originalWeight,
  }));
  const aiPlans: PolicySearchRequestPlan[] = hasAiExpansion
    ? buildFarePolicyApiQueries(resolvedQuery).map((query) => ({
        query,
        source: "ai",
        weight: 0.3,
      }))
    : [];
  // 複數關鍵字：每個分段各自查一次，字面命中權重高於 AI 擴充
  const segmentPlans: PolicySearchRequestPlan[] = splitQuerySegments(originalQuery)
    .flatMap((segment) => buildFarePolicyApiQueries(segment))
    .map((query) => ({
      query,
      source: "original" as const,
      weight: 0.45,
    }));

  try {
    const extraPlans = [...segmentPlans, ...aiPlans];
    const [originalResponses, extraResponses] = await Promise.all([
      originalResponsePromise,
      Promise.all(
        extraPlans.map((plan) => $WebApiGet("/FarePolicy/GetIFarePolicyList", plan.query))
      ),
    ]);
    if (requestId !== policySearchRequestId) return;

    const responses = [...originalResponses, ...extraResponses];
    const plans = [...requestPlans, ...extraPlans];
    const responseItems = responses.flatMap(getPolicyResponseItems);
    const rawItems = originalQuery
      ? mergeRankedPolicySearchResults(plans, responses, originalQuery, resolvedQuery)
      : sortPolicyResultsByNewest(responseItems);
    const _data = getUniquePolicySearchResults(rawItems);
    const _newsList = mapPolicySearchItems(_data);
    replacePolicySearchItems(_newsList);
  } finally {
    if (requestId !== policySearchRequestId) return;
    isLoading.value = false;
    summaryTriggerKey.value += 1;
    if (hasSummaryKeyword.value) {
      pinSummaryViewport();
    } else {
      pinFirstResultViewport();
    }
  }
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
  // console.log(`[${type}] val => ${val} || type ${typeof val}`)
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
  codeSelectArea.value = ALL_AREA_VALUE
  const _tempArea = JSON.parse(JSON.stringify(areaSelectList))
  areaSelectList.splice(0)
  areaSelectList.push(..._tempArea)

  codeSelect_policy.value = ALL_POLICY_VALUE
  const _tempPolicy = JSON.parse(JSON.stringify(policySelectList))
  policySelectList.splice(0)
  policySelectList.push(..._tempPolicy)

  searchQuery.value = ""

  SwitchRecipient("reset")
  SwitchIncome("reset")
  SwitchIdentity("reset")
}

onBeforeUnmount(() => {
  clearSummaryPinTimers();
  clearResultPinTimers();
});
</script>

<style scoped lang="scss">
.section-summary {
  scroll-margin-top: 112px;
}

.section-result {
  overflow-anchor: none;
}

.section-list,
.section-summary {
  overflow-anchor: none;
}

.result-filter-area-text {
  display: inline-block;
  max-width: 5em;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: bottom;
  white-space: nowrap;
}

@media (max-width: 767px) {
  .section-summary {
    scroll-margin-top: 84px;
  }
}
</style>
