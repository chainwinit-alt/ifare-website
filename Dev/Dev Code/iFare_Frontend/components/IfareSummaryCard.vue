<template>
  <section class="ifare-summary-card" :data-provider="selectedProvider">
    <div class="summary-head">
      <div class="summary-head-copy">
        <span class="summary-kicker">AI 快速摘要</span>
        <h3 class="summary-title">關鍵字狀況判斷</h3>
      </div>

      <div class="summary-tools">
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
        </div>
        <button class="summary-retry" type="button" @click="loadSummary(true)" :disabled="isSummaryBusy">
          {{ isSummaryBusy ? "判斷中" : "重新摘要" }}
        </button> -->
      </div>
    </div>
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

    <div v-if="canContinueConversation" class="summary-conversation">
      <div v-if="conversationMessages.length || followUpDraft" class="summary-message-list" aria-live="polite">
        <div
          v-for="(message, index) in conversationMessages"
          :key="`${message.role}-${index}`"
          class="summary-message"
          :class="message.role === 'user' ? 'is-user' : 'is-assistant'"
        >
          <span class="summary-message-label">{{ message.role === "user" ? "您" : "AI 摘要" }}</span>
          <p>{{ message.content }}</p>
        </div>
        <div v-if="followUpDraft" class="summary-message is-assistant is-streaming">
          <span class="summary-message-label">AI 摘要</span>
          <p>{{ followUpDraft }}</p>
        </div>
      </div>

      <form class="summary-followup-form" @submit.prevent="submitFollowUp">
        <label class="summary-followup-label" for="ifare-summary-followup">回覆摘要提問</label>
        <div class="summary-followup-controls">
          <input
            id="ifare-summary-followup"
            v-model="followUpInput"
            type="text"
            maxlength="120"
            autocomplete="off"
            placeholder="回覆上面的問題..."
            :disabled="isFollowUpLoading"
          />
          <button type="submit" :disabled="!canSubmitFollowUp">
            {{ isFollowUpLoading ? "整理中" : "送出" }}
          </button>
        </div>
        <p v-if="followUpError" class="summary-followup-error">{{ followUpError }}</p>
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
  normalizeFallbackIntentTopic,
} from "~/utils/ifareIntent";

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

type SummaryConversationSearchResult = {
  query: string;
  cases: SummaryCaseItem[];
};

type SummaryConversationSearch = (payload: {
  query: string;
  conversation: SummaryConversationMessage[];
}) => Promise<SummaryConversationSearchResult>;

const emit = defineEmits<{
  summaryComplete: [payload: { summary: string; provider: ProviderName }];
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
  }>(),
  {
    query: "",
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
const SUMMARY_CACHE_VERSION = "v39-ai-overview";
const SUMMARY_CACHE_KEY_PREFIX = "ifare-summary-cache:";
const SUMMARY_CACHE_TTL_MS = 30 * 60 * 1000;

const providerOptions: Array<{ value: ProviderName; label: string }> = [
  { value: "groq", label: "Groq" },
];

const referenceTokenPattern = /\[參考\s*(\d+)\]/g;
const groupedReferenceTokenPattern = /\[參考\s*([\d\s,，]+)\]/g;

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

function rankCases(query: string, cases: SummaryCaseItem[]): RankedSummaryCaseItem[] {
  const tokens = splitQueryTokens(query);
  const normalizedQuery = normalizeText(query);

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
        rank: 0,
        scorePercent: 0,
      };
    })
    .sort((a, b) => b.similarityScore - a.similarityScore);

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
  return conversationQuery || keyword || query;
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
const rankedCases = computed(() => rankCases(rankQuery.value, props.cases));
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
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*(?:[-*+]|\d+[.)])\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\[參考\s*[\d\s,，、]*\]/g, "")
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
  return (text || "").replace(groupedReferenceTokenPattern, (_token, refGroupText) => {
    const refNumbers = String(refGroupText)
      .split(/[,\s，]+/)
      .map((item) => Number(item.trim()))
      .filter((value) => Number.isInteger(value) && value > 0);

    if (!refNumbers.length) return _token;
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
      blocks.push(`<h4 class="summary-section-title">${applyInlineMarkdown(heading[1])}</h4>`);
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
    .filter((item) => !rankQuery.value || item.similarityScore > 0)
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

function buildSummaryCacheKey() {
  return `${SUMMARY_CACHE_KEY_PREFIX}${JSON.stringify({
    version: SUMMARY_CACHE_VERSION,
    provider: selectedProvider.value,
    searchKey: props.summaryCacheKey || normalizeSummaryKeyword(props.query),
  })}`;
}

function readSummaryCache() {
  if (!process.client) return null;

  const raw = sessionStorage.getItem(buildSummaryCacheKey());
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as {
      savedAt?: number;
      summary?: string;
    };

    if (!parsed?.savedAt || Date.now() - parsed.savedAt > SUMMARY_CACHE_TTL_MS) {
      sessionStorage.removeItem(buildSummaryCacheKey());
      return null;
    }

    return typeof parsed.summary === "string" ? parsed.summary : null;
  } catch {
    sessionStorage.removeItem(buildSummaryCacheKey());
    return null;
  }
}

function writeSummaryCache(summary: string) {
  if (!process.client || !summary) return;

  sessionStorage.setItem(
    buildSummaryCacheKey(),
    JSON.stringify({
      savedAt: Date.now(),
      summary,
    })
  );
}

function restoreCachedSummary() {
  const cachedSummary = readSummaryCache();
  if (!cachedSummary) return false;

  summaryText.value = cachedSummary;
  streamError.value = "";
  isLoading.value = false;
  return true;
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
  followUpInput.value = "";
  followUpDraft.value = "";
  followUpError.value = "";
  conversationSearchQuery.value = "";
  isFollowUpLoading.value = false;
}

async function submitFollowUp() {
  const userReply = followUpInput.value.trim().slice(0, 120);
  if (!userReply || isFollowUpLoading.value) return;

  const currentRequestId = ++followUpRequestId;
  followUpController.value?.abort();
  const controller = new AbortController();
  followUpController.value = controller;
  conversationMessages.value.push({ role: "user", content: userReply });
  followUpInput.value = "";
  followUpDraft.value = "";
  followUpError.value = "";
  isFollowUpLoading.value = true;

  const conversation: SummaryConversationMessage[] = [
    { role: "assistant", content: toPlainSummaryText(summaryDisplayText.value) },
    ...conversationMessages.value.slice(-7),
  ];

  try {
    if (props.conversationSearch) {
      const searchResult = await props.conversationSearch({
        query: normalizeSummaryKeyword(props.query),
        conversation,
      });
      if (currentRequestId !== followUpRequestId) return;
      conversationSearchQuery.value = normalizeSummaryKeyword(searchResult?.query);
      await nextTick();
    }

    await $llm.streamSummarizeCases({
      query: conversationSearchQuery.value || normalizeSummaryKeyword(props.query),
      context: props.searchContext,
      cases: referenceCases.value,
      conversation,
      provider: selectedProvider.value,
      signal: controller.signal,
      onChunk: (_delta, fullText) => {
        if (currentRequestId !== followUpRequestId) return;
        followUpDraft.value = fullText;
      },
    });

    if (currentRequestId !== followUpRequestId) return;
    const reply = followUpDraft.value.trim();
    if (reply) {
      conversationMessages.value.push({ role: "assistant", content: reply });
      conversationMessages.value = conversationMessages.value.slice(-8);
    } else {
      followUpError.value = "目前暫時無法繼續整理，請稍後再試。";
    }
  } catch (error: any) {
    if (currentRequestId !== followUpRequestId || error?.name === "AbortError") return;
    console.warn("[IFareSummaryCard][follow-up]", error);
    followUpError.value = "目前暫時無法繼續整理，請稍後再試。";
  } finally {
    if (currentRequestId !== followUpRequestId) return;
    followUpDraft.value = "";
    isFollowUpLoading.value = false;
    followUpController.value = null;
  }
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

.summary-followup-label {
  color: #5c431f;
  font-size: 13px;
  font-weight: 800;
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
