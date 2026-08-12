import { GoogleGenAI } from "@google/genai";
import {
  DEFAULT_GEMINI_MODELS,
  parseModelList,
} from "../../utils/llm/freeTier";
import {
  normalizeFallbackIntentTopic,
  normalizeRespectfulPolicyTerm,
} from "../../../utils/ifareIntent";
import {
  normalizeSummaryQuery,
  sanitizeSummaryConversation,
} from "../../utils/llm/shared";
import type {
  LlmSummaryConversationMessage,
  LlmSummarySearchContext,
} from "../../utils/llm/types";

interface SearchIntentPayload {
  query?: string;
  conversation?: LlmSummaryConversationMessage[];
  context?: LlmSummarySearchContext;
}

interface SearchIntentResponse {
  searchQuery?: string;
  intent?: string;
  area?: string;
}

const SEARCH_INTENT_SYSTEM_PROMPT =
  "You convert a user's Traditional Chinese question into one concise core topic and explicit search conditions for welfare policies inside i-Fare. Preserve the user's concrete main need and meaning. If the input contains a concrete topic together with generic benefit or request words such as subsidy, allowance, welfare, policy, eligibility, apply, search, or what is available, omit those generic words from searchQuery and keep only the concrete topic. Convert colloquial, outdated, or stigmatizing expressions into respectful contemporary terminology commonly used in Taiwan welfare policies without diagnosing the user or inventing a narrower need. Resolve an explicitly supplied Taiwan county, city, township, town, city district, or district to its parent county or city in area. Never derive area from candidate policies or assistant messages. If no concrete topic exists, preserve the original query. Do not infer a narrower service, benefit, identity, medical condition, or life event that the user did not mention. Return JSON only.";

const TAIWAN_AREAS = [
  "台北市", "新北市", "桃園市", "台中市", "台南市", "高雄市", "基隆市",
  "新竹市", "嘉義市", "新竹縣", "苗栗縣", "彰化縣", "南投縣", "雲林縣",
  "嘉義縣", "屏東縣", "宜蘭縣", "花蓮縣", "台東縣", "澎湖縣", "金門縣", "連江縣",
] as const;

function normalizeAreaText(value: unknown) {
  return String(value || "")
    .trim()
    .replace(/^臺/u, "台")
    .replace(/\s+/g, "");
}

function normalizeResolvedArea(value: unknown) {
  const normalized = normalizeAreaText(value);
  return TAIWAN_AREAS.find(area => normalizeAreaText(area) === normalized) || "";
}

function resolveFallbackArea(
  conversation: LlmSummaryConversationMessage[],
  context?: LlmSummarySearchContext,
) {
  const selectedArea = normalizeResolvedArea(context?.area);
  if (selectedArea) return selectedArea;

  const userText = conversation
    .filter(item => item.role === "user")
    .map(item => item.content)
    .reverse()
    .join(" ");
  const normalized = normalizeAreaText(userText);
  const directArea = TAIWAN_AREAS.find(area => normalized.includes(normalizeAreaText(area)));
  if (directArea) return directArea;

  // Keep a deterministic fallback for the location currently used in the guided flow.
  if (/恆春(?:鎮)?/u.test(normalized)) return "屏東縣";
  return "";
}

const SEARCH_INTENT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const searchIntentCache = new Map<
  string,
  { expiresAt: number; response: Record<string, string> }
>();

function parseSearchIntent(text: string): SearchIntentResponse {
  const normalized = String(text || "")
    .replace(/^```(?:json)?\s*/iu, "")
    .replace(/\s*```$/u, "")
    .trim();
  if (!normalized) return {};

  try {
    return JSON.parse(normalized) as SearchIntentResponse;
  } catch {
    const matched = normalized.match(/\{[\s\S]*\}/u)?.[0] || "";
    try {
      return matched ? (JSON.parse(matched) as SearchIntentResponse) : {};
    } catch {
      return {};
    }
  }
}

function normalizeResolvedQuery(value: unknown) {
  return normalizeRespectfulPolicyTerm(value)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 30);
}

const PRESERVED_INTENT_PATTERNS: RegExp[] = [
  /低收入(?:戶)?/u,
  /中低收入(?:戶)?/u,
  /長照|長期照顧/u,
  /身心障礙|身障|智能障礙/u,
  /生育|孕產|新生兒/u,
  /托育|育兒/u,
  /兒少|兒童|幼兒|青少年/u,
  /老人|長者|高齡/u,
  /原住民/u,
  /新住民/u,
  /特殊境遇/u,
  /急難/u,
  /租屋|住宅/u,
  /失業|就業/u,
  /醫療|就醫/u,
  /假牙|牙齒|口腔/u,
];

function keepResolvedQueryOnTopic(originalQuery: string, resolvedQuery: string) {
  const normalizedOriginal = normalizeRespectfulPolicyTerm(originalQuery);
  const normalizedResolved = normalizeRespectfulPolicyTerm(resolvedQuery);
  const requiredPatterns = PRESERVED_INTENT_PATTERNS.filter(pattern =>
    pattern.test(normalizedOriginal)
  );
  const keepsEveryExplicitTopic = requiredPatterns.every(pattern =>
    pattern.test(normalizedResolved)
  );

  return keepsEveryExplicitTopic
    ? resolvedQuery
    : normalizeFallbackIntentTopic(originalQuery);
}

function buildIntentPrompt(
  query: string,
  conversation: LlmSummaryConversationMessage[] = [],
  context?: LlmSummarySearchContext,
) {
  const userMemory = sanitizeSummaryConversation(conversation)
    .filter(item => item.role === "user")
    .slice(-6)
    .map(item => `- ${item.content}`);
  const selectedConditions = [
    context?.policy && context.policy !== "全部" ? `受助者情況：${context.policy}` : "",
    context?.recipient && context.recipient !== "未指定" ? `年齡區間：${context.recipient}` : "",
    context?.area && context.area !== "全國" ? `戶籍地：${context.area}` : "",
    context?.income && context.income !== "未指定" ? `經濟條件：${context.income}` : "",
    context?.identity && context.identity !== "未指定" ? `特殊身分：${context.identity}` : "",
  ].filter(Boolean);

  return [
    "請綜合原始搜尋文字、使用者後續對話記憶與已選條件，輸出一個適合重新查找站內政策的搜尋詞。",
    "searchQuery 請使用 2 到 24 個繁體中文字，保留原始核心需求，並加入使用者後續明確補充或改變的條件。",
    "後續回覆若只有地區、年齡、收入或身分，必須保留原始需求主題，不能把搜尋詞縮成單一條件。",
    "只採用使用者親自確認的內容；AI 先前提出但使用者沒有確認的條件，不得寫入搜尋詞。",
    `若使用者明確輸入台灣縣市、鄉鎮市區或行政區，area 必須轉成下列其中一個縣市名稱：${TAIWAN_AREAS.join("、")}。例如「恆春」回傳「屏東縣」。`,
    "若使用者未明確提供地名，area 請回傳空字串。area 已承接地區條件時，不要再把地名塞進 searchQuery。",
    "若具體主題旁有「補助、津貼、福利、政策、資格、申請、有什麼、有哪些」等泛用詞，searchQuery 不要保留這些泛用詞。",
    "「低收入戶、中低收入戶、長照、生育、身心障礙」等都是具體需求，不是可刪除或替換的泛用詞；searchQuery 必須保留使用者原本明確提到的主題。",
    "若輸入含口語、過時或不合宜稱呼，請轉換成台灣福利政策常用且尊重的現代用語，不要原樣重複。",
    "例如「低能兒補助」應理解為兒童心智發展或智能障礙相關需求，searchQuery 請改用合宜且最適合本站政策檢索的詞，不要保留「低能兒」。",
    "若原文只有泛用詞、沒有可辨識的具體主題，才保留原始搜尋文字。",
    "intent 請用一句簡短繁體中文描述判斷到的需求。",
    '只輸出 JSON：{"searchQuery":"核心搜尋詞","intent":"需求描述","area":"標準縣市或空字串"}',
    `原始搜尋文字：${JSON.stringify(query)}`,
    selectedConditions.length
      ? `目前已選條件：\n${selectedConditions.join("\n")}`
      : "目前已選條件：未提供",
    userMemory.length
      ? `使用者後續補充（依時間順序）：\n${userMemory.join("\n")}`
      : "使用者後續補充：尚未開始",
  ].join("\n");
}

async function requestGroqIntent(apiKey: string, model: string, prompt: string) {
  const isGptOss = /^openai\/gpt-oss-/iu.test(model);
  const isQwen = /^qwen\//iu.test(model);
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      ...(isGptOss
        ? { reasoning_effort: "low" }
        : isQwen
          ? { reasoning_effort: "none" }
          : {}),
      temperature: 0.1,
      max_completion_tokens: isGptOss ? 320 : 180,
      messages: [
        { role: "system", content: SEARCH_INTENT_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    }),
  });

  const data: any = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      `Groq intent request failed with status ${response.status}. ${
        data?.error?.message || ""
      }`.trim()
    );
  }
  return String(data?.choices?.[0]?.message?.content || "");
}

async function requestGeminiIntent(apiKey: string, model: string, prompt: string) {
  const ai = new GoogleGenAI({ apiKey, apiVersion: "v1beta" });
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: SEARCH_INTENT_SYSTEM_PROMPT,
      responseMimeType: "application/json",
    },
  });
  return response.text || "";
}

export default defineEventHandler(async (event) => {
  const body = (await readBody<SearchIntentPayload>(event)) || {};
  const query = normalizeSummaryQuery(body.query);
  const conversation = sanitizeSummaryConversation(body.conversation);

  if (!query) {
    return {
      originalQuery: "",
      searchQuery: "",
      intent: "",
      area: "",
      source: "skipped",
      model: "",
      errorMessage: "",
    };
  }

  const cacheKey = JSON.stringify({ query, conversation, context: body.context || {} });
  const cached = searchIntentCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.response;
  if (cached) searchIntentCache.delete(cacheKey);

  const config = useRuntimeConfig();
  const llmConfig = (config as any).llm || {};
  const groqApiKey = llmConfig.groqApiKey || "";
  const geminiApiKey = llmConfig.geminiApiKey || "";
  const groqModels = parseModelList(llmConfig.groqIntentModels, [
    "qwen/qwen3.6-27b",
    "openai/gpt-oss-120b",
  ]);
  const geminiModels = parseModelList(
    llmConfig.geminiModels || llmConfig.geminiModel,
    DEFAULT_GEMINI_MODELS
  );
  const prompt = buildIntentPrompt(query, conversation, body.context);
  const errors: string[] = [];

  const candidates = [
    ...groqModels.map((model) => ({ provider: "groq", model, apiKey: groqApiKey })),
    ...geminiModels.map((model) => ({
      provider: "gemini",
      model,
      apiKey: geminiApiKey,
    })),
  ];

  for (const candidate of candidates) {
    if (!candidate.apiKey) continue;

    try {
      const text =
        candidate.provider === "groq"
          ? await requestGroqIntent(candidate.apiKey, candidate.model, prompt)
          : await requestGeminiIntent(candidate.apiKey, candidate.model, prompt);
      const parsed = parseSearchIntent(text);
      const parsedSearchQuery = normalizeResolvedQuery(parsed.searchQuery);
      const searchQuery = keepResolvedQueryOnTopic(query, parsedSearchQuery);
      if (!searchQuery) throw new Error("LLM returned an empty search query.");
      const area = normalizeResolvedArea(parsed.area) || resolveFallbackArea(conversation, body.context);

      const result = {
        originalQuery: query,
        searchQuery,
        intent: String(parsed.intent || "").replace(/\s+/g, " ").trim().slice(0, 100),
        area,
        source: candidate.provider,
        model: candidate.model,
        errorMessage: "",
      };
      searchIntentCache.set(cacheKey, {
        expiresAt: Date.now() + SEARCH_INTENT_CACHE_TTL_MS,
        response: result,
      });
      return result;
    } catch (error: any) {
      const message = error?.message || String(error);
      errors.push(`${candidate.provider}:${candidate.model}: ${message}`);
      console.warn(`[LLM][search-intent][${candidate.provider}:${candidate.model}]`, message);
    }
  }

  return {
    originalQuery: query,
    searchQuery: normalizeFallbackIntentTopic(
      [query, ...conversation.filter(item => item.role === "user").map(item => item.content)].join(" ")
    ),
    intent: "",
    area: resolveFallbackArea(conversation, body.context),
    source: "fallback",
    model: "script",
    errorMessage: errors.join(" | ") || "No free-tier LLM provider is configured.",
  };
});
