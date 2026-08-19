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
        <!--
          選項沒載進來時要講出來。不講的話畫面只是「下拉是空的、年齡按鈕不見了」，
          使用者會以為這個網站本來就不能篩，而不是知道可以按一下重試。
        -->
        <div v-if="filterOptionsFailed" class="card-filter-failed" role="alert">
          <p class="card-filter-failed-text">篩選條件載入失敗，目前只能用關鍵字搜尋。</p>
          <button type="button" class="btn card-filter-failed-retry" @click="ReloadFilterOptions">重新載入篩選條件</button>
        </div>
        <div class="card-filter-reset">
          <button class="btn btn-reset" @click="ResetParam">清空</button>
        </div>
      </section>
      <section v-if="hasSummaryCard" ref="summarySectionRef" class="section-summary">
        <IfareSummaryCard
          :query="summaryQuery"
          :cases="storageiFarePolicyList"
          :results-loading="isLoading"
          :search-context="summarySearchContext"
          :summary-trigger-key="summaryTriggerKey"
          :summary-reset-key="summaryResetKey"
          :summary-cache-key="summaryCacheKey"
          :conversation-search="searchSummaryConversationPolicies"
          :conversation-scope-probe="probeSummaryScopeShift"
          :quick-options="summaryQuickOptions"
          :active-filters="summaryActiveFilters"
          :result-breakdown="summaryResultBreakdown"
          :relax-suggestions="relaxSuggestions"
          :search-failed="searchFailed"
          @summary-complete="handleSummaryComplete"
          @select-quick-option="applySummaryQuickOption"
          @clear-filter="clearSummaryFilter"
        />
      </section>
      <section ref="resultSectionRef" class="section-result">
        <div class="part-list">
          <span v-if="!isLoading && !searchFailed" class="result-total">{{ storageiFarePolicyList.length }}</span>
          <div class="result-loading" v-if="isLoading">政策資料搜尋中...</div>
          <!--
            連線失敗不能借用「0 筆」的版面。那一行搭配 CSS 的前後綴會讀成
            「找到 0 筆福利政策」，等於替後端斷線背書說本站沒有這類補助——
            實測擋掉 GetIFarePolicyList 再搜「長照」就是這樣，但站內其實有 52 筆。
          -->
          <div class="result-failed" v-else-if="searchFailed">
            <p class="result-failed-text">搜尋暫時無法完成，請稍後再試。</p>
            <p class="result-failed-note">這次沒有取得站內政策資料，不代表沒有符合的補助。</p>
            <button type="button" class="btn result-failed-retry" @click="RetrySearch">重試</button>
          </div>
          <ul class="list-unstyled result-list" v-else>
            <li
              class="result-item transition-general"
              v-for="_item in iFarePolicyList"
              :key="_item.id"
            >
              <!-- 不要帶 reload：route.global.ts 看到它會改用 router.replace 收尾，
                   那次 replace 執行時網址還停在結果頁，被覆蓋掉的就是結果頁這一筆，
                   使用者從政策明細按上一頁就再也回不來。明細頁的 watcher 早就 key 在
                   route.query.id，換 id 本來就會重抓，reload 已經沒有存在的必要。 -->
              <NuxtLink :to="{ path: '/ifare/info', query: { id: _item.id } }">
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
        <div class="part-pages" v-show="!isLoading && !searchFailed">
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
const { $WebApiGet, $WebApiGetDetailed } = useNuxtApp();
const runtimeConfig = useRuntimeConfig();
import CompSelect from "~/components/CompSelect.vue";
import CompSelectRecipient from "~/components/CompSelectRecipient.vue";
import CompSelectElse from "~/components/CompSelectElse.vue";
import CompPage from "~/components/CompPage.vue"
import IfareSummaryCard from "~/components/IfareSummaryCard.vue";
import IfareSearchAutocomplete from "~/components/IfareSearchAutocomplete.vue";
import {
  buildRelevanceQuery,
  expandSituationVocabulary,
  extractExplicitSearchConditions,
  isAreaOnlySegment,
  matchPolicyCategory,
} from "~/utils/ifareIntent";
import { clearIFareSummaryCaches, consumeReloadNavigation } from "~/utils/ifareSummaryCache";

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
// 一進頁面就一定會搜尋（onMounted → SetDataInit），所以初始值就是「搜尋中」。
// 之前預設 false，重新整理後會先顯示「找到 0 筆福利政策」約半秒才切成搜尋中——
// 看起來就像重整沒作用、或這組條件真的查不到東西。
const isLoading = ref(true);
// 這一輪搜尋是「一路都沒查成功」，不是站內真的沒有符合的政策。
// 兩件事以前分不出來：$WebApiGet 失敗只回 null，前端拿到的一樣是空清單，
// 於是結果區寫「找到 0 筆福利政策」、摘要卡也因為 cases 是空的被伺服器判成
// 站內查無資料，改用一般知識寫一整篇科普。實測擋掉 GetIFarePolicyList 搜「長照」
// 就是這個畫面，但站內其實有 52 筆——一篇看起來很權威的文章比空白更誤導人。
const searchFailed = ref(false);
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

/**
 * omitField：組查詢時刻意略過某一項條件，用來算「放寬這一項會有幾筆」。
 * override：把某一項換成別的值，用來算「改成台北市會有幾筆」。
 * 一律走同一個組裝流程，避免建議的筆數跟實際搜尋結果對不上。
 */
function buildFarePolicyApiQueries(
  keywordOverride?: string,
  omitField = "",
  override?: { field: string; val: string },
) {
  const overrideOf = (field: string) =>
    override && override.field === field ? override.val : "";
  const baseQuery: Record<string, any> = {};
  const selectedPolicy = overrideOf("policy") || codeSelect_policy.value || ALL_POLICY_VALUE;
  const selectedRecipient = overrideOf("recipient") || codeSelectRecipient.value;
  const selectedIdentities = overrideOf("identity")
    ? [overrideOf("identity")]
    : codeSelectIdentity.value;

  if (omitField !== "policy" && !isAllPolicyValue(selectedPolicy)) baseQuery.CodePolicy = selectedPolicy;
  if (omitField !== "recipient" && selectedRecipient) baseQuery.CodeRecipient = selectedRecipient;
  const keywordSource = keywordOverride === undefined ? searchQuery.value : keywordOverride;
  const keyword = normalizeSummaryKeyword(keywordSource);
  if (keyword) baseQuery.Query = keyword;
  if (omitField !== "identity" && selectedIdentities.length > 0) {
    baseQuery.CodeIdentities = [...selectedIdentities];
  }

  const selectedIncomes = omitField === "income"
    ? []
    : (overrideOf("income") ? [overrideOf("income")] : codeSelectIncomes.value);
  const incomeQueries: Array<string | undefined> = selectedIncomes.length > 0
    ? [...selectedIncomes]
    : [undefined];

  const area = omitField === "area"
    ? undefined
    : getSpecificArea(overrideOf("area") || codeSelectArea.value);
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

/**
 * 沒打關鍵字、只選了篩選條件時，用「已選條件」組出來的描述性查詢詞。
 *
 * 摘要 API 的 query 一空就直接回空摘要（stream.post.ts 的早退分支），
 * 但只選「台北市＋長期照顧」的人一樣需要引導問句、快捷鈕與放寬建議；
 * 條件本身就是他表達需求的方式，拿它當查詢詞才不會整張卡消失。
 * 取捨與 summaryActiveFilters 的標籤一致——卡片上看得到的條件，就是送進摘要的條件。
 * 什麼都沒選時回空字串：初始狀態不該憑空跑出一張摘要卡。
 */
const conditionSummaryQuery = computed(() =>
  [
    isAllPolicyValue(activeSummaryState.policy) ? "" : activePolicyLabel.value,
    isAllAreaValue(activeSummaryState.area) ? "" : activeAreaLabel.value,
    activeRecipientLabel.value,
    activeIncomeLabel.value,
    activeIdentityLabel.value,
  ]
    .filter(Boolean)
    .join(" ")
);

const summaryQuery = computed(
  () =>
    normalizeSummaryKeyword(resolvedPolicySearchQuery.value) ||
    normalizeSummaryKeyword(activeSummaryState.query) ||
    // 這裡刻意不補 searchQuery（網址上的關鍵字，更早就讀得到）。補了摘要卡會提早
    // 一秒掛載，但那會落在 SetDataInit 重置之前——卡片剛從快取還原的摘要與對話串，
    // 會馬上被 summaryResetKey 的 watcher 清掉，重新整理就接不回上一輪的問答了。
    conditionSummaryQuery.value
);
// PRD 移植版保留摘要程式碼，只透過建置設定暫時關閉掛載。
const ifareAiSummaryEnabled = computed(
  () => !["0", "false", "off"].includes(
    String(runtimeConfig.public.enableIfareAiSummary ?? true).toLowerCase()
  )
);
// 有關鍵字、或有任何篩選條件就顯示摘要卡：純篩選與 0 筆才是最需要引導的時候。
const hasSummaryCard = computed(
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
    // 刻意不放結果總筆數。搜尋除了原始關鍵字還會跑一次 AI 擴充查詢，合併後的總數
    // 每次會差個一兩筆（實測同一組條件 127 / 128），把它放進 key 等於每次重新整理
    // 都算出不同的 key——摘要一定重跑、對話串也一定接不回來。
    // 排序前 5 筆的 id 才是摘要真正的輸入，而且穩定；總筆數只出現在另外即時算的
    // 結果組成說明裡，不影響快取內容。
    resultIds: storageiFarePolicyList.slice(0, 5).map((item) => item.id),
  })
);

/**
 * 摘要卡的快捷鈕選項，依「這輪在問哪一項條件」分組。
 *
 * 由伺服器決定要問哪一項（見 stream.post.ts 的 guidanceField），這裡只負責備好
 * 各項的可選值。
 *
 * 每一項都限縮成「目前結果裡真的有政策標記該值」的選項。以「長照」為例，11 筆政策
 * 的年齡標記只有老人與成人，一筆嬰幼兒或兒少都沒有——那時候還把四個年齡全列出來，
 * 點「嬰幼兒」只會篩出「沒有年齡限制」的那幾筆，看起來有縮小其實是假的。
 *
 * 這些鈕不是聊天回合——點了是去改上方對應的篩選並重新搜尋，讓使用者看見畫面被改了。
 */
/**
 * 目前生效的限縮條件，給摘要卡在頂端列成一排可移除的標籤。
 *
 * 上方搜尋區雖然也有這些條件，但使用者在看摘要時那一區已經捲出畫面了。
 * 在摘要卡再列一次，才看得出自己收斂到哪裡，也才能一鍵退回上一個範圍。
 */
const summaryActiveFilters = computed(() => {
  const chips: Array<{ field: string; label: string; value: string }> = [];
  const push = (field: string, label: string, value: string) => {
    if (value) chips.push({ field, label, value });
  };

  push("policy", "類別", isAllPolicyValue(activeSummaryState.policy) ? "" : activePolicyLabel.value);
  push("area", "地區", isAllAreaValue(activeSummaryState.area) ? "" : activeAreaLabel.value);
  push("recipient", "年齡", activeRecipientLabel.value);
  push("income", "經濟條件", activeIncomeLabel.value);
  push("identity", "特殊身分", activeIdentityLabel.value);
  return chips;
});

/**
 * 選了特定縣市、但相符的多半是全國性政策時的說明。
 *
 * 後端的地區篩選是「該縣市 或 中央」，所以全國性政策本來就會一起出現——縣市民
 * 同樣能申請。但畫面上完全看不出這件事，使用者會以為「我選了台北市，怎麼都是全國」。
 * 不動排序（全國那幾筆通常才是真正相關的），改成把結果組成講明白。
 */
const summaryResultBreakdown = computed(() => {
  if (isAllAreaValue(activeSummaryState.area)) return "";
  if (isLoading.value || storageiFarePolicyList.length === 0) return "";

  const areaLabel = activeAreaLabel.value;
  if (!areaLabel || areaLabel === ALL_AREA_VALUE) return "";

  const local = storageiFarePolicyList.filter(
    (item) => item.area && item.area !== ALL_AREA_VALUE
  ).length;
  const nationwide = storageiFarePolicyList.length - local;
  if (nationwide === 0) return "";

  return `符合的 ${storageiFarePolicyList.length} 筆中，${areaLabel}在地 ${local} 筆、全國性 ${nationwide} 筆 — 全國性政策設籍${areaLabel}同樣可以申請。`;
});

function clearSummaryFilter(field: string) {
  if (field === "policy") codeSelect_policy.value = ALL_POLICY_VALUE;
  else if (field === "area") codeSelectArea.value = ALL_AREA_VALUE;
  else if (field === "recipient") SwitchRecipient("reset");
  else if (field === "income") SwitchIncome("reset");
  else if (field === "identity") SwitchIdentity("reset");
  else return;

  Search();
}

/** 結果少於這個數量才去算「放寬條件」建議，避免每次搜尋都多打好幾次 API */
const RELAX_SUGGESTION_THRESHOLD = 3;

/**
 * 條件收得太緊、幾乎沒東西可推薦時，算出「拿掉哪一項會有幾筆」。
 *
 * 筆數是真的去查回來的，不是估的也不是 AI 猜的——這種時候給錯數字比不給更糟。
 * 只在結果很少時才觸發，平常搜尋不會多打 API。
 */
const relaxSuggestions = ref<
  Array<{ field: string; label: string; value: string; count: number }>
>([]);
let relaxSuggestionRequestId = 0;

async function refreshRelaxSuggestions() {
  const requestId = ++relaxSuggestionRequestId;
  const current = storageiFarePolicyList.length;
  const chips = summaryActiveFilters.value;

  // 連線失敗那一輪的 0 筆不是「條件收太緊」，這時再去算放寬建議只會多打幾次
  // 一樣會失敗的 API，還可能讓使用者以為問題出在自己的篩選條件上。
  if (searchFailed.value || current > RELAX_SUGGESTION_THRESHOLD || chips.length === 0) {
    relaxSuggestions.value = [];
    return;
  }

  const results = await Promise.all(
    chips.map(async (chip) => {
      try {
        const responses = await Promise.all(
          buildFarePolicyApiQueries(undefined, chip.field).map((query) =>
            $WebApiGet("/FarePolicy/GetIFarePolicyList", query)
          )
        );
        const ids = new Set<string>();
        responses.forEach((response) => {
          getPolicyResponseItems(response).forEach((item: any) => {
            const id = String(item?.id ?? item?.ID ?? "");
            if (id) ids.add(id);
          });
        });
        return { ...chip, count: ids.size };
      } catch {
        return { ...chip, count: -1 };
      }
    })
  );

  if (requestId !== relaxSuggestionRequestId) return;
  relaxSuggestions.value = results
    .filter((item) => item.count > current)
    .sort((a, b) => b.count - a.count);
}

const summaryQuickOptions = computed<Record<string, Array<{ name: string; val: string }>>>(() => {
  if (isLoading.value || storageiFarePolicyList.length === 0) return {};

  const toOptions = (list: Array<selectItem>, keep?: (item: selectItem) => boolean) =>
    list
      .filter((item) => (keep ? keep(item) : true))
      .map((item) => ({ name: item.name, val: String(item.val) }));

  const presentCategories = new Set(
    storageiFarePolicyList.map((item) => item.policyCategory).filter(Boolean)
  );
  const presentAreas = new Set(
    storageiFarePolicyList.map((item) => item.area).filter(Boolean)
  );
  const presentIn = (
    key: "recipientNames" | "incomeNames" | "identityNames",
    name: string
  ) => storageiFarePolicyList.some((item) => item[key]?.includes(name));

  return {
    policy: toOptions(
      policySelectList,
      (item) => !isAllPolicyValue(item.val) && presentCategories.has(item.name)
    ),
    area: toOptions(
      areaSelectList,
      (item) => item.val !== ALL_AREA_VALUE && presentAreas.has(item.name)
    ),
    recipient: toOptions(recipientSelectList, (item) => presentIn("recipientNames", item.name)),
    income: toOptions(incomeSelectList, (item) => presentIn("incomeNames", item.name)),
    identity: toOptions(identitySelectList, (item) => presentIn("identityNames", item.name)),
  };
});

function applySummaryQuickOption(payload: { field: string; val: string }) {
  const { field, val } = payload;
  if (!val) return;

  if (field === "policy") {
    if (codeSelect_policy.value === val) return;
    codeSelect_policy.value = val;
  } else if (field === "area") {
    if (codeSelectArea.value === val) return;
    codeSelectArea.value = val;
  } else if (field === "recipient") {
    if (codeSelectRecipient.value === val) return;
    SwitchRecipient(val);
  } else if (field === "income") {
    if (codeSelectIncomes.value.includes(val)) return;
    SwitchIncome(val);
  } else if (field === "identity") {
    if (codeSelectIdentity.value.includes(val)) return;
    SwitchIdentity(val);
  } else {
    return;
  }

  Search();
}

/**
 * 條件標籤對到站上篩選器實際存在的選項。
 *
 * 一定要先找完全相同的：包含式比對會讓「低收入戶」先命中「中低收入戶」
 * （選單順序是經濟弱勢、中低收入戶、低收入戶），套下去就變成套錯條件。
 * 找不到完全相同的才退回包含式，讓「兒童」還是能對到「兒童＆青少年」。
 */
function findFilterOption(list: Array<selectItem>, label: string) {
  if (!label) return null;
  const wanted = normalizeFilterLabel(label);
  return (
    list.find((item) => normalizeFilterLabel(item.name) === wanted)
    || list.find((item) => matchFilterLabel(item.name, label))
    || null
  );
}

/**
 * 追問問到目前條件以外的範圍（「台北市也有可以申請嗎」），就去查那個範圍在本站有幾筆。
 *
 * 站上明明有台北市的政策，卻因為條件鎖在台東縣、候選政策裡一筆台北市的都沒有，
 * 回答只能說「站內資料未載明」——對訪客來說跟「本站沒有」沒兩樣，是最糟的答案。
 * 這裡把真實筆數查回來，讓回答說得出實話，也讓卡片能給一個直接切過去的按鈕。
 * 筆數是查回來的，不是估的也不是 AI 猜的。
 */
async function probeSummaryScopeShift(userText: string) {
  const explicit = extractExplicitSearchConditions(userText);
  const candidates: Array<{ field: string; label: string; value: string; val: string }> = [];

  const areaOption = findFilterOption(areaSelectList, explicit.area);
  if (areaOption && String(areaOption.val) !== String(codeSelectArea.value)) {
    candidates.push({ field: "area", label: "地區", value: areaOption.name, val: String(areaOption.val) });
  }
  const recipientOption = findFilterOption(recipientSelectList, explicit.recipient);
  if (recipientOption && String(recipientOption.val) !== String(codeSelectRecipient.value)) {
    candidates.push({ field: "recipient", label: "年齡", value: recipientOption.name, val: String(recipientOption.val) });
  }
  const incomeOption = findFilterOption(incomeSelectList, explicit.income);
  if (incomeOption && !codeSelectIncomes.value.includes(String(incomeOption.val))) {
    candidates.push({ field: "income", label: "經濟條件", value: incomeOption.name, val: String(incomeOption.val) });
  }
  for (const identity of explicit.identities) {
    const option = findFilterOption(identitySelectList, identity);
    if (option && !codeSelectIdentity.value.includes(String(option.val))) {
      candidates.push({ field: "identity", label: "身分", value: option.name, val: String(option.val) });
      break;
    }
  }
  // 政策類別放最後。它的關鍵字表比較寬，「低收入戶可以嗎」也會被判成社會救助，
  // 但那句話真正提到的是經濟條件——前面幾項先命中時就該用前面那個。
  const policyOption = findFilterOption(policySelectList, matchPolicyCategory(userText));
  if (
    policyOption
    && !isAllPolicyValue(policyOption.val)
    && String(policyOption.val) !== String(codeSelect_policy.value)
  ) {
    candidates.push({ field: "policy", label: "政策類別", value: policyOption.name, val: String(policyOption.val) });
  }

  const target = candidates[0];
  if (!target) return null;

  try {
    const responses = await Promise.all(
      buildFarePolicyApiQueries(undefined, "", { field: target.field, val: target.val }).map((query) =>
        $WebApiGet("/FarePolicy/GetIFarePolicyList", query)
      )
    );
    const ids = new Set<string>();
    responses.forEach((response) => {
      getPolicyResponseItems(response).forEach((item: any) => {
        const id = String(item?.id ?? item?.ID ?? "");
        if (id) ids.add(id);
      });
    });
    if (ids.size === 0) return null;
    return { ...target, count: ids.size };
  } catch (error) {
    console.warn("[iFare][scope-probe]", error);
    return null;
  }
}

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

/**
 * 重新整理清空之後，這一輪不要自動捲畫面。
 *
 * 沒有摘要卡時 pinFirstResultViewport 會把畫面捲到第一筆政策，於是使用者按完
 * 重新整理，看到的還是一片政策清單——欄位其實已經清空了，但畫面跟剛剛長得一樣，
 * 只會覺得「按了沒反應」。清空那一輪要停在最上面，讓乾淨的搜尋表單真的出現。
 */
let skipViewportPinOnce = false;

function pinSummaryViewport() {
  if (!process.client) return;
  clearSummaryPinTimers();
  if (skipViewportPinOnce || !hasSummaryCard.value) return;
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

/**
 * 捲回頁面最上面，並在 120 / 420ms 再補兩次。
 *
 * 只捲一次沒用：瀏覽器的捲軸還原與結果渲染都在後面才發生，會把畫面again 拉回去。
 * 這裡沿用本頁 pin 系列函式對付同一個問題的做法。
 */
function pinPageTopViewport() {
  if (!process.client) return;
  clearResultPinTimers();
  const toTop = () => window.scrollTo({ top: 0, behavior: "auto" });
  toTop();
  resultPinTimers = [120, 420, 900].map((delay) => window.setTimeout(toTop, delay));
}

function pinFirstResultViewport() {
  if (!process.client) return;
  if (skipViewportPinOnce) {
    skipViewportPinOnce = false;
    // 清空那一輪：結果渲染完才捲回最上面，才蓋得掉瀏覽器的捲軸還原
    pinPageTopViewport();
    return;
  }
  if (hasSummaryCard.value || storageiFarePolicyList.length === 0) return;
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

// 篩選選單的選項全部來自 /Code/GetCode*，而 $WebApiGet 失敗只回 null，
// 五個載入器又都是「拿不到就 return」，選單於是靜靜地渲染成空的。
// 實測擋掉這幾支：搜尋照常回 52 筆，但受助者情況下拉 0 個選項、年齡四顆按鈕
// 整組消失，畫面上連一句提示都沒有——使用者只會覺得「這個網站不能篩」。
const filterOptionsFailed = ref(false);

// 這幾份清單本來就有預設項（全部／全國），重載時要留著
const FILTER_OPTION_BASE_LENGTHS = {
  policy: policySelectList.length,
  area: areaSelectList.length,
  recipient: recipientSelectList.length,
  income: incomeSelectList.length,
  identity: identitySelectList.length,
};

/** 走 Detailed 版本才分得出「這個選單真的沒選項」與「根本沒連上」 */
async function loadCodeList(path: string) {
  const { data, error } = await $WebApiGetDetailed(path);
  if (error || !data?.result?.result) {
    filterOptionsFailed.value = true;
    return null;
  }
  return data;
}

// Code Policy
function loadPolicyOptions() {
  return loadCodeList("/Code/GetCodePolicyList").then((res: any) => {
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
}
let codePolicy = loadPolicyOptions();

// Code area
function loadAreaOptions() {
  return loadCodeList("/Code/GetCodeDomicileList").then((res: any) => {
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
}
let codeArea = loadAreaOptions();

// Code recipient
function loadRecipientOptions() {
  return loadCodeList("/Code/GetCodeRecipientList").then((res: any) => {
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
  });
}
let codeRecipient = loadRecipientOptions().then(() => {
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
function loadIncomeOptions() {
  return loadCodeList("/Code/GetCodeIncomeList").then((res: any) => {
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
}
let codeIncome = loadIncomeOptions();

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
function loadIdentityOptions() {
  return loadCodeList("/Code/GetCodeIdentityList").then((res: any) => {
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
}
let codeIdentity = loadIdentityOptions();

/**
 * 重新載入篩選選項：清回預設項再重抓一次。
 * 不用整頁重新整理，因為那會被當成「使用者按了重新整理」而清掉搜尋條件。
 * 重抓後要把使用者原本選的年齡重新標回去——清單是重建的，isActive 會掉。
 */
function ReloadFilterOptions() {
  filterOptionsFailed.value = false;
  policySelectList.splice(FILTER_OPTION_BASE_LENGTHS.policy);
  areaSelectList.splice(FILTER_OPTION_BASE_LENGTHS.area);
  recipientSelectList.splice(FILTER_OPTION_BASE_LENGTHS.recipient);
  incomeSelectList.splice(FILTER_OPTION_BASE_LENGTHS.income);
  identitySelectList.splice(FILTER_OPTION_BASE_LENGTHS.identity);

  codePolicy = loadPolicyOptions();
  codeArea = loadAreaOptions();
  codeRecipient = loadRecipientOptions().then(() => {
    recipientSelectList.forEach((item) => {
      item.isActive = item.val === codeSelectRecipient.value;
    });
  });
  codeIncome = loadIncomeOptions();
  codeIdentity = loadIdentityOptions();
}

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

/**
 * 連線失敗後的重試：直接重跑同一組條件，不動網址也不重整頁面。
 * 後端主機連線不穩通常撐不了幾秒，讓使用者按一下就好，不必自己再組一次條件。
 */
function RetrySearch() {
  if (isLoading.value) return;
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
  /** 政策類別名稱（畫面上的「受助者情況」下拉）；用來算出還值得問哪幾類 */
  policyCategory: string;
  /** 這筆政策實際標記的年齡／經濟／身分名稱，用來決定快捷鈕要列哪些選項 */
  recipientNames: string[];
  incomeNames: string[];
  identityNames: string[];
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

/** 一路查詢的結果：ok 為 false 代表這次請求根本沒回來，不是查到 0 筆 */
type PolicySearchOutcome = { ok: boolean; response: any };

/**
 * 政策搜尋改走 Detailed 版本，才知道「沒有資料」是查不到還是連不上。
 *
 * $WebApiGet 把錯誤吞在外掛裡、一律回 null（見 plugins/WebAPI.ts），呼叫端看到的
 * 永遠是空清單；Detailed 版本會一併回傳 error，這裡只是把它翻成 ok 旗標，
 * 讓 Promise.all 底下每一路的成敗都留得下來。
 */
async function requestPolicyList(query: Record<string, any>): Promise<PolicySearchOutcome> {
  const { data, error } = await $WebApiGetDetailed("/FarePolicy/GetIFarePolicyList", query);
  return { ok: !error, response: data };
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
  // 先拿掉縣市名（地區已經是篩選條件，留著只會讓每一筆都命中標題的【新北市】），
  // 再把訪客用語換成站內政策實際使用的詞（孩童 → 兒童）。
  const normalizedQuery = buildRelevanceQuery(query).normalize("NFKC").toLowerCase().trim();
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
  /** 這次查詢有沒有「具體詞」可比對。沒有的話客戶端評分等於雜訊，要讓位給後端相關性 */
  hasSpecificTerms: boolean;
};

function getPolicyKeywordMatchMetrics(item: any, query: string): PolicyKeywordMatchMetrics {
  const terms = getPolicySearchTerms(query);
  if (terms.length === 0) {
    return {
      exactLevel: 0,
      specificCoverage: 0,
      hasSpecificTerms: false,
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
    hasSpecificTerms: specificTerms.length > 0,
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
    isLocal: boolean;
    bestOriginalRank: number;
    firstOrder: number;
  }>();
  let firstOrder = 0;
  // 使用者選定的縣市，用於相關性同分時的排序（沒選特定縣市時為空字串）
  const localAreaName = isAllAreaValue(codeSelectArea.value)
    ? ""
    : getSelectedLabel(areaSelectList, codeSelectArea.value, "");

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
        isLocal:
          Boolean(localAreaName) &&
          String(item?.codeDomicile_LabelName ?? "") === localAreaName,
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
      // 只有在查詢真的含具體詞時，客戶端比對才有判斷力。像「孩童補助」這種
      // 只剩下泛用詞的查詢，這串比較會被「標題含補助」之類的雜訊主導，
      // 反而蓋掉後端 BM25 算好的相關性——那種情況直接讓位給下面的 RRF 分數。
      if (a.keywordMatch.hasSpecificTerms || b.keywordMatch.hasSpecificTerms) {
        const originalComparisons = [
          b.keywordMatch.exactLevel - a.keywordMatch.exactLevel,
          b.keywordMatch.specificCoverage - a.keywordMatch.specificCoverage,
          b.keywordMatch.specificTitleMatches - a.keywordMatch.specificTitleMatches,
          b.keywordMatch.matchedSpecificTerms - a.keywordMatch.matchedSpecificTerms,
          b.keywordMatch.score - a.keywordMatch.score,
        ];
        const originalDiff = originalComparisons.find(diff => Math.abs(diff) > Number.EPSILON);
        if (originalDiff !== undefined) return originalDiff;
      } else {
        // 沒有具體詞（例如只搜「長照」）時不做上面那幾層細分，但仍要用整體關鍵字分數
        // 區分「內文到底有沒有提到這個主題」——否則下面的在地優先會把完全沒提到長照的
        // 在地政策推到最前面（台北市的長照在地政策就是這種情況）。
        const rawDiff = b.keywordMatch.score - a.keywordMatch.score;
        if (Math.abs(rawDiff) > Number.EPSILON) return rawDiff;
      }

      if (a.aiMatch.hasSpecificTerms || b.aiMatch.hasSpecificTerms) {
        const aiComparisons = [
          b.aiMatch.exactLevel - a.aiMatch.exactLevel,
          b.aiMatch.specificCoverage - a.aiMatch.specificCoverage,
          b.aiMatch.score - a.aiMatch.score,
        ];
        const aiDiff = aiComparisons.find(diff => Math.abs(diff) > Number.EPSILON);
        if (aiDiff !== undefined) return aiDiff;
      }

      // 相關性打平時，使用者選的縣市優先於「哪一路查詢先撈到」這種順序性因素。
      // 實測「長照＋高雄市」11 筆有 10 筆同分，不這樣排的話在地政策會全被擠到後面。
      const localDiff = (b.isLocal ? 1 : 0) - (a.isLocal ? 1 : 0);
      if (localDiff !== 0) return localDiff;

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
  // 按重新整理＝重新開始：把欄位、摘要與問答全部清掉，讓使用者從乾淨的表單重查。
  // 只認 reload；分享連結與從政策明細按上一頁回來都會保留原本的條件。
  if (consumeReloadNavigation()) {
    ResetParam();
    clearIFareSummaryCaches();
    void $router.replace({ query: {} });
    // 瀏覽器會還原重整前的捲軸位置，畫面會停在政策清單中間——欄位明明已經清空，
    // 看到的卻跟剛剛一樣。擋掉這一輪自動捲到結果的行為，改成捲回最上面
    // （實際的捲動在結果渲染完後才做，見 pinFirstResultViewport）。
    skipViewportPinOnce = true;
    window.scrollTo({ top: 0, behavior: "auto" });
  }
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

/** 篩選選項標籤正規化：容忍「＆、及、和」與繁簡寫差異 */
function normalizeFilterLabel(value: string) {
  return String(value || "")
    .replace(/臺/gu, "台")
    .replace(/[＆&及和\s　]/gu, "");
}

/** 篩選選項標籤比對（包含式）：「兒童」要能對到「兒童＆青少年」 */
function matchFilterLabel(optionName: string, target: string) {
  const option = normalizeFilterLabel(optionName);
  const wanted = normalizeFilterLabel(target);
  if (!option || !wanted) return false;
  return option === wanted || option.includes(wanted) || wanted.includes(option);
}

/**
 * 把意圖解析出的條件自動套進篩選器。
 * 原則：戶籍地沿用既有行為（明確地名可切換）；年齡／經濟／身分只在
 * 「使用者尚未自行選擇」時才自動帶入，絕不覆蓋使用者手動設定的條件。
 */
async function applyResolvedSearchFilters(intent: ResolvedPolicySearchIntent) {
  // 地區要跟年齡、經濟、身分一樣守門：使用者自己選過就不能被意圖解析覆蓋。
  // 少了這一道，打關鍵字時解析回來的縣市會蓋掉使用者選的那個，連網址一起改寫，
  // 而且畫面上完全沒有跡象——實測開 ?area=20（台東縣）再加關鍵字「長照」會變成
  // 台中市、加「孩童補助」會變成桃園市，分享出去的連結也會被改掉。
  let changed = isAllAreaValue(codeSelectArea.value)
    ? await applyResolvedSearchArea(intent.area)
    : false;

  if (intent.recipient && !codeSelectRecipient.value) {
    await codeRecipient.catch(() => undefined);
    const item = findFilterOption(recipientSelectList, intent.recipient);
    if (item) {
      SwitchRecipient(item.val);
      activeSummaryState.recipient = codeSelectRecipient.value;
      changed = true;
    }
  }

  if (intent.income && codeSelectIncomes.value.length === 0) {
    await codeIncome.catch(() => undefined);
    const item = findFilterOption(incomeSelectList, intent.income);
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
      const item = findFilterOption(identitySelectList, label);
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
  if (unique.length < 2) return [];
  // 地區已經套進 CodeDomicile，就不要再把縣市名單獨查一次：
  // 「新北市 孩童補助」若單獨查「新北市」，會命中所有標題含【新北市】的政策，
  // 把主題詞擠掉。完整原句仍以較高權重查詢，所以不會漏。
  return unique.filter((item) => !isAreaOnlySegment(item));
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
      policyCategory: item.codePolicy_LabelName ?? "",
      recipientNames: getPolicyCodeNameList(recipientList),
      incomeNames: getPolicyCodeNameList(item.codeIncomeList),
      identityNames: getPolicyCodeNameList(item.codeIdentityList),
    };
  });
}

/** 取出後端回傳的代碼名稱清單（用於判斷結果集裡真的出現過哪些選項） */
function getPolicyCodeNameList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry: any) => String(entry?.codeName ?? entry?.CodeName ?? "").trim())
    .filter(Boolean);
}

// 放在 storageiFarePolicyList 宣告之後：watch 會立刻執行一次 getter，
// 寫在宣告之前會踩到 TDZ，整個 script setup 會直接拋錯。
watch(
  () => [isLoading.value, storageiFarePolicyList.length] as const,
  ([loading]) => {
    if (loading) return;
    void refreshRelaxSuggestions();
  }
);

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

  // 沒打關鍵字時 originalQuery 是「已選條件」組出來的描述詞（見 conditionSummaryQuery）：
  // 當意圖解析與排序的主題沒問題，但不能當成送進 API 的關鍵字——
  // 那些字使用者從沒打過，拿去比對政策內文只會把純靠篩選撈到的結果無故砍掉。
  const typedQuery = normalizeSummaryKeyword(activeSummaryState.query || searchQuery.value);
  const originalQueries = buildFarePolicyApiQueries(typedQuery);
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
  // 上一輪失敗留下的錯誤畫面在這裡收掉，重試才看得出真的重新查了
  searchFailed.value = false;
  pinSummaryViewport();
  const originalQuery = normalizeSummaryKeyword(searchQuery.value);
  const prefetchedOriginalQueries = buildFarePolicyApiQueries(originalQuery);
  const prefetchedOriginalResponse = Promise.all(
    prefetchedOriginalQueries.map((query) => requestPolicyList(query))
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
    ? Promise.all(originalQueries.map((query) => requestPolicyList(query)))
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
  // 處境描述（「我爸爸中風了沒辦法自己吃飯洗澡」）打不中站內用語——政策寫的是失能、
  // 長期照顧、無法自理。補過詞的查詢另外查一次，權重低於字面命中，只負責在字面
  // 幾乎查不到時把對的政策撈進來。
  const situationQuery = expandSituationVocabulary(originalQuery);
  const situationPlans: PolicySearchRequestPlan[] = situationQuery !== originalQuery
    ? buildFarePolicyApiQueries(situationQuery).map((query) => ({
        query,
        source: "ai" as const,
        weight: 0.35,
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
    const extraPlans = [...segmentPlans, ...aiPlans, ...situationPlans];
    const [originalOutcomes, extraOutcomes] = await Promise.all([
      originalResponsePromise,
      Promise.all(extraPlans.map((plan) => requestPolicyList(plan.query))),
    ]);
    if (requestId !== policySearchRequestId) return;

    // 只留查成功的那幾路。mergeRankedPolicySearchResults 是靠索引把 responses 對回
    // plans 的，兩邊必須同進同退，否則權重會套到別路查詢的結果上。
    const allOutcomes = [...originalOutcomes, ...extraOutcomes];
    const allPlans = [...requestPlans, ...extraPlans];
    const plans: PolicySearchRequestPlan[] = [];
    const responses: any[] = [];
    allOutcomes.forEach((outcome, index) => {
      if (!outcome.ok) return;
      plans.push(allPlans[index]);
      responses.push(outcome.response);
    });

    // 有任何一路回來就照常出結果——合併機制本來就容許只拿到部分查詢計畫。
    // 一路都沒回來才是連線失敗，這時候寧可什麼都不顯示，也不要留下 0 筆的假結論。
    searchFailed.value = allOutcomes.length > 0 && responses.length === 0;
    if (searchFailed.value) return;

    const responseItems = responses.flatMap(getPolicyResponseItems);
    const rawItems = originalQuery
      // 排序也要看得到補上的站內用語，否則撈回來的長照政策全部算 0 分
      ? mergeRankedPolicySearchResults(
          plans,
          responses,
          originalQuery,
          expandSituationVocabulary(resolvedQuery, originalQuery)
        )
      : sortPolicyResultsByNewest(responseItems);
    const _data = getUniquePolicySearchResults(rawItems);
    const _newsList = mapPolicySearchItems(_data);
    replacePolicySearchItems(_newsList);
  } finally {
    if (requestId !== policySearchRequestId) return;
    isLoading.value = false;
    summaryTriggerKey.value += 1;
    if (hasSummaryCard.value) {
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

/* 連線失敗的說明沿用 .result-loading 的版位（同樣的內距與上分隔線），
   換頁面不會跳動，也一眼看得出是取代結果清單的那一塊 */
.card-filter-failed {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px 14px;
  margin-top: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  background: rgba(214, 62, 20, 0.06);
}

.card-filter-failed-text {
  margin: 0;
  color: #a8391a;
  font-size: 14px;
}

.card-filter-failed-retry {
  padding: 6px 16px;
  font-size: 14px;
}

.result-failed {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 32px 48px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.result-failed-text {
  margin: 0;
  color: rgba(0, 0, 0, 0.75);
  font-size: 18px;
  font-weight: 600;
  line-height: 32px;
}

.result-failed-note {
  margin: 0;
  color: rgba(0, 0, 0, 0.5);
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
}

.result-failed-retry {
  margin-top: 4px;
  padding: 10px 28px;
  border: 0;
  border-radius: 999px;
  background: #c26f0c;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  line-height: 20px;
  cursor: pointer;
}

.result-failed-retry:hover {
  background: #a85f08;
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

  .result-failed {
    padding: 24px 24px 24px 44px;
  }
}
</style>
