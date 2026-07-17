import type { LlmSummaryCaseItem, LlmSummarySearchContext } from "./types";

export interface RankedSummaryCaseItem extends LlmSummaryCaseItem {
  similarityScore: number;
  matchedTokenCount: number;
  exactMatch: boolean;
}

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

function buildCaseTags(item: LlmSummaryCaseItem) {
  return [
    item.hasRecipient ? "有年齡條件" : "無年齡條件",
    item.hasIncome ? "有經濟條件" : "無經濟條件",
    item.hasIndentity ? "有身分條件" : "無身分條件",
  ].join("、");
}

export function rankCases(query: string, cases: LlmSummaryCaseItem[]): RankedSummaryCaseItem[] {
  const tokens = splitQueryTokens(query);
  const normalizedQuery = normalizeText(query);

  return cases
    .map((item) => {
      const fields = {
        title: normalizeText(item.title || ""),
        area: normalizeText(item.area || ""),
        qualification: normalizeText(item.qualification || ""),
        sourceSummary: normalizeText(item.sourceSummary || ""),
        welfareInfo: normalizeText(item.welfareInfo || ""),
        evidence: normalizeText(item.evidence || ""),
        remark: normalizeText(item.remark || ""),
        authority: normalizeText(item.competentAuthority || ""),
      };

      const weightedFields = [
        [fields.title, 16],
        [fields.area, 5],
        [fields.qualification, 10],
        [fields.sourceSummary, 18],
        [fields.welfareInfo, 14],
        [fields.evidence, 12],
        [fields.remark, 10],
        [fields.authority, 8],
      ] as const;

      const combined = Object.values(fields).join("");
      const exactMatch = Boolean(normalizedQuery && combined.includes(normalizedQuery));
      let score = 0;
      let matchedTokenCount = 0;

      if (tokens.length) {
        for (const token of tokens) {
          let tokenMatched = false;

          for (const [field, weight] of weightedFields) {
            if (!field) continue;
            if (field.includes(token)) {
              score += weight;
              tokenMatched = true;
            }
          }

          if (tokenMatched) {
            matchedTokenCount += 1;
          }
        }

        if (exactMatch) {
          score += 24;
        }

        score += matchedTokenCount * 4;

        if (matchedTokenCount > 0 || exactMatch) {
          score += (item.hasRecipient ? 2 : 0) + (item.hasIncome ? 1 : 0) + (item.hasIndentity ? 1 : 0);
        }

        if (isOverSpecificCaseForIntent(item, query)) {
          score -= 80;
        }
      } else {
        score =
          (item.hasRecipient ? 6 : 0) +
          (item.hasIncome ? 4 : 0) +
          (item.hasIndentity ? 4 : 0) +
          Math.min((item.qualification || "").length / 60, 5);
      }

      return {
        ...item,
        similarityScore: Math.round(score * 10) / 10,
        matchedTokenCount,
        exactMatch,
      };
    })
    .sort((a, b) => b.similarityScore - a.similarityScore);
}

export function selectSummaryCases(query: string, cases: LlmSummaryCaseItem[], take = 6) {
  const ranked = rankCases(query, cases);
  if (!ranked.length) return [];

  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) {
    return ranked.slice(0, take);
  }

  const matchedCases = ranked.filter((item) => item.exactMatch || item.matchedTokenCount > 0);
  if (!matchedCases.length) {
    return [];
  }

  const maxScore = matchedCases[0]?.similarityScore || 0;
  const minTokenCount = Math.max(1, Math.ceil(splitQueryTokens(query).length / 3));

  const filtered = matchedCases.filter((item) => {
    if (item.exactMatch) return true;
    if (item.matchedTokenCount >= minTokenCount) return true;
    return item.similarityScore >= maxScore * 0.55;
  });

  return (filtered.length ? filtered : matchedCases).slice(0, take);
}

function buildSearchContextLines(context?: LlmSummarySearchContext) {
  return [
    `受助者情況：${context?.policy?.trim() || "未提供"}`,
    `受助者年齡區間：${context?.recipient?.trim() || "未提供"}`,
    `受助者戶籍地：${context?.area?.trim() || "未提供"}`,
    `經濟條件：${context?.income?.trim() || "未提供"}`,
    `特殊身分：${context?.identity?.trim() || "未提供"}`,
    `關鍵字：${context?.query?.trim() || "未提供"}`,
  ];
}

function cleanContextText(value?: string) {
  const text = (value || "").trim();
  if (!text || text === "未指定") return "";
  return text;
}

function truncateText(value: string | undefined, maxLength = 180) {
  const text = (value || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

function buildIntentSource(query: string, context?: LlmSummarySearchContext) {
  return [
    query,
    context?.query,
    context?.policy,
    context?.recipient,
    context?.area,
    context?.income,
    context?.identity,
  ]
    .filter(Boolean)
    .join(" ");
}

const overSpecificTopicGuards: Array<{ allowedBy: RegExp; blockedInSummary: RegExp }> = [
  {
    allowedBy: /牙|假牙|口腔|牙科|齒/u,
    blockedInSummary: /牙|假牙|口腔|牙科|齒/u,
  },
  {
    allowedBy: /托育|幼兒|兒童|青少年|兒少|育兒|生育|早療/u,
    blockedInSummary: /托育|幼兒|兒童|青少年|兒少|育兒|生育|早療/u,
  },
];

function buildCaseIntentText(item: LlmSummaryCaseItem) {
  return [
    item.title,
    item.area,
    item.qualification,
    item.sourceSummary,
    item.welfareInfo,
    item.evidence,
    item.remark,
    item.competentAuthority,
    item.officeUnitInfo,
  ]
    .filter(Boolean)
    .join(" ");
}

function isOverSpecificCaseForIntent(item: LlmSummaryCaseItem, intent: string) {
  const normalizedIntent = normalizeText(intent || "");
  const normalizedCase = normalizeText(buildCaseIntentText(item));

  return overSpecificTopicGuards.some((guard) => {
    return !guard.allowedBy.test(normalizedIntent) && guard.blockedInSummary.test(normalizedCase);
  });
}

export function normalizeLlmSummaryByQuery(
  query: string,
  context: LlmSummarySearchContext | undefined,
  summary: string,
  fallbackSummary: string
) {
  const normalizedIntent = normalizeText(buildIntentSource(query, context));
  const summaryText = (summary || "").replace(/\s+/g, " ").trim();
  const normalizedSummary = normalizeText(summaryText);

  if (!summaryText || /\[參考\s*\d+\]|參考連結|候選政策/u.test(summaryText)) {
    return fallbackSummary;
  }

  for (const guard of overSpecificTopicGuards) {
    if (!guard.allowedBy.test(normalizedIntent) && guard.blockedInSummary.test(normalizedSummary)) {
      return fallbackSummary;
    }
  }

  return summaryText;
}

function inferSituationFocus(query: string, context?: LlmSummarySearchContext) {
  const source = [
    query,
    context?.policy,
    context?.recipient,
    context?.income,
    context?.identity,
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

function buildEligibilityCheckText(context?: LlmSummarySearchContext) {
  const area = cleanContextText(context?.area);
  const checks = [
    area && !["全國", "全部"].includes(area) ? `是否限 ${area} 戶籍` : "戶籍地",
    "受助對象或年齡",
    "身分與收入限制",
  ];

  return checks.join("、");
}

export function buildSummaryPrompt(
  query: string,
  cases: LlmSummaryCaseItem[],
  context?: LlmSummarySearchContext
) {
  const queryText = query.trim() || context?.query?.trim() || "未提供";
  const situationFocus = inferSituationFocus(queryText, context);
  const eligibilityChecks = buildEligibilityCheckText(context);
  const caseLines = cases
    .slice(0, 6)
    .map((item, index) => {
      const referenceNo = index + 1;
      const blocks = [
        `候選政策 ${referenceNo}`,
        `政策名稱：${item.title || "未提供"}`,
        `地區：${item.area || "未提供"}`,
        `條件標記：${buildCaseTags(item)}`,
        `資格摘要：${truncateText(item.qualification, 180) || "未提供"}`,
        item.sourceSummary ? `政策摘要：${truncateText(item.sourceSummary, 180)}` : "",
        item.welfareInfo ? `補助內容：${truncateText(item.welfareInfo, 220)}` : "",
        item.evidence ? `依據說明：${truncateText(item.evidence, 140)}` : "",
      ].filter(Boolean);

      return blocks.join("\n");
    })
    .join("\n\n");

  return [
    "你是 i-Fare 的福利情境判斷助手。",
    "請根據使用者這次輸入的關鍵字與篩選條件，判斷使用者可能遇到的生活情境。",
    "請用繁體中文輸出，而且只輸出一段自然、口語、像智慧助理的判斷文字。",
    "",
    "核心判斷規則：",
    "- 最高優先順序是：使用者搜尋條件 > 初步情境判斷 > 候選政策。",
    "- 候選政策只能用來輔助判斷，不可以把使用者沒有提到的具體服務項目改寫成主要需求。",
    `- 本次初步情境判斷是：${situationFocus}。`,
    `- 申請前優先確認：${eligibilityChecks}。`,
    "- 候選政策只是協助你理解搜尋結果，不代表一定適用。",
    "- 請根據使用者關鍵字的意圖，給出保守、實用的情境判斷。",
    "- 如果使用者沒有明確輸入「牙齒、假牙、口腔、牙科」等字，不得把摘要聚焦成牙齒或假牙補助。",
    "- 如果使用者沒有明確輸入「托育、幼兒、兒童、青少年、兒少、育兒、生育、早療」等字，不得把摘要聚焦成兒少或托育補助。",
    "",
    "輸出規則：",
    "- 必須用「我判斷您...」開頭。",
    "- 文字長度約 70 到 120 字。",
    "- 請說明使用者可能在找什麼，以及建議先確認哪些條件。",
    "- 不要寫 Markdown，不要列點，不要換行。",
    "- 不要提到候選政策、參考、參考連結、參考編號或 [參考 n]。",
    "- 不要列出政策名稱，參考連結會由畫面下方另外顯示。",
    "- 不要要求使用者補資料；可以用『建議先確認』這類語氣。",
    "",
    "使用者搜尋條件：",
    ...buildSearchContextLines({
      ...context,
      query: queryText,
    }),
    "",
    "本次已篩過、可供比對的政策：",
    caseLines || "無可用政策。",
  ].join("\n");
}

export function buildFallbackSummary(query: string, cases: LlmSummaryCaseItem[]) {
  const topCases = selectSummaryCases(query, cases, 3);
  const queryText = query.trim() || "目前搜尋條件";
  const situationFocus = inferSituationFocus(queryText);
  const eligibilityChecks = buildEligibilityCheckText();

  if (!topCases.length) {
    return `我判斷您可能是在找${situationFocus}，不過目前還沒有找到直接對應的政策。可以試著補上戶籍地、年齡區間或受助者身分，或把關鍵字換得更具體再搜尋一次。`;
  }

  return `我判斷您比較像是在找${situationFocus}。建議先確認${eligibilityChecks}，這幾項通常會影響能不能申請；如果結果太多，可以再加上戶籍地、年齡或更精準的關鍵字。`;
}
