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
    `受助者情況：${context?.recipient?.trim() || "未提供"}`,
    `受助者年齡區間：${context?.area?.trim() || "未提供"}`,
    `受助者戶籍地：${context?.policy?.trim() || "未提供"}`,
    `經濟條件：${context?.income?.trim() || "未提供"}`,
    `特殊身分：${context?.identity?.trim() || "未提供"}`,
    `關鍵字：${context?.query?.trim() || "未提供"}`,
  ];
}

export function buildSummaryPrompt(
  query: string,
  cases: LlmSummaryCaseItem[],
  context?: LlmSummarySearchContext
) {
  const queryText = query.trim() || context?.query?.trim() || "未提供";
  const caseLines = cases
    .slice(0, 6)
    .map((item, index) => {
      const referenceNo = index + 1;
      const blocks = [
        `[參考 ${referenceNo}]`,
        `政策名稱：${item.title || "未提供"}`,
        `地區：${item.area || "未提供"}`,
        `條件標記：${buildCaseTags(item)}`,
        `資格摘要：${item.qualification || "未提供"}`,
        item.sourceSummary ? `政策摘要：${item.sourceSummary}` : "",
        item.welfareInfo ? `補助內容：${item.welfareInfo}` : "",
        item.evidence ? `依據說明：${item.evidence}` : "",
      ].filter(Boolean);

      return blocks.join("\n");
    })
    .join("\n\n");

  return [
    "你是 i-Fare 的政策摘要助手。",
    "請根據使用者這次的搜尋條件，僅針對明確相關的政策做簡短摘要與建議。",
    "請用繁體中文輸出，並只輸出 Markdown 列點。",
    "",
    "輸出規則：",
    "- 只輸出 3 到 5 個 bullet。",
    "- 只摘要目前提供的政策，不要延伸到其他泛用制度或自行補充未提供的政策。",
    "- 若某政策與搜尋需求關聯不明確，就不要放進摘要。",
    "- 每個 bullet 要直接說明這個政策能幫上什麼忙、適合什麼情況，或申請前要先確認什麼。",
    "- 不要寫總覽、結論、前言、後記，也不要反問使用者。",
    "- 若有引用，請使用 [參考 1] 到 [參考 6]。",
    "- 不得新增、改寫或重編參考號。",
    "- 若同一句需要兩個引用，請寫成 [參考 1][參考 2]，不要寫成 [參考 1, 2]。",
    "- 每個 bullet 最多放 2 個參考。",
    "",
    "使用者搜尋條件：",
    ...buildSearchContextLines({
      ...context,
      query: queryText,
    }),
    "",
    "本次可用且已篩過的相關政策：",
    caseLines || "無可用政策。",
  ].join("\n");
}

export function buildFallbackSummary(query: string, cases: LlmSummaryCaseItem[]) {
  const topCases = selectSummaryCases(query, cases, 3);
  const queryText = query.trim() || "目前搜尋條件";

  if (!topCases.length) {
    return [
      `- 目前沒有找到和 **${queryText}** 明確對應的政策摘要重點。`,
      "- 可以再縮小關鍵字、補充身分或地區條件後重新搜尋。",
    ].join("\n");
  }

  return topCases
    .map((item, index) => `- **${item.title}** 與這次搜尋條件最接近，可先優先確認其資格條件與補助內容。[參考 ${index + 1}]`)
    .join("\n");
}
