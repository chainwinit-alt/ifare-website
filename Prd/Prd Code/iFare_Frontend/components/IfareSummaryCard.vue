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

    <div v-if="actualReferenceCases.length" class="summary-references">
      <div class="reference-head">
        <span class="reference-label">參考連結</span>
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

type ProviderName = "gemini";

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
  }>(),
  {
    query: "",
    provider: "gemini",
    resultsLoading: false,
    searchContext: () => ({}),
    summaryTriggerKey: 0,
    summaryCacheKey: "",
    summaryResetKey: 0,
  }
);

const { $llm } = useNuxtApp();
const selectedProvider = ref<ProviderName>("gemini");
const isLoading = ref(false);
const streamError = ref("");
const summaryText = ref("");
const activeController = shallowRef<AbortController | null>(null);
let requestId = 0;

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
const SUMMARY_CACHE_VERSION = "v19-llm-query-first";
const SUMMARY_CACHE_KEY_PREFIX = "ifare-summary-cache:";
const SUMMARY_CACHE_TTL_MS = 30 * 60 * 1000;

const providerOptions: Array<{ value: ProviderName; label: string }> = [
  { value: "gemini", label: "Gemini" },
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

function cleanContextValue(value?: string) {
  const text = (value || "").trim();
  if (!text || text === "未指定") return "";
  return text;
}

function isDefaultContextValue(value: string, defaults: string[]) {
  return defaults.includes(value.trim());
}

function buildRankQuery() {
  const keyword = cleanContextValue(props.searchContext?.query);
  const query = cleanContextValue(props.query);
  return keyword || query;
}

function inferSituationFocus() {
  const source = [
    buildRankQuery(),
    props.searchContext?.policy,
    props.searchContext?.recipient,
    props.searchContext?.income,
    props.searchContext?.identity,
  ]
    .filter(Boolean)
    .join(" ");
  const normalized = normalizeText(source);
  const rules: Array<{ pattern: RegExp; text: string }> = [
    { pattern: /長照|照顧|照護|看護|失能|日間照顧|住宿式照顧/u, text: "長照、照顧服務或照顧者支持" },
    { pattern: /老人|長者|年長|高齡|假牙/u, text: "長者照顧、醫療或生活補助" },
    { pattern: /身心障礙|身障|障礙|復健/u, text: "身心障礙相關服務、補助或支持" },
    { pattern: /低收入|中低收入|經濟|補助|津貼|生活/u, text: "經濟補助或生活支持" },
    { pattern: /托育|育兒|生育|兒童|青少年|幼兒|早期療育/u, text: "育兒、托育、兒少或早療支持" },
    { pattern: /就業|失業|職訓|創業|勞工|職災/u, text: "就業、失業、創業或勞工支持" },
    { pattern: /醫療|健康|健保|醫院|藥/u, text: "醫療、健康或健保相關協助" },
    { pattern: /原住民|新住民|單親|特殊境遇|婦女/u, text: "特定身分或家庭型態支持" },
  ];

  return rules.find((rule) => rule.pattern.test(normalized))?.text || "與目前條件相近的福利服務";
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
    props.searchContext?.policy,
    props.searchContext?.recipient,
    props.searchContext?.area,
    props.searchContext?.income,
    props.searchContext?.identity,
  ]
    .filter(Boolean)
    .join(" ");
}

function summaryDriftsFromQuery(summary: string) {
  const normalizedIntent = normalizeText(buildIntentSource());
  const normalizedSummary = normalizeText(summary || "");

  if (/\[參考\s*\d+\]|參考連結|候選政策/u.test(summary || "")) return true;

  return overSpecificSummaryGuards.some((guard) => {
    return !guard.allowedBy.test(normalizedIntent) && guard.blockedInSummary.test(normalizedSummary);
  });
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

function buildEligibilityCheckText() {
  const checks = ["戶籍地", "受助對象或年齡", "身分與收入限制"];
  const area = cleanContextValue(props.searchContext?.area);
  if (area && !isDefaultContextValue(area, ["全國", "全部"])) {
    checks[0] = `是否限 ${area} 戶籍`;
  }
  return checks.join("、");
}

const rankQuery = computed(() => buildRankQuery());
const rankedCases = computed(() => rankCases(rankQuery.value, props.cases));
const hasSearchContext = computed(() => Boolean((props.summaryCacheKey || "").trim()));
const fallbackText = computed(() => {
  if (!props.cases.length) {
    if (hasSearchContext.value) {
      return `我判斷您可能是在找${inferSituationFocus()}，不過目前還沒有找到直接對應的政策。可以試著補上戶籍地、年齡區間或受助者身分，或把關鍵字換得更具體再搜尋一次。`;
    }
    return "先完成搜尋，AI 會自動整理關鍵字狀況判斷。";
  }

  return `我判斷您比較像是在找${inferSituationFocus()}。建議先確認${buildEligibilityCheckText()}，這幾項通常會影響能不能申請；如果結果太多，可以再加上戶籍地、年齡或更精準的關鍵字。`;
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
    if (!item) return `[參考 ${referenceNo}]`;

    const href = `/ifare/info?id=${encodeURIComponent(String(item.id))}&reload=${encodeURIComponent(String(item.id))}`;
    return `<a class="summary-inline-reference" href="${href}">[參考 ${item.referenceNo}]</a>`;
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

    const heading = line.match(/^#{1,3}\s+(.*)$/);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push(`<p><strong>${applyInlineMarkdown(heading[1])}</strong></p>`);
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
  if (props.resultsLoading) return [];
  return referenceCases.value;
});

const referenceCaseByNo = computed(() => {
  return new Map(referenceCases.value.map((item) => [item.originalReferenceNo, item]));
});

const summaryHtml = computed(() => {
  return useSanitize(renderMarkdown(summaryDisplayText.value));
});

function buildSummaryCacheKey() {
  return `${SUMMARY_CACHE_KEY_PREFIX}${JSON.stringify({
    version: SUMMARY_CACHE_VERSION,
    provider: selectedProvider.value,
    searchKey: props.summaryCacheKey || props.query.trim(),
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
      query: props.query,
      context: props.searchContext,
      cases: rankedCases.value.slice(0, 12),
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
    if (summaryDriftsFromQuery(summaryText.value)) {
      summaryText.value = fallbackText.value;
    }
    writeSummaryCache(summaryText.value);
    if (completedByStream) {
      emitSummaryComplete();
    }
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
    if (!props.cases.length) {
      activeController.value?.abort();
      if (!restoreCachedSummary()) {
        summaryText.value = "";
        streamError.value = "";
        isLoading.value = false;
      }
      if (!props.resultsLoading) {
        nextTick(() => {
          emitSummaryComplete();
        });
      }
      return;
    }
    loadSummary();
  },
  { immediate: true, flush: "post" }
);

watch(
  () => props.summaryResetKey,
  () => {
    activeController.value?.abort();
    summaryText.value = "";
    streamError.value = "";
    isLoading.value = true;
  }
);

watch(
  () => props.provider,
  () => {
    selectedProvider.value = "gemini";
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

.summary-markdown :deep(.summary-inline-reference),
.summary-markdown :deep(.summary-inline-link) {
  color: #b26000;
  font-weight: 800;
  text-decoration: none;
  border-bottom: 1px solid rgba(178, 96, 0, 0.28);
}

.summary-markdown :deep(.summary-inline-reference:hover),
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
}
</style>
