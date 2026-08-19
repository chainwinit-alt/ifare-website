<template>
  <section class="ifare-summary-card" :data-provider="selectedProvider">
    <div class="summary-head">
      <div class="summary-head-copy">
        <span class="summary-kicker">AI 快速摘要</span>
        <h3 class="summary-title">關鍵字狀況判斷</h3>
      </div>

      <div class="summary-tools">
        <!-- 供應商切換是開發時用的，維持關閉 -->
        <!-- <div class="provider-switch">
          <button
            v-for="option in providerOptions"
            :key="option.value"
            type="button"
            class="provider-pill"
            :class="{ active: selectedProvider === option.value }"
            @click="setProvider(option.value)"
          >
            {{ option.label }}
          </button>
        </div> -->
        <!--
          摘要存在 sessionStorage（30 分鐘），重新整理只會撈回同一份，不會重跑。
          想換一份就按這顆：清掉快取重新產生，之前的問答也一起收掉——
          摘要都換了，那些問答已經不對應現在這一份。
        -->
        <button
          class="summary-retry"
          type="button"
          :disabled="isSummaryBusy"
          @click="regenerateSummary"
        >
          {{ isSummaryBusy ? "判斷中" : "重新摘要" }}
        </button>
      </div>
    </div>

    <!-- 目前生效的限縮條件。上方搜尋區看摘要時已捲出畫面，這裡再列一次並可一鍵移除 -->
    <div v-if="activeFilters.length" class="summary-active-filters">
      <span class="summary-active-filters-label">目前條件</span>
      <button
        v-for="chip in activeFilters"
        :key="chip.field"
        type="button"
        class="summary-active-chip"
        :aria-label="`移除${chip.label}條件：${chip.value}`"
        @click="emit('clearFilter', chip.field)"
      >
        <span class="summary-active-chip-key">{{ chip.label }}</span>
        <span class="summary-active-chip-value">{{ chip.value }}</span>
        <span class="summary-active-chip-x" aria-hidden="true">×</span>
      </button>
    </div>

    <!-- 選了縣市時，說明結果裡有多少是全國性政策（那些縣市民同樣能申請） -->
    <p v-if="resultBreakdown" class="summary-result-breakdown">{{ resultBreakdown }}</p>
    <div class="summary-body">
      <div v-if="shouldShowSummaryLoading" class="summary-loading">
        <span class="summary-spinner" aria-hidden="true"></span>
        <p class="summary-loading-text">{{ summaryLoadingText }}</p>
      </div>

      <template v-else>
        <div v-if="summaryHtml" class="summary-markdown" v-html="summaryHtml"></div>
        <div v-else class="summary-empty">
          <p class="summary-text">{{ fallbackText }}</p>
        </div>
      </template>

      <div v-if="isSummaryBusy" class="summary-cursor">▍</div>
      <p v-if="streamError" class="summary-error">{{ streamError }}</p>
    </div>

    <!-- 條件收太緊時，直接告訴使用者放寬哪一項會有多少筆（筆數是真的查回來的） -->
    <div v-if="relaxSuggestions.length" class="summary-relax">
      <p class="summary-relax-label" id="ifare-summary-relax-label">
        符合的政策很少，放寬其中一項會多出不少：
      </p>
      <div class="summary-relax-list" role="group" aria-labelledby="ifare-summary-relax-label">
        <button
          v-for="item in relaxSuggestions"
          :key="item.field"
          type="button"
          class="summary-relax-chip"
          @click="emit('clearFilter', item.field)"
        >
          <span>拿掉「{{ item.label }}：{{ item.value }}」</span>
          <strong>{{ item.count }} 筆</strong>
        </button>
      </div>
    </div>

    <!-- 快捷鈕：內容跟著結尾問句走。點了是去改上方對應的篩選並重新搜尋，不是聊天回合 -->
    <div v-if="showQuickOptions" class="summary-policy-options">
      <p class="summary-policy-label" id="ifare-summary-policy-label">{{ activeQuickOptionLabel }}</p>
      <div class="summary-policy-list" role="group" aria-labelledby="ifare-summary-policy-label">
        <button
          v-for="option in activeQuickOptions"
          :key="option.val"
          type="button"
          class="summary-policy-chip"
          @click="emit('selectQuickOption', { field: guidanceField, val: option.val })"
        >{{ option.name }}</button>
      </div>
    </div>

    <div v-if="canContinueConversation" class="summary-conversation">
      <!--
        對話由上往下長：您說的在上、AI 的回答緊接在下面。
        只有「問問題」的回答會留在這裡；補條件的回合改的是上方那份摘要，
        不會同時在下面再講一次，免得一張卡出現兩份互相打架的內容。
      -->
      <div v-if="threadItems.length || isFollowUpLoading" class="summary-message-list" aria-live="polite">
        <template v-for="(item, index) in threadItems" :key="`thread-${index}`">
          <div v-if="item.role === 'user'" class="summary-message is-user">
            <span class="summary-message-label">您說</span>
            <p>{{ item.content }}</p>
          </div>
          <div v-else class="summary-answer">
            <span class="summary-answer-label">AI 回覆</span>
            <div class="summary-markdown" v-html="renderThreadAnswer(item.content)"></div>
            <!-- 回答說「改成台北市就看得到」時，直接給一顆按鈕，不用自己回上面改篩選 -->
            <div v-if="item.action" class="summary-answer-action">
              <button
                type="button"
                class="summary-policy-chip"
                @click="emit('selectQuickOption', { field: item.action.field, val: item.action.val })"
              >
                改看{{ item.action.label }}：{{ item.action.value }}
                <strong>{{ item.action.count }} 筆</strong>
              </button>
            </div>
          </div>
        </template>
        <p v-if="isFollowUpLoading" class="summary-message-pending">{{ followUpPendingText }}</p>
      </div>

      <form class="summary-followup-form" @submit.prevent="submitFollowUp">
        <label class="summary-followup-label" for="ifare-summary-followup">回覆或提問</label>
        <div class="summary-followup-controls">
          <input
            id="ifare-summary-followup"
            v-model="followUpInput"
            type="text"
            maxlength="120"
            autocomplete="off"
            placeholder="回覆上面的問題，或直接問我（例如：要準備什麼文件？）"
            :disabled="isFollowUpLoading"
          />
          <button type="submit" :disabled="!canSubmitFollowUp">
            {{ isFollowUpLoading ? "整理中" : "送出" }}
          </button>
        </div>
        <p v-if="followUpError" class="summary-followup-error">
          {{ followUpError }}
          <!-- 失敗時您那句話還留在對話串上，重試不用自己再打一次 -->
          <button
            v-if="failedFollowUpText"
            type="button"
            class="summary-followup-retry"
            @click="retryFollowUp"
          >重試</button>
        </p>
      </form>
    </div>

    <div v-if="actualReferenceCases.length" class="summary-references">
      <div class="reference-head">
        <span class="reference-label">摘要引用政策</span>
      </div>
      <div class="reference-card-list">
        <NuxtLink
          v-for="item in actualReferenceCases"
          :key="item.id"
          class="reference-card-link"
          :to="buildCaseLink(item.id)"
        >
          <article class="top-case-card reference-case-card">
            <div class="top-case-rank">0{{ item.referenceNo }}</div>
            <div class="top-case-copy">
              <h4 class="top-case-title">{{ item.title }}</h4>
              <div class="top-case-bottom">
                <p class="top-case-area">{{ item.area }}</p>
                <div class="top-case-flags">
                  <span :class="{ active: item.hasRecipient }">受補助對象</span>
                  <span :class="{ active: item.hasIncome }">收入資格</span>
                  <span :class="{ active: item.hasIndentity }">身分類別</span>
                </div>
              </div>
            </div>
          </article>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  buildFallbackIntentSummary,
  buildRelevanceQuery,
  isFollowUpQuestion,
  normalizeFallbackIntentTopic,
} from "~/utils/ifareIntent";
import { IFARE_SUMMARY_CACHE_PREFIX } from "~/utils/ifareSummaryCache";

type SummaryCaseItem = {
  id: number;
  title: string;
  area: string;
  qualification: string;
  hasRecipient: boolean;
  hasIncome: boolean;
  hasIndentity: boolean;
  welfareInfo?: string;
  evidence?: string;
  officeUnitInfo?: string;
  officeUnitTel?: string;
  competentAuthority?: string;
  remark?: string;
  sourceSummary?: string;
};

type ProviderName = "groq";

type RankedSummaryCaseItem = SummaryCaseItem & {
  similarityScore: number;
  rank: number;
  scorePercent: number;
};

type ReferencedCaseItem = RankedSummaryCaseItem & {
  referenceNo: number;
  originalReferenceNo: number;
};

type SummarySearchContext = {
  policy?: string;
  recipient?: string;
  area?: string;
  income?: string;
  identity?: string;
  query?: string;
};

type SummaryConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

/** 追問問到目前條件以外的範圍時，頁面查回來的「換過去會有幾筆」 */
type SummaryScopeShift = {
  field: string;
  label: string;
  value: string;
  val: string;
  count: number;
};

type SummaryConversationSearchResult = {
  query: string;
  cases: SummaryCaseItem[];
};

type SummaryConversationSearch = (payload: {
  query: string;
  conversation: SummaryConversationMessage[];
}) => Promise<SummaryConversationSearchResult>;

type SummaryQuickOption = { name: string; val: string };

// 快捷鈕的標題要跟著問的條件走，不然會出現「問句問戶籍地、按鈕卻給類別」那種不一致。
const QUICK_OPTION_LABELS: Record<string, string> = {
  policy: "選一個方向，馬上縮小範圍",
  area: "選一個縣市，馬上縮小範圍",
  recipient: "選一個年齡區間，馬上縮小範圍",
  income: "選一個經濟條件，馬上縮小範圍",
  identity: "選一個身分，馬上縮小範圍",
};

type SummaryActiveFilter = { field: string; label: string; value: string };
type SummaryRelaxSuggestion = SummaryActiveFilter & { count: number };

const emit = defineEmits<{
  summaryComplete: [payload: { summary: string; provider: ProviderName }];
  selectQuickOption: [payload: { field: string; val: string }];
  clearFilter: [field: string];
}>();

const props = withDefaults(
  defineProps<{
    query?: string;
    cases: SummaryCaseItem[];
    provider?: ProviderName;
    resultsLoading?: boolean;
    searchContext?: SummarySearchContext;
    summaryTriggerKey?: number;
    summaryCacheKey?: string;
    summaryResetKey?: number;
    conversationSearch?: SummaryConversationSearch;
    /** 追問提到別的範圍時，去查那個範圍在本站有幾筆（查不到或沒提到就回 null） */
    conversationScopeProbe?: (userText: string) => Promise<SummaryScopeShift | null>;
    /** 各條件可選的快捷選項，key 是 policy / area / recipient / income / identity */
    quickOptions?: Record<string, SummaryQuickOption[]>;
    /** 目前生效的限縮條件，顯示在摘要卡頂端 */
    activeFilters?: SummaryActiveFilter[];
    /** 選了縣市時的結果組成說明（在地幾筆、全國性幾筆） */
    resultBreakdown?: string;
    /** 條件收太緊時的「放寬哪一項會有幾筆」建議 */
    relaxSuggestions?: SummaryRelaxSuggestion[];
  }>(),
  {
    query: "",
    quickOptions: () => ({}),
    activeFilters: () => [],
    resultBreakdown: "",
    relaxSuggestions: () => [],
    provider: "groq",
    resultsLoading: false,
    searchContext: () => ({}),
    summaryTriggerKey: 0,
    summaryCacheKey: "",
    summaryResetKey: 0,
  }
);

const { $llm } = useNuxtApp();
const selectedProvider = ref<ProviderName>("groq");
const isLoading = ref(false);
const streamError = ref("");
const summaryText = ref("");
const activeController = shallowRef<AbortController | null>(null);
const conversationMessages = ref<SummaryConversationMessage[]>([]);
const followUpInput = ref("");
const followUpDraft = ref("");
const followUpError = ref("");
// 送出失敗時保留那句話，讓使用者按一下就能重送，不用自己再打一次
const failedFollowUpText = ref("");
const isFollowUpLoading = ref(false);
const followUpController = shallowRef<AbortController | null>(null);
const conversationSearchQuery = ref("");
let requestId = 0;
let followUpRequestId = 0;

const hasKeyword = computed(() => Boolean(normalizeSummaryKeyword(props.query)));
const isSummaryBusy = computed(() => props.resultsLoading || isLoading.value);
const shouldShowSummaryLoading = computed(() => {
  return props.resultsLoading || (isLoading.value && !summaryText.value.trim());
});
const summaryLoadingText = computed(() => {
  if (props.resultsLoading) {
    return "AI摘要判斷中...";
  }

  return "AI 正在整理判斷結果...";
});
const canContinueConversation = computed(
  () => hasKeyword.value && !isSummaryBusy.value && Boolean(summaryDisplayText.value.trim())
);
const canSubmitFollowUp = computed(
  () => Boolean(followUpInput.value.trim()) && !isFollowUpLoading.value
);
// 追問可以是「補充條件」也可以是「問問題」，兩件事等待中要講的話不一樣：
// 補條件是重寫摘要，問問題是去翻政策明細找答案。
const isAnswerTurn = ref(false);
const followUpPendingText = computed(() =>
  isAnswerTurn.value ? "正在翻找政策內容，為您回答…" : "正在依照您的補充重新整理摘要…"
);
// 伺服器算出的「這輪在問哪一項條件」。快捷鈕只呈現對應那一項的選項，
// 判斷邏輯不在前端重算，否則兩邊會各自算出不同答案。
const guidanceField = ref("");
const activeQuickOptions = computed<SummaryQuickOption[]>(
  () => (guidanceField.value && props.quickOptions[guidanceField.value]) || []
);
const activeQuickOptionLabel = computed(
  () => QUICK_OPTION_LABELS[guidanceField.value] || "選一個條件，馬上縮小範圍"
);
// 追問回覆會直接更新摘要，所以快捷鈕在對話開始之後仍然該留著——
// 它問的是下一個還沒回答的條件，跟輸入框是同一條路的兩種走法。
const showQuickOptions = computed(
  () => activeQuickOptions.value.length > 0
    && !isSummaryBusy.value
    && !isFollowUpLoading.value
    && Boolean(summaryDisplayText.value.trim())
);
// 卡片下半部的對話串。問問題的回合會把「您說」與「AI 回覆」依序往下接，
// 補條件的回合則是改上方那份摘要，只留下這次說的那句話。
type SummaryThreadItem = {
  role: "user" | "assistant";
  content: string;
  /** 回答裡提到「改成台北市就看得到」時，附一顆直接切過去的按鈕 */
  action?: SummaryScopeShift;
};
const threadItems = ref<SummaryThreadItem[]>([]);
// v40：引導階梯新增「政策類別」這一階、追問回合改成主題明確時給推薦，
// 舊快取的結尾問句與模式都不一樣，必須整批失效。
// v42：摘要提示詞新增「全國性政策設籍該縣市同樣適用」的說明規則
// v43：福利內容欄位改成先解 percent-encoding 再送進模型，摘要內容會不一樣
const SUMMARY_CACHE_VERSION = "v43-decoded-welfare-info";
const SUMMARY_CACHE_KEY_PREFIX = IFARE_SUMMARY_CACHE_PREFIX;
const SUMMARY_CACHE_TTL_MS = 30 * 60 * 1000;

const providerOptions: Array<{ value: ProviderName; label: string }> = [
  { value: "groq", label: "Groq" },
];

const referenceTokenPattern = /\[參考\s*(\d+)\]/g;
// 模型偶爾把引用寫成 [參考 1, 參考 2, 參考 3]（每個編號都再寫一次「參考」）。
// 舊樣式只收數字與逗號，遇到這種寫法整串會以原文顯示在畫面上，所以改成
// 先抓出整段引用，再從裡面把編號撈出來。
// 中間不准出現換行或另一個 [：否則遇到落單的左括號會從那裡一路吃到下一個
// [參考 N]，把中間整個段落標題與列點吞掉。
const groupedReferenceTokenPattern = /\[[^\[\]\n]*參考[^\[\]\n]*\]/g;

function normalizeText(value: string) {
  return (value || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^\p{Script=Han}a-z0-9]/giu, "");
}

function splitQueryTokens(query: string) {
  const normalized = normalizeText(query);
  if (!normalized) return [];

  const tokens = new Set<string>();
  const segments = normalized.match(/[\p{Script=Han}]+|[a-z0-9]+/giu) ?? [];

  for (const segment of segments) {
    if (/^[\p{Script=Han}]+$/u.test(segment)) {
      if (segment.length <= 2) {
        tokens.add(segment);
        continue;
      }

      for (let i = 0; i < segment.length - 1; i++) {
        tokens.add(segment.slice(i, i + 2));
      }
      tokens.add(segment);
      continue;
    }

    tokens.add(segment);
  }

  return Array.from(tokens);
}

/**
 * localArea：使用者選定的縣市名（沒選特定縣市時傳空字串）。
 *
 * 只用在「相關性完全同分」時的排序依據。實測「長照＋高雄市＋老人」11 筆裡有 10 筆
 * 同分，這時誰排前面純粹看後端回傳順序，結果在地政策全被擠到後面。同分時優先在地
 * 才符合「我選了高雄市」的期待；分數有差距時（例如台北市的長照在地政策根本沒提到
 * 長照）仍然由相關性決定，不會把不相關的東西推上來。
 */
function rankCases(
  query: string,
  cases: SummaryCaseItem[],
  localArea = ""
): RankedSummaryCaseItem[] {
  const tokens = splitQueryTokens(query);
  const normalizedQuery = normalizeText(query);
  const localAreaText = normalizeText(localArea);

  const ranked = cases
    .map((item) => {
      const titleText = item.title || "";
      const areaText = item.area || "";
      const qualificationText = item.qualification || "";
      const title = normalizeText(titleText);
      const area = normalizeText(areaText);
      const qualification = normalizeText(qualificationText);
      const welfareInfo = normalizeText(item.welfareInfo || "");
      const evidence = normalizeText(item.evidence || "");
      const sourceSummary = normalizeText(item.sourceSummary || "");
      const remark = normalizeText(item.remark || "");
      const authority = normalizeText(item.competentAuthority || item.officeUnitInfo || "");
      const combined = `${title}${area}${qualification}${welfareInfo}${evidence}${sourceSummary}${remark}${authority}`;
      const fieldWeights = [
        [title, 16],
        [area, 5],
        [qualification, 10],
        [sourceSummary, 18],
        [welfareInfo, 14],
        [evidence, 12],
        [remark, 10],
        [authority, 8],
      ] as const;

      let score = 0;
      let matchedTokenCount = 0;

      if (tokens.length) {
        for (const token of tokens) {
          let tokenMatched = false;
          for (const [field, weight] of fieldWeights) {
            if (!field) continue;
            if (field.includes(token)) {
              score += weight;
              tokenMatched = true;
            }
          }

          if (tokenMatched) matchedTokenCount += 1;
        }

        if (normalizedQuery && combined.includes(normalizedQuery)) {
          score += 24;
        }

        score += matchedTokenCount * 4;

        if (matchedTokenCount > 0) {
          score += (item.hasRecipient ? 2 : 0) + (item.hasIncome ? 1 : 0) + (item.hasIndentity ? 1 : 0);
        } else {
          score += (item.hasRecipient ? 0.2 : 0) + (item.hasIncome ? 0.15 : 0) + (item.hasIndentity ? 0.15 : 0);
        }

        if (isOverSpecificCaseForIntent(item, query)) {
          score -= 80;
        }
      } else {
        score =
          (item.hasRecipient ? 6 : 0) +
          (item.hasIncome ? 4 : 0) +
          (item.hasIndentity ? 4 : 0) +
          Math.min(qualificationText.length / 60, 5);
      }

      return {
        ...item,
        similarityScore: Math.round(score * 10) / 10,
        isLocalArea: Boolean(localAreaText) && area === localAreaText,
        rank: 0,
        scorePercent: 0,
      };
    })
    .sort((a, b) => {
      const scoreDiff = b.similarityScore - a.similarityScore;
      if (Math.abs(scoreDiff) > Number.EPSILON) return scoreDiff;
      // 相關性同分才比在地，所以不會壓過相關性
      return (b.isLocalArea ? 1 : 0) - (a.isLocalArea ? 1 : 0);
    });

  const maxScore = ranked[0]?.similarityScore || 0;

  return ranked.map((item, index) => ({
    ...item,
    rank: index + 1,
    scorePercent: maxScore > 0 ? Math.max(12, Math.round((item.similarityScore / maxScore) * 100)) : 0,
  }));
}

function normalizeSummaryKeyword(value?: string) {
  const keyword = String(value ?? "").trim();
  if (!keyword || /^(?:未指定|undefined|null)$/iu.test(keyword)) return "";
  return keyword;
}

function cleanContextValue(value?: string) {
  const text = (value || "").trim();
  if (!text || text === "未指定") return "";
  return text;
}

function isDefaultContextValue(value: string, defaults: string[]) {
  return defaults.includes(value.trim());
}

function hasContextValue(value: string | undefined, defaults: string[] = []) {
  const text = cleanContextValue(value);
  return Boolean(text && !isDefaultContextValue(text, defaults));
}

function buildProvidedContextText() {
  const context = props.searchContext || {};
  const parts: string[] = [];

  if (hasContextValue(context.policy, ["全部"])) {
    parts.push(`受助者情況「${cleanContextValue(context.policy)}」`);
  }
  if (hasContextValue(context.recipient, ["全部"])) {
    parts.push(`年齡區間「${cleanContextValue(context.recipient)}」`);
  }
  if (hasContextValue(context.area, ["全國", "全部"])) {
    parts.push(`戶籍地「${cleanContextValue(context.area)}」`);
  }
  if (hasContextValue(context.income, ["全部"])) {
    parts.push(`經濟條件「${cleanContextValue(context.income)}」`);
  }
  if (hasContextValue(context.identity, ["全部"])) {
    parts.push(`特殊身分「${cleanContextValue(context.identity)}」`);
  }

  return parts.join("、");
}

function buildMissingContextText() {
  const context = props.searchContext || {};
  const missing: string[] = [];

  if (!hasContextValue(context.policy, ["全部"])) missing.push("受助者情況");
  if (!hasContextValue(context.recipient, ["全部"])) missing.push("年齡區間");
  if (!hasContextValue(context.area, ["全國", "全部"])) missing.push("戶籍地");
  if (!hasContextValue(context.income, ["全部"])) missing.push("經濟條件");
  if (!hasContextValue(context.identity, ["全部"])) missing.push("特殊身分");

  return missing.join("、");
}

function joinNaturalList(values: string[]) {
  if (values.length <= 1) return values[0] || "";
  return `${values.slice(0, -1).join("、")}及${values[values.length - 1]}`;
}

function normalizeIdentityContext(value?: string) {
  const parts = cleanContextValue(value)
    .split(/[、,，/]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const specificParts = parts.filter((item) => !["無", "不限", "全部"].includes(item));

  if (specificParts.length) return specificParts.join("、");
  if (parts.includes("無")) return "無特殊身分";
  return parts.join("、");
}

function buildCompactContextText() {
  const context = props.searchContext || {};
  const values: string[] = [];

  if (hasContextValue(context.policy, ["全部"])) values.push(cleanContextValue(context.policy));
  if (hasContextValue(context.recipient, ["全部"])) values.push(cleanContextValue(context.recipient));
  if (hasContextValue(context.area, ["全國", "全部"])) values.push(cleanContextValue(context.area));
  if (hasContextValue(context.income, ["全部"])) values.push(cleanContextValue(context.income));
  if (hasContextValue(context.identity, ["全部"])) {
    const identity = normalizeIdentityContext(context.identity);
    if (identity) values.push(identity);
  }

  return joinNaturalList([...new Set(values)]);
}

function buildRankQuery() {
  const conversationQuery = normalizeSummaryKeyword(conversationSearchQuery.value);
  const keyword = normalizeSummaryKeyword(props.searchContext?.query);
  const query = normalizeSummaryKeyword(props.query);
  // 地區是獨立的篩選條件；留在排序關鍵字裡會讓每一筆都因為標題的【新北市】而命中，
  // 引用政策就會排出一堆跟主題無關的東西。順便把訪客用語換成站內用詞。
  return buildRelevanceQuery(conversationQuery || keyword || query);
}

const overSpecificSummaryGuards: Array<{ allowedBy: RegExp; blockedInSummary: RegExp }> = [
  {
    allowedBy: /牙|假牙|口腔|牙科|齒/u,
    blockedInSummary: /牙|假牙|口腔|牙科|齒/u,
  },
  {
    allowedBy: /托育|幼兒|兒童|青少年|兒少|育兒|生育|早療/u,
    blockedInSummary: /托育|幼兒|兒童|青少年|兒少|育兒|生育|早療/u,
  },
];

function buildIntentSource() {
  return [
    buildRankQuery(),
    props.searchContext?.query,
  ]
    .filter(Boolean)
    .join(" ");
}

function buildCaseIntentText(item: SummaryCaseItem) {
  return [
    item.title,
    item.area,
    item.qualification,
    item.welfareInfo,
    item.evidence,
    item.sourceSummary,
    item.remark,
    item.competentAuthority,
    item.officeUnitInfo,
  ]
    .filter(Boolean)
    .join(" ");
}

function isOverSpecificCaseForIntent(item: SummaryCaseItem, intent: string) {
  const normalizedIntent = normalizeText(intent || "");
  const normalizedCase = normalizeText(buildCaseIntentText(item));

  return overSpecificSummaryGuards.some((guard) => {
    return !guard.allowedBy.test(normalizedIntent) && guard.blockedInSummary.test(normalizedCase);
  });
}

const rankQuery = computed(() => buildRankQuery());
// 這次搜尋使用者到底有沒有自己打關鍵字。沒有的話 props.query 是頁面用已選條件組出來的
// 描述詞（見 result.vue 的 conditionSummaryQuery），對它做字面比對沒有意義。
const hasTypedKeyword = computed(() =>
  Boolean(normalizeSummaryKeyword(props.searchContext?.query))
);
// 選了特定縣市時才傳；「全國」「未指定」代表沒有在地偏好
const localAreaName = computed(() => {
  const area = String(props.searchContext?.area || "").trim();
  return area === "全國" || area === "未指定" ? "" : area;
});
const rankedCases = computed(() =>
  rankCases(rankQuery.value, props.cases, localAreaName.value)
);
const fallbackText = computed(() => {
  if (!hasKeyword.value) return "";

  const queryText = buildRankQuery();
  return buildFallbackIntentSummary(queryText);
});

const summaryDisplayText = computed(() => {
  if (summaryText.value.trim()) return summaryText.value.trim();
  return fallbackText.value;
});

function escapeHtml(value: string) {
  return (value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** 追問對話的種子訊息要用純文字：把總覽的 Markdown 標記與引用符號拆掉 */
function toPlainSummaryText(value: string) {
  return (value || "")
    .replace(/^(?:#{1,6}\s+)+/gm, "")
    .replace(/^\s*(?:[-*+]|\d+[.)])\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\[[^\[\]\n]*參考[^\[\]\n]*\]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 400);
}

function buildCaseLink(id: number) {
  return {
    path: "/ifare/info",
    query: { id: String(id), reload: String(id) },
  };
}

function normalizeReferenceNotation(text: string) {
  groupedReferenceTokenPattern.lastIndex = 0;
  return (text || "").replace(groupedReferenceTokenPattern, (token) => {
    const refNumbers = (token.match(/\d+/g) || [])
      .map((item) => Number(item))
      .filter((value) => Number.isInteger(value) && value > 0);

    if (!refNumbers.length) return token;
    return refNumbers.map((value) => `[參考 ${value}]`).join("");
  });
}

function applyInlineMarkdown(text: string) {
  const escaped = escapeHtml(normalizeReferenceNotation(text || ""));

  referenceTokenPattern.lastIndex = 0;
  const withReferences = escaped.replace(referenceTokenPattern, (_token, refNoText) => {
    const referenceNo = Number(refNoText);
    const item = referenceCaseByNo.value.get(referenceNo);
    // 模型標到不存在的編號時整顆引用移除，不留 [參考 N] 原文干擾閱讀
    if (!item) return "";

    const href = `/ifare/info?id=${encodeURIComponent(String(item.id))}&reload=${encodeURIComponent(String(item.id))}`;
    return `<a class="summary-inline-reference" href="${href}" title="${escapeHtml(item.title)}">參考 ${item.referenceNo}</a>`;
  });

  const withLinks = withReferences.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
    (_match, label, url) =>
      `<a class="summary-inline-link" href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`
  );

  const withStrong = withLinks.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  const withEm = withStrong.replace(/(^|[^*])\*(?!\s)(.+?)(?!\s)\*(?!\*)/g, "$1<em>$2</em>");
  return withEm.replace(/`([^`]+)`/g, "<code>$1</code>");
}

function renderMarkdown(text: string) {
  const source = normalizeReferenceNotation((text || "").replace(/\r\n?/g, "\n")).trim();
  if (!source) return "";

  const blocks: string[] = [];
  const lines = source.split("\n");
  let paragraph: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(`<p>${paragraph.join("<br>")}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (!listType || !listItems.length) {
      listType = null;
      listItems = [];
      return;
    }

    blocks.push(`<${listType}>${listItems.join("")}</${listType}>`);
    listType = null;
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const unordered = line.match(/^[-*+]\s+(.*)$/);
    const ordered = line.match(/^\d+[.)]\s+(.*)$/);

    if (unordered || ordered) {
      flushParagraph();
      const nextType: "ul" | "ol" = unordered ? "ul" : "ol";
      if (listType && listType !== nextType) {
        flushList();
      }
      listType = nextType;
      const match = unordered || ordered;
      const itemText = applyInlineMarkdown(match[1]);
      listItems.push(`<li>${itemText}</li>`);
      continue;
    }

    const heading = line.match(/^#{1,6}\s+(.*)$/);
    if (heading) {
      flushParagraph();
      flushList();
      // 模型偶爾會寫成「### ### 站內相符的福利」，多出來的記號要拆掉，
      // 不然標題會連 ### 一起顯示出來。已經存進快取的舊內容也靠這一步救回來。
      const headingText = heading[1].replace(/^(?:#{1,6}\s*)+/u, "");
      blocks.push(`<h4 class="summary-section-title">${applyInlineMarkdown(headingText)}</h4>`);
      continue;
    }

    flushList();
    paragraph.push(applyInlineMarkdown(line));
  }

  flushParagraph();
  flushList();

  if (!blocks.length) {
    return `<p>${applyInlineMarkdown(source)}</p>`;
  }

  return blocks.join("");
}

const referenceCases = computed<ReferencedCaseItem[]>(() => {
  const usedPolicyKeys = new Set<string>();

  return rankedCases.value
    // 純篩選搜尋的結果集本來就是篩選器選出來的，這時再用字面比對砍掉零分政策，
    // 會讓明明有結果的搜尋送出空的 cases，被伺服器判成站內查無政策而走一般知識總覽。
    .filter((item) => !rankQuery.value || !hasTypedKeyword.value || item.similarityScore > 0)
    .filter((item) => !isOverSpecificCaseForIntent(item, buildIntentSource()))
    .filter((item) => {
      const key = `${normalizeText(item.title)}:${normalizeText(item.area)}`;
      if (usedPolicyKeys.has(key)) return false;
      usedPolicyKeys.add(key);
      return true;
    })
    .slice(0, 3)
    .map((item, index) => ({
      ...item,
      referenceNo: index + 1,
      originalReferenceNo: item.rank,
    }));
});

const actualReferenceCases = computed(() => {
  if (props.resultsLoading || !hasKeyword.value) return [];
  return referenceCases.value;
});

// [參考 N] 的 N 對應送給後端 prompt 的「政策 N」編號，
// 也就是 referenceCases 的排列順序（referenceNo），不是全清單的名次。
const referenceCaseByNo = computed(() => {
  return new Map(referenceCases.value.map((item) => [item.referenceNo, item]));
});

const summaryHtml = computed(() => {
  return useSanitize(renderMarkdown(summaryDisplayText.value));
});

/** 對話串裡的回答走同一套 Markdown 渲染，[參考 N] 一樣會變成政策連結 */
function renderThreadAnswer(text: string) {
  return useSanitize(renderMarkdown(text));
}

function buildSummaryCacheKey() {
  return `${SUMMARY_CACHE_KEY_PREFIX}${JSON.stringify({
    version: SUMMARY_CACHE_VERSION,
    provider: selectedProvider.value,
    searchKey: props.summaryCacheKey || normalizeSummaryKeyword(props.query),
  })}`;
}

/** 從 sessionStorage 讀回來的東西不能直接信，形狀不對就整批丟掉 */
function sanitizeCachedThread(value: unknown): SummaryThreadItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item: any) =>
      item
      && (item.role === "user" || item.role === "assistant")
      && typeof item.content === "string"
      && item.content
    )
    .slice(-8)
    .map((item: any) => ({
      role: item.role,
      content: item.content,
      ...(item.action && typeof item.action.field === "string" && typeof item.action.val === "string"
        ? { action: item.action as SummaryScopeShift }
        : {}),
    }));
}

function sanitizeCachedConversation(value: unknown): SummaryConversationMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item: any) =>
      item
      && (item.role === "user" || item.role === "assistant")
      && typeof item.content === "string"
      && item.content
    )
    .slice(-8)
    .map((item: any) => ({ role: item.role, content: item.content }));
}

function readSummaryCache() {
  if (!process.client) return null;

  const raw = sessionStorage.getItem(buildSummaryCacheKey());
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as {
      savedAt?: number;
      summary?: string;
      guidanceField?: string;
      thread?: unknown;
      conversation?: unknown;
    };

    if (!parsed?.savedAt || Date.now() - parsed.savedAt > SUMMARY_CACHE_TTL_MS) {
      sessionStorage.removeItem(buildSummaryCacheKey());
      return null;
    }

    if (typeof parsed.summary !== "string" || !parsed.summary) return null;
    // guidanceField 也要一起存：走快取時不會有 meta 事件，沒存的話快捷鈕就消失了
    return {
      summary: parsed.summary,
      guidanceField: parsed.guidanceField || "",
      thread: sanitizeCachedThread(parsed.thread),
      conversation: sanitizeCachedConversation(parsed.conversation),
    };
  } catch {
    sessionStorage.removeItem(buildSummaryCacheKey());
    return null;
  }
}

/**
 * 摘要與那一輪的問答一起存。
 *
 * 快取 key 是依篩選條件算的，所以換條件就是另一筆，不會互相汙染；
 * sessionStorage 又是單一分頁的，也不會影響到別人。這樣重新整理才不會
 * 把使用者問過的東西整批弄丟——那是最容易讓人以為「頁面壞了」的地方。
 */
function writeSummaryCache(summary: string) {
  if (!process.client || !summary) return;

  sessionStorage.setItem(
    buildSummaryCacheKey(),
    JSON.stringify({
      savedAt: Date.now(),
      summary,
      guidanceField: guidanceField.value,
      thread: threadItems.value,
      conversation: conversationMessages.value,
    })
  );
}

function clearSummaryCache() {
  if (!process.client) return;
  sessionStorage.removeItem(buildSummaryCacheKey());
}

function restoreCachedSummary() {
  const cached = readSummaryCache();
  if (!cached) return false;

  summaryText.value = cached.summary;
  guidanceField.value = cached.guidanceField;
  threadItems.value = cached.thread;
  conversationMessages.value = cached.conversation;
  streamError.value = "";
  isLoading.value = false;
  return true;
}

/** 使用者主動要一份新的摘要：清快取重跑，舊的問答一起收掉 */
function regenerateSummary() {
  if (isSummaryBusy.value) return;
  clearSummaryCache();
  resetFollowUpConversation();
  void loadSummary(true);
}

function emitSummaryComplete() {
  emit("summaryComplete", {
    summary: summaryText.value,
    provider: selectedProvider.value,
  });
}

async function loadSummary(forceRefresh = false) {
  if (!hasKeyword.value) {
    activeController.value?.abort();
    resetFollowUpConversation();
    isLoading.value = false;
    streamError.value = "";
    summaryText.value = "";
    return;
  }

  if (!forceRefresh) {
    if (restoreCachedSummary()) {
      emitSummaryComplete();
      return;
    }
  }

  const currentRequestId = ++requestId;
  activeController.value?.abort();
  const controller = new AbortController();
  activeController.value = controller;
  isLoading.value = true;
  streamError.value = "";
  summaryText.value = "";
  let completedByStream = false;

  try {
    await $llm.streamSummarizeCases({
      // 按了「重新摘要」就連伺服器端那層快取也一起跳過，不然會拿回一模一樣的字
      refresh: forceRefresh,
      query: normalizeSummaryKeyword(props.query),
      context: props.searchContext,
      cases: referenceCases.value,
      provider: selectedProvider.value,
      signal: controller.signal,
      onChunk: (_delta, fullText) => {
        if (currentRequestId !== requestId) return;
        summaryText.value = fullText;
      },
      onMeta: (meta) => {
        if (currentRequestId !== requestId) return;
        if (meta?.guidanceField !== undefined) guidanceField.value = meta.guidanceField || "";
        console.log("[IFareSummaryCard][llm-meta]", meta);
      },
    });
    completedByStream = true;
  } catch (error: any) {
    if (currentRequestId !== requestId) return;
    console.warn("[IFareSummaryCard][llm]", error);
    streamError.value = "AI 判斷暫時忙碌，已切換成本地判斷。";
    if (!summaryText.value.trim()) {
      summaryText.value = fallbackText.value;
    }
  } finally {
    if (currentRequestId !== requestId) return;
    isLoading.value = false;
    activeController.value = null;
    if (!summaryText.value.trim()) {
      summaryText.value = fallbackText.value;
    }
    writeSummaryCache(summaryText.value);
    if (completedByStream) {
      emitSummaryComplete();
    }
  }
}

function resetFollowUpConversation() {
  followUpRequestId += 1;
  followUpController.value?.abort();
  followUpController.value = null;
  conversationMessages.value = [];
  threadItems.value = [];
  followUpInput.value = "";
  followUpDraft.value = "";
  followUpError.value = "";
  failedFollowUpText.value = "";
  conversationSearchQuery.value = "";
  isAnswerTurn.value = false;
  // 新的搜尋會重新算引導問題，先清掉舊的，避免短暫顯示上一輪的快捷鈕
  guidanceField.value = "";
  isFollowUpLoading.value = false;
}

async function submitFollowUp() {
  const userReply = followUpInput.value.trim().slice(0, 120);
  if (!userReply || isFollowUpLoading.value) return;

  const currentRequestId = ++followUpRequestId;
  followUpController.value?.abort();
  const controller = new AbortController();
  followUpController.value = controller;
  // 第一次追問時，把目前這份摘要當成對話的開頭；之後它已經在紀錄裡，不必再補一次
  if (conversationMessages.value.length === 0) {
    conversationMessages.value.push({
      role: "assistant",
      content: toPlainSummaryText(summaryDisplayText.value),
    });
  }
  conversationMessages.value.push({ role: "user", content: userReply });
  threadItems.value.push({ role: "user", content: userReply });
  isAnswerTurn.value = isFollowUpQuestion(userReply);
  followUpInput.value = "";
  followUpDraft.value = "";
  followUpError.value = "";
  failedFollowUpText.value = "";
  isFollowUpLoading.value = true;

  const conversation: SummaryConversationMessage[] = conversationMessages.value.slice(-8);
  // 回覆要放哪裡由伺服器回報的 mode 決定，不在前端重算一次——
  // 兩邊各算一次就會出現「前端當成回答、後端其實只回了一句引導」的錯位。
  let replyMode = "";
  let scopeShift: SummaryScopeShift | null = null;

  try {
    // 問問題的回合不重新搜尋。您問的是畫面上這幾筆政策，重搜會換掉引用的政策卡，
    // 上方那份摘要的 [參考 N] 就會指到別筆去。補條件才需要重新搜尋。
    // 順帶省下一次意圖解析與數次政策查詢，回答也快得多。
    if (props.conversationSearch && !isAnswerTurn.value) {
      const searchResult = await props.conversationSearch({
        query: normalizeSummaryKeyword(props.query),
        conversation,
      });
      if (currentRequestId !== followUpRequestId) return;
      conversationSearchQuery.value = normalizeSummaryKeyword(searchResult?.query);
      await nextTick();
    }

    // 「台北市也有可以申請嗎」這種問題問的是目前條件以外的範圍。候選政策裡一筆
    // 台北市的都沒有，硬答只會答出「站內資料未載明」——但本站其實有。先把那個
    // 範圍的真實筆數查回來，回答才講得出實話，也才給得出可以直接切過去的按鈕。
    if (isAnswerTurn.value && props.conversationScopeProbe) {
      scopeShift = await props.conversationScopeProbe(userReply);
      if (currentRequestId !== followUpRequestId) return;
    }

    await $llm.streamSummarizeCases({
      query: conversationSearchQuery.value || normalizeSummaryKeyword(props.query),
      context: props.searchContext,
      cases: referenceCases.value,
      conversation,
      scopeHint: scopeShift
        ? {
            field: scopeShift.field,
            label: scopeShift.label,
            value: scopeShift.value,
            count: scopeShift.count,
          }
        : null,
      provider: selectedProvider.value,
      signal: controller.signal,
      onChunk: (_delta, fullText) => {
        if (currentRequestId !== followUpRequestId) return;
        followUpDraft.value = fullText;
      },
      onMeta: (meta) => {
        if (currentRequestId !== followUpRequestId) return;
        if (meta?.mode) replyMode = String(meta.mode);
        // answer 回合不動上方摘要，那份摘要結尾的引導問題還在，
        // 對應的快捷鈕就不能跟著被清掉。
        if (meta?.mode !== "answer" && meta?.guidanceField !== undefined) {
          guidanceField.value = meta.guidanceField || "";
        }
      },
    });

    if (currentRequestId !== followUpRequestId) return;
    const reply = followUpDraft.value.trim();
    if (reply) {
      conversationMessages.value.push({ role: "assistant", content: reply });
      conversationMessages.value = conversationMessages.value.slice(-8);
      if (replyMode === "answer") {
        // 問題的答案接在您那句話下面，由上往下讀才順；上方摘要不動，
        // 因為這一輪沒有改變搜尋條件，那份總覽仍然成立。
        threadItems.value.push({
          role: "assistant",
          content: reply,
          ...(scopeShift ? { action: scopeShift } : {}),
        });
        threadItems.value = threadItems.value.slice(-8);
      } else {
        // 補條件的回覆本身就是「更新後的摘要」：直接取代上面那份。
        // 政策集跟著換了，舊的問答不再對應現在的結果，只留這次說的那句話。
        // 不寫進快取——快取 key 是依篩選條件算的，而追問並不會改篩選條件。
        summaryText.value = reply;
        threadItems.value = threadItems.value.slice(-1);
      }
    } else {
      followUpError.value = "目前暫時無法繼續整理，請稍後再試。";
      failedFollowUpText.value = userReply;
    }
  } catch (error: any) {
    if (currentRequestId !== followUpRequestId || error?.name === "AbortError") return;
    console.warn("[IFareSummaryCard][follow-up]", error);
    followUpError.value = "目前暫時無法繼續整理，請稍後再試。";
    failedFollowUpText.value = userReply;
  } finally {
    if (currentRequestId !== followUpRequestId) return;
    followUpDraft.value = "";
    isFollowUpLoading.value = false;
    followUpController.value = null;
    // 摘要與對話串一起寫回快取，重新整理才接得下去
    writeSummaryCache(summaryText.value);
  }
}

/** 重送上一句沒收到回覆的話。先把那顆孤零零的泡泡收回來，避免對話串出現兩句一樣的 */
function retryFollowUp() {
  const text = failedFollowUpText.value;
  if (!text || isFollowUpLoading.value) return;

  if (threadItems.value[threadItems.value.length - 1]?.role === "user") {
    threadItems.value.pop();
  }
  if (conversationMessages.value[conversationMessages.value.length - 1]?.role === "user") {
    conversationMessages.value.pop();
  }
  followUpError.value = "";
  failedFollowUpText.value = "";
  followUpInput.value = text;
  submitFollowUp();
}

function setProvider(provider: ProviderName) {
  if (selectedProvider.value === provider) return;
  selectedProvider.value = provider;
  loadSummary(true);
}

watch(
  () => [props.summaryTriggerKey],
  () => {
    resetFollowUpConversation();
    if (!hasKeyword.value) {
      activeController.value?.abort();
      summaryText.value = "";
      streamError.value = "";
      isLoading.value = false;
      return;
    }

    loadSummary();
  },
  { flush: "post" }
);

watch(
  () => props.summaryResetKey,
  () => {
    activeController.value?.abort();
    resetFollowUpConversation();
    summaryText.value = "";
    streamError.value = "";
    isLoading.value = true;
  }
);

watch(
  () => props.provider,
  () => {
    selectedProvider.value = "groq";
  }
);

watch(selectedProvider, (nextProvider) => {
  if (process.client) {
    localStorage.setItem("ifare-summary-provider", nextProvider);
  }
});

onMounted(() => {
  if (!process.client) return;
  const savedProvider = localStorage.getItem("ifare-summary-provider") as ProviderName | null;
  if (savedProvider && providerOptions.some((item) => item.value === savedProvider)) {
    selectedProvider.value = savedProvider;
  }
  restoreCachedSummary();
});

onBeforeUnmount(() => {
  activeController.value?.abort();
  followUpController.value?.abort();
});
</script>

<style scoped lang="scss">
.ifare-summary-card {
  margin-bottom: 24px;
  padding: 24px;
  border-radius: 28px;
  border: 1px solid rgba(255, 176, 88, 0.32);
  background:
    radial-gradient(circle at top right, rgba(255, 197, 120, 0.26), transparent 28%),
    linear-gradient(135deg, rgba(255, 249, 240, 0.98), rgba(255, 244, 222, 0.92));
  box-shadow: 0 24px 56px rgba(92, 64, 20, 0.13);
  position: relative;
  overflow: hidden;
}

.ifare-summary-card::after {
  content: "";
  position: absolute;
  inset: auto -10% -20% auto;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 193, 105, 0.22), transparent 68%);
  pointer-events: none;
}

.summary-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.summary-head {
  align-items: flex-start;
}

.summary-head-copy {
  max-width: 560px;
}

.summary-kicker {
  display: inline-block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: #b96a06;
}

.summary-title {
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
  color: #1f190f;
}

.summary-tools {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.provider-switch {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(96, 67, 26, 0.12);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
  align-self: center;
}

.provider-pill {
  min-width: 72px;
  padding: 9px 14px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  color: #73592f;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    color 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.provider-pill:hover {
  background: rgba(194, 111, 12, 0.08);
  color: #4d391f;
}

.provider-pill.active {
  background: linear-gradient(135deg, #1f190f, #4d391f);
  border-color: rgba(28, 22, 15, 0.2);
  color: #fff;
  box-shadow: 0 10px 22px rgba(28, 22, 15, 0.14);
}

.provider-pill:active {
  transform: translateY(1px);
}

.summary-retry {
  min-width: 96px;
  padding: 10px 14px;
  border: 0;
  border-radius: 999px;
  background: linear-gradient(135deg, #1c160f, #47321f);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  align-self: center;
}

.summary-retry:disabled {
  cursor: wait;
  opacity: 0.7;
}

.top-case-card {
  display: flex;
  gap: 14px;
  align-items: stretch;
  padding: 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(96, 67, 26, 0.1);
  box-shadow: 0 12px 24px rgba(92, 64, 20, 0.08);
}

.top-case-rank {
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: linear-gradient(135deg, #2a2118, #7f5b2f);
  color: #fff;
  font-size: 12px;
  font-weight: 800;
}

.top-case-copy {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.top-case-bottom {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.top-case-title {
  margin: 0;
  font-size: 16px;
  line-height: 1.5;
  color: #1d160f;
}

.top-case-area {
  margin: 0;
  font-size: 13px;
  color: #8c6b3b;
}

.top-case-flags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.top-case-flags span {
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(239, 229, 214, 0.8);
  color: #92744b;
  font-size: 12px;
}

.top-case-flags span.active {
  background: rgba(194, 111, 12, 0.14);
  color: #ad6500;
}

.summary-body {
  padding: 18px 2px 8px;
}

.summary-loading {
  display: grid;
  justify-items: start;
  gap: 10px;
  min-height: 104px;
}

.summary-spinner {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 3px solid rgba(194, 111, 12, 0.18);
  border-top-color: #b26000;
  animation: spin 0.9s linear infinite;
}

.summary-loading-text {
  margin: 0;
  color: #7b5b2e;
  font-size: 14px;
  font-weight: 700;
}

.summary-markdown {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-markdown :deep(p),
.summary-text {
  margin: 0;
  font-size: 16px;
  line-height: 1.85;
  color: #2e2619;
}

.summary-markdown :deep(ul),
.summary-markdown :deep(ol) {
  margin: 0;
  padding-left: 1.25rem;
  display: grid;
  gap: 8px;
}

.summary-markdown :deep(li) {
  line-height: 1.8;
  color: #2e2619;
}

.summary-markdown :deep(strong) {
  color: #1d160f;
  font-weight: 800;
}

.summary-markdown :deep(h4.summary-section-title) {
  margin: 10px 0 0;
  padding-top: 4px;
  font-size: 18px;
  line-height: 1.4;
  font-weight: 800;
  color: #1d160f;
}

/* 摘要各區塊依序淡入，模擬搜尋引擎 AI 摘要逐段浮現的效果 */
.summary-markdown :deep(> *) {
  animation: summary-block-in 0.5s ease both;
}

.summary-markdown :deep(> *:nth-child(2)) { animation-delay: 0.1s; }
.summary-markdown :deep(> *:nth-child(3)) { animation-delay: 0.2s; }
.summary-markdown :deep(> *:nth-child(4)) { animation-delay: 0.3s; }
.summary-markdown :deep(> *:nth-child(5)) { animation-delay: 0.4s; }
.summary-markdown :deep(> *:nth-child(6)) { animation-delay: 0.5s; }
.summary-markdown :deep(> *:nth-child(n + 7)) { animation-delay: 0.6s; }

@keyframes summary-block-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .summary-markdown :deep(> *) {
    animation: none;
  }
}

/* [參考 N] 引用膠囊：仿搜尋引擎 AI 摘要的來源標記，點了直接進政策內頁 */
.summary-markdown :deep(.summary-inline-reference) {
  display: inline-block;
  margin: 0 3px;
  padding: 1px 9px;
  border-radius: 999px;
  background: rgba(194, 111, 12, 0.1);
  border: 1px solid rgba(194, 111, 12, 0.24);
  color: #8d4b00;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.6;
  text-decoration: none;
  vertical-align: 1px;
  white-space: nowrap;
  transition: background-color 0.16s ease, border-color 0.16s ease, color 0.16s ease;
}

.summary-markdown :deep(.summary-inline-reference:hover) {
  background: rgba(194, 111, 12, 0.18);
  border-color: rgba(141, 75, 0, 0.4);
  color: #6d3a00;
}

.summary-markdown :deep(.summary-inline-link) {
  color: #b26000;
  font-weight: 800;
  text-decoration: none;
  border-bottom: 1px solid rgba(178, 96, 0, 0.28);
}

.summary-markdown :deep(.summary-inline-link:hover) {
  color: #8d4b00;
  border-bottom-color: rgba(141, 75, 0, 0.5);
}

.summary-markdown :deep(code) {
  padding: 0.1rem 0.3rem;
  border-radius: 6px;
  background: rgba(194, 111, 12, 0.08);
  color: #8d4b00;
  font-size: 0.95em;
}

.summary-empty {
  padding: 12px 2px 4px;
}

.summary-cursor {
  display: inline-block;
  margin-top: 8px;
  color: #bd720f;
  font-weight: 700;
  animation: blink 1s steps(1) infinite;
}

.summary-error {
  margin: 10px 0 0;
  color: #a54b16;
  font-size: 13px;
}

.summary-conversation {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 16px;
  margin-top: 12px;
  padding-top: 18px;
  border-top: 1px solid rgba(150, 100, 34, 0.14);
}

.summary-message-list {
  display: grid;
  gap: 10px;
}

.summary-message {
  box-sizing: border-box;
  width: fit-content;
  max-width: min(88%, 720px);
  padding: 10px 14px;
  border-radius: 6px;
  border: 1px solid rgba(96, 67, 26, 0.1);
}

.summary-message.is-user {
  justify-self: end;
  background: #f45a08;
  border-color: #f45a08;
  color: #ffffff;
}

.summary-message.is-assistant {
  justify-self: start;
  background: rgba(255, 255, 255, 0.88);
  color: #2e2619;
}

.summary-message.is-streaming {
  opacity: 0.84;
}

/*
  AI 的回答不做成泡泡：裡面是段落標題、列點與 [參考 N] 連結的完整版面，
  塞進氣泡會擠成一團。改成整欄寬度、左側一道色條標示這是回覆。
*/
.summary-answer {
  justify-self: stretch;
  box-sizing: border-box;
  width: 100%;
  padding: 2px 0 2px 14px;
  border-left: 3px solid rgba(244, 90, 8, 0.4);
}

.summary-answer-action {
  margin-top: 12px;
}

.summary-answer-label {
  display: block;
  margin-bottom: 8px;
  font-size: 11px;
  font-weight: 800;
  color: #a2622a;
}

.summary-answer .summary-markdown :deep(p),
.summary-answer .summary-markdown :deep(li) {
  font-size: 15px;
}

/* 回答是摘要的下一層，段落標題要比上面那份小一階，層級才讀得出來 */
.summary-answer .summary-markdown :deep(h4.summary-section-title) {
  font-size: 16px;
}

.summary-message-label {
  display: block;
  margin-bottom: 3px;
  font-size: 11px;
  font-weight: 800;
  color: inherit;
  opacity: 0.76;
}

.summary-message p {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.summary-followup-form {
  display: grid;
  gap: 7px;
}

.summary-message-pending {
  margin: 0;
  color: #8a7a63;
  font-size: 13px;
}

.summary-followup-retry {
  margin-left: 8px;
  padding: 2px 10px;
  border: 1px solid currentColor;
  border-radius: 999px;
  background: transparent;
  color: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.summary-followup-retry:hover {
  background: rgba(214, 62, 20, 0.08);
}

.summary-followup-label {
  color: #5c431f;
  font-size: 13px;
  font-weight: 800;
}

.summary-active-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.summary-active-filters-label {
  color: #8a7a63;
  font-size: 13px;
  font-weight: 800;
}

.summary-active-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid rgba(92, 67, 31, 0.28);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.75);
  color: #5c431f;
  font-size: 13px;
  padding: 5px 12px;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.summary-active-chip:hover,
.summary-active-chip:focus-visible {
  background: #fff;
  border-color: rgba(92, 67, 31, 0.55);
}

.summary-active-chip-key {
  color: #8a7a63;
  font-size: 12px;
}

.summary-active-chip-value {
  font-weight: 800;
}

.summary-active-chip-x {
  color: #8a7a63;
  font-size: 15px;
  line-height: 1;
}

.summary-active-chip:hover .summary-active-chip-x {
  color: #b3541e;
}

.summary-result-breakdown {
  margin: -6px 0 14px;
  color: #8a7a63;
  font-size: 13px;
  line-height: 1.7;
}

.summary-relax {
  display: grid;
  gap: 8px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed rgba(92, 67, 31, 0.25);
}

.summary-relax-label {
  color: #5c431f;
  font-size: 13px;
  font-weight: 800;
  margin: 0;
}

.summary-relax-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.summary-relax-chip {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  border: 1px solid rgba(92, 67, 31, 0.3);
  border-radius: 999px;
  background: #fff;
  color: #5c431f;
  font-size: 14px;
  padding: 7px 16px;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.summary-relax-chip strong {
  font-weight: 800;
  color: #b3541e;
}

.summary-relax-chip:hover,
.summary-relax-chip:focus-visible {
  background: #5c431f;
  border-color: #5c431f;
  color: #fff;
}

.summary-relax-chip:hover strong,
.summary-relax-chip:focus-visible strong {
  color: #ffd9a8;
}

.summary-policy-options {
  display: grid;
  gap: 8px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed rgba(92, 67, 31, 0.25);
}

.summary-policy-label {
  color: #5c431f;
  font-size: 13px;
  font-weight: 800;
  margin: 0;
}

.summary-policy-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.summary-policy-chip {
  border: 1px solid rgba(92, 67, 31, 0.3);
  border-radius: 999px;
  background: #fff;
  color: #5c431f;
  font-size: 14px;
  font-weight: 700;
  padding: 7px 16px;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.summary-policy-chip:hover,
.summary-policy-chip:focus-visible {
  background: #5c431f;
  border-color: #5c431f;
  color: #fff;
}

.summary-followup-controls {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: stretch;
}

.summary-followup-controls input {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  height: 48px;
  padding: 0 14px;
  border: 1px solid rgba(96, 67, 26, 0.2);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.92);
  color: #2e2619;
  font: inherit;
  outline: none;
}

.summary-followup-controls input:focus {
  border-color: #e9580c;
  box-shadow: 0 0 0 3px rgba(233, 88, 12, 0.12);
}

.summary-followup-controls input::placeholder {
  color: #9b8b75;
}

.summary-followup-controls button {
  min-width: 72px;
  height: 48px;
  padding: 0 16px;
  border: 0;
  border-radius: 6px;
  background: #f45a08;
  color: #ffffff;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.summary-followup-controls button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.summary-followup-error {
  margin: 0;
  color: #a54b16;
  font-size: 12px;
}

.summary-references {
  width: 100%;
  box-sizing: border-box;
  margin-top: 18px;
  padding: 10px 12px 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(96, 67, 26, 0.1);
  box-shadow: 0 10px 20px rgba(92, 64, 20, 0.04);
}

.reference-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 2px 0 8px;
}

.reference-label,
.reference-count {
  font-size: 12px;
  font-weight: 800;
  color: #8a611f;
  letter-spacing: 0.06em;
}

.reference-card-list {
  display: grid;
  width: 100%;
  box-sizing: border-box;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  column-gap: 16px;
  row-gap: 16px;
  margin-top: 2px;
  align-items: stretch;
}

.reference-card-link {
  display: block;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  text-decoration: none;
}

.reference-card-link .top-case-card {
  width: 100%;
  height: 100%;
  min-width: 0;
  box-sizing: border-box;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.reference-case-card {
  gap: 6px;
  padding: 8px;
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(92, 64, 20, 0.06);
}

.reference-case-card .top-case-rank {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  font-size: 10px;
}

.reference-case-card .top-case-title {
  font-size: 12px;
  line-height: 1.3;
}

.reference-case-card .top-case-area {
  font-size: 11px;
  line-height: 1.3;
}

.reference-case-card .top-case-bottom {
  gap: 3px;
}

.reference-case-card .top-case-flags {
  gap: 3px;
}

.reference-case-card .top-case-flags span {
  padding: 2px 5px;
  font-size: 9px;
  line-height: 1.1;
}

.reference-card-link:hover .top-case-card {
  transform: translateY(-1px);
  border-color: rgba(194, 111, 12, 0.22);
  box-shadow: 0 10px 16px rgba(92, 64, 20, 0.06);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

@media (max-width: 1024px) {
  .reference-card-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .ifare-summary-card {
    padding: 18px 16px;
    border-radius: 22px;
  }

  .summary-head,
  .summary-tools {
    flex-direction: column;
    align-items: flex-start;
  }

  .provider-switch {
    width: 100%;
  }

  .provider-pill {
    flex: 1 1 auto;
  }

  .summary-retry {
    width: 100%;
  }

  .summary-title {
    font-size: 20px;
  }

  .summary-markdown :deep(h4.summary-section-title) {
    font-size: 16px;
  }

  .top-case-card {
    flex-direction: column;
  }

  .top-case-copy {
    height: auto;
  }

  .top-case-bottom {
    margin-top: 0;
  }

  .reference-card-list {
    grid-template-columns: 1fr;
  }

  .summary-message {
    max-width: 94%;
  }

  .summary-followup-controls {
    grid-template-columns: minmax(0, 1fr) 64px;
    gap: 8px;
  }

  .summary-followup-controls button {
    min-width: 64px;
    padding: 0 10px;
  }
}
</style>
