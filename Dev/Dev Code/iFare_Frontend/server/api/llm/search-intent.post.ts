import { GoogleGenAI } from "@google/genai";
import {
  DEFAULT_GEMINI_MODELS,
  parseModelList,
} from "../../utils/llm/freeTier";
import {
  extractExplicitSearchConditions,
  fixCommonTypos,
  normalizeFallbackIntentTopic,
  normalizeRespectfulPolicyTerm,
  type ExplicitSearchConditions,
} from "../../../utils/ifareIntent";
import {
  normalizeSummaryQuery,
  sanitizeSummaryConversation,
} from "../../utils/llm/shared";
import type {
  LlmSummaryConversationMessage,
  LlmSummarySearchContext,
} from "../../utils/llm/types";
import { createRateLimiter, getClientKey } from "~/server/utils/rateLimit";
import { createBoundedTtlCache } from "~/server/utils/boundedCache";

interface SearchIntentPayload {
  query?: string;
  conversation?: LlmSummaryConversationMessage[];
  context?: LlmSummarySearchContext;
}

interface SearchIntentResponse {
  searchQuery?: string;
  intent?: string;
  area?: string;
  recipient?: string;
  income?: string;
  identities?: unknown;
  // 召回概念詞：擴大搜尋用，不參與任何篩選條件。與其他欄位一樣為 optional，
  // parseSearchIntent 失敗時會 return {}，非 optional 會讓那幾條路徑編譯不過。
  recallConcepts?: string[];
  // 受助對象：排序提示用，判斷「這次求助主要為了誰」，不參與任何篩選條件。
  // 與其他欄位一樣為 optional，parseSearchIntent 失敗時會 return {}，非 optional 會讓那幾條路徑編譯不過。
  beneficiary?: string;
}

const SEARCH_INTENT_SYSTEM_PROMPT =
  "You convert a user's Traditional Chinese input (a keyword, several keywords, or a full question sentence) into one concise core topic and explicit structured search conditions for welfare policies inside i-Fare. Preserve the user's concrete main need and meaning. Silently correct obvious typos and homophone slips first (for example 老任津貼 means 老人津貼). If the input contains a concrete topic together with generic benefit or request words such as subsidy, allowance, welfare, policy, eligibility, apply, search, or what is available, omit those generic words from searchQuery and keep only the concrete topic. Convert colloquial, outdated, or stigmatizing expressions into respectful contemporary terminology commonly used in Taiwan welfare policies without diagnosing the user or inventing a narrower need. Resolve an explicitly supplied Taiwan county, city, township, town, city district, or district to its parent county or city in area. Extract recipient, income, and identities ONLY when the wording explicitly states them; never guess from context. Never derive any condition from candidate policies or assistant messages. If no concrete topic exists, preserve the original query. Do not infer a narrower service, benefit, identity, medical condition, or life event that the user did not mention. Additionally, output recallConcepts: an array of 1 to 5 Taiwan welfare-policy domain terms naming the welfare area the user's situation belongs to, used ONLY to broaden in-site search recall (for example 長期照顧, 失能, 失智, 無障礙, 輔具, 急難救助, 社會救助, 生活扶助, 失業, 就業, 身心障礙, 生育, 托育, 租金, 住宅, 原住民, 喪葬, 獨居). recallConcepts are for search expansion only and are never filter conditions; never place area, age, economic status, or identity into recallConcepts. If you cannot tell which welfare domain the situation belongs to, return an empty array; never pad it or invent expressions the site does not use. Additionally, output beneficiary: a single hint naming who this help request is mainly for — self (the applicant themselves), child (the applicant's child), elder (the applicant's parent or older relative), or family (another family member). beneficiary is only a ranking hint and never a filter condition; never use it to infer identity or age. If you cannot tell, return unknown. Return JSON only.";

// 站上篩選器的標準選項標籤；LLM 與本地抽取的結果都會收斂到這些值
const RECIPIENT_LABELS = ["嬰幼兒", "兒童＆青少年", "成人", "老人"] as const;
const INCOME_LABELS = ["低收入戶", "中低收入戶", "經濟弱勢"] as const;
const IDENTITY_LABELS = ["身心障礙", "特殊境遇", "重大傷病", "原住民", "新住民"] as const;

function normalizeOptionLabel(value: unknown) {
  return String(value ?? "")
    .replace(/臺/gu, "台")
    .replace(/[＆&及和]/gu, "")
    .replace(/[\s　]+/gu, "")
    .trim();
}

function matchOptionLabel(value: unknown, labels: readonly string[]) {
  const normalized = normalizeOptionLabel(value);
  if (!normalized) return "";
  return (
    labels.find((label) => {
      const normalizedLabel = normalizeOptionLabel(label);
      return normalized === normalizedLabel
        || normalized.includes(normalizedLabel)
        || normalizedLabel.includes(normalized);
    }) || ""
  );
}

function normalizeResolvedIdentities(value: unknown): string[] {
  const rawItems = Array.isArray(value)
    ? value
    : String(value ?? "").split(/[、,，/]/);
  return [...new Set(
    rawItems
      .map((item) => matchOptionLabel(item, IDENTITY_LABELS))
      .filter(Boolean)
  )];
}

// 使用者只寫實際歲數（「媽媽 80 歲」「6 個月大」）時，字面正則抽不出年齡區間，
// 但歲數確實是使用者自己講的，這種情況才放行 LLM 的年齡判斷
const EXPLICIT_AGE_PATTERN = /\d{1,3}\s*(?:歲|個月大)/u;

function hasExplicitAgeWording(query: string, conversation: LlmSummaryConversationMessage[]) {
  return [query, ...conversation.filter(item => item.role === "user").map(item => item.content)]
    .some(text => EXPLICIT_AGE_PATTERN.test(text));
}

/**
 * 字面白名單：LLM 抽到的條件，必須在使用者自己打過的字裡找得到依據才採用。
 *
 * 提示詞已經寫明「只有字面明確提到才填」，模型還是會從對話脈絡與已選條件推測——
 * 實測追問「資格為低收」，回來的是「中低收入戶」，還自己補了一個沒人提過的「老人」。
 * 這些欄位會被 applyResolvedSearchFilters 直接套進篩選器、當場改掉搜尋結果，
 * 寧可少抓也不能錯抓，所以一律以 extractExplicitSearchConditions（純正則、只認字面）為準。
 * 該抽取器已涵蓋常見同義詞（長輩→老人、身障→身心障礙、外籍配偶→新住民），
 * 正常的同義對應不會被這道防線擋掉；擋掉的是模型自己補的條件。
 */
function keepLiteralCondition(resolved: string, literal: string, allowResolved = false) {
  if (literal) return literal;
  return allowResolved ? resolved : "";
}

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
// 【快取上限｜問題 B】原本是裸 Map：無筆數上限、無過期清掃，key 又是整包 body，
// 不同 query 連打會讓它只增不減、撐爆記憶體。改用有上限的 TTL 快取——max 設 500、
// 過期時間沿用 SEARCH_INTENT_CACHE_TTL_MS，過期清掃與 LRU 淘汰都交給工具處理。
// 快取內容維持原本存的回應物件型別（Record<string, string>）。
const searchIntentCache = createBoundedTtlCache<Record<string, string>>({
  max: 500,
  ttlMs: SEARCH_INTENT_CACHE_TTL_MS,
});

// 每個 IP 每分鐘的請求上限：這支端點每次請求都可能觸發外部 LLM 呼叫，
// 沒有限流的話腳本連打就能燒光額度，所以設定每 IP 每分鐘上限。
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;
const searchIntentRateLimiter = createRateLimiter({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
});

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

/**
 * recallConcepts 是「擴大搜尋召回」用的站內福利概念詞，不參與任何篩選條件，
 * 因此不必過字面白名單（keepLiteralCondition），也不會被套成篩選器；只做基本清洗。
 * 模型偶爾會回非陣列、夾雜空白、或多到爆的清單，這裡一律收斂成
 * 「最多 5 個、每個至多 10 字、去重、去空」的字串陣列；不是陣列就當空陣列。
 */
function sanitizeRecallConcepts(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const cleaned = value
    .map((item) => String(item ?? "").trim().slice(0, 10))
    .filter(Boolean);
  return [...new Set(cleaned)].slice(0, 5);
}

/**
 * beneficiary 是「這次求助主要是為了誰」的排序提示（self／child／elder／family），
 * 和 recallConcepts 一樣只是搜尋輔助線索，完全不參與任何篩選條件、也不會進 conditionsText，
 * 因此不必過字面白名單（keepLiteralCondition），也不會被套成篩選器；只做基本收斂。
 * 模型可能回大小寫不一、夾空白、或清單外的值，這裡一律收斂成上述四個字面值之一；
 * 不在清單內（含判斷不出）一律回 "unknown"，確保永遠是契約定義的五個值之一。
 */
function sanitizeBeneficiary(value: unknown): string {
  const normalized = String(value ?? "").trim().toLowerCase();
  return (["self", "child", "elder", "family"] as const).includes(normalized as any)
    ? normalized
    : "unknown";
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

/**
 * 確認 LLM 沒有把使用者明確提到的主題改掉。
 * conditionsText：已被抽成結構化條件（地區／年齡／經濟／身分）的內容也算「有保留」，
 * 例如「低收入戶」被放進 income 後，searchQuery 不需要再包含它。
 */
function keepResolvedQueryOnTopic(
  originalQuery: string,
  resolvedQuery: string,
  conditionsText = ""
) {
  const normalizedOriginal = normalizeRespectfulPolicyTerm(originalQuery);
  const normalizedResolved = normalizeRespectfulPolicyTerm(
    `${resolvedQuery} ${conditionsText}`
  );
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
    "輸入可能是整句問句（例如「老人可以申請甚麼補助？」）或多個關鍵字併列（例如「低收入戶 新北市 老人津貼」）；請把問句詞與標點去掉、整併成一個核心搜尋詞，並把條件拆到對應欄位。",
    "輸入若有明顯錯字或同音誤植（例如「老任津貼」應為「老人津貼」），請直接修正後再處理，不要保留錯字。",
    `recipient：只有使用者字面明確提到年齡族群時才填，值必須是「${RECIPIENT_LABELS.join("、")}」其中之一（老人、長者、長輩都對應「老人」；嬰兒、新生兒對應「嬰幼兒」），否則回空字串。`,
    `income：只有字面明確提到經濟條件時才填，值必須是「${INCOME_LABELS.join("、")}」其中之一，否則回空字串。`,
    `identities：只有字面明確提到特殊身分時才填，值只能從「${IDENTITY_LABELS.join("、")}」挑選，可複數，否則回空陣列。`,
    "已拆進 recipient、income、identities 的條件詞，searchQuery 不必重複；但若整個輸入只有那個條件詞（例如只輸入「低收入戶」），searchQuery 仍保留它。",
    "intent 請用一句簡短繁體中文描述判斷到的需求。",
    "recallConcepts：除了上述欄位，另輸出 1 到 5 個描述使用者處境所屬福利領域的台灣福利政策常用詞，用途只是擴大站內搜尋召回。請用政策實際會出現的詞，例如：長期照顧、失能、失智、無障礙、輔具、急難救助、社會救助、生活扶助、失業、就業、身心障礙、生育、托育、租金、住宅、原住民、喪葬、獨居。",
    "recallConcepts 只用於擴大搜尋、不是篩選條件；不得把地區、年齡、經濟、身分放進 recallConcepts；判斷不出處境所屬領域時回空陣列，不要硬湊、不要編造站內不存在的說法。",
    'recallConcepts 範例：「我缺錢可以怎麼辦」可回 ["低收入","急難救助","社會救助","生活扶助"]；「我媽媽走路不方便要人照顧」可回 ["長期照顧","失能","照顧服務"]。',
    "beneficiary：另外判斷「這次求助主要是為了誰」，值必須是 self（申請人本人）、child（申請人的子女）、elder（申請人的父母或長輩）、family（其他家人）其中之一；判斷不出回 unknown。",
    "beneficiary 只是排序提示、不是篩選條件；不要據此推斷身分或年齡。例如「我兩個月沒工作怎麼辦」回 self；「我小孩要註冊沒錢」回 child；「我媽媽失智」回 elder。",
    '只輸出 JSON：{"searchQuery":"核心搜尋詞","intent":"需求描述","area":"標準縣市或空字串","recipient":"年齡族群或空字串","income":"經濟條件或空字串","identities":["特殊身分"],"recallConcepts":["站內福利概念詞"],"beneficiary":"self｜child｜elder｜family｜unknown"}',
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
  // 【限流｜問題 A】放在處理器最前面（讀 body／快取之前）：超限直接回 429、
  // 並帶 Retry-After，完全不觸發下游的 LLM 呼叫，用來擋腳本連打燒額度。
  const rl = searchIntentRateLimiter(getClientKey(event));
  if (!rl.allowed) {
    setResponseHeader(event, "Retry-After", String(rl.retryAfter));
    throw createError({
      statusCode: 429,
      statusMessage: "Too many requests",
      data: { retryAfter: rl.retryAfter },
    });
  }

  const body = (await readBody<SearchIntentPayload>(event)) || {};
  // 先修常見錯字（老任津貼→老人津貼），LLM 與本地抽取都吃修正後的字串
  const query = fixCommonTypos(normalizeSummaryQuery(body.query)).trim();
  const conversation = sanitizeSummaryConversation(body.conversation);

  if (!query) {
    return {
      originalQuery: "",
      searchQuery: "",
      intent: "",
      area: "",
      recipient: "",
      income: "",
      identities: [] as string[],
      recallConcepts: [] as string[],
      // 空查詢早退：沒有 LLM 輸出可判斷受助對象，一律回 "unknown"（維持回應契約）
      beneficiary: "unknown",
      source: "skipped",
      model: "",
      errorMessage: "",
    };
  }

  // 本地正則抽取：LLM 可用時補漏，LLM 全掛時作為完整兜底
  const localConditions: ExplicitSearchConditions = extractExplicitSearchConditions(
    [query, ...conversation.filter(item => item.role === "user").map(item => item.content)].join(" ")
  );

  const cacheKey = JSON.stringify({ query, conversation, context: body.context || {} });
  // 過期與 LRU 淘汰都由 createBoundedTtlCache 內部處理，命中即直接回傳存好的回應
  const cached = searchIntentCache.get(cacheKey);
  if (cached) return cached;

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
      // 條件欄位一律過字面白名單：字面有依據就以字面為準（實測「低收」被 LLM 讀成中低收入戶），
      // 字面完全沒依據就不採用，免得模型推測出來的條件被自動套成篩選器
      const recipient = keepLiteralCondition(
        matchOptionLabel(parsed.recipient, RECIPIENT_LABELS),
        localConditions.recipient,
        hasExplicitAgeWording(query, conversation)
      );
      const income = keepLiteralCondition(
        matchOptionLabel(parsed.income, INCOME_LABELS),
        localConditions.income
      );
      const identities = [...new Set([
        // 身分不接受任何推論：模型會從病名或家庭狀況推出「重大傷病」「特殊境遇」，
        // 那是使用者沒說過的標籤，必須有字面背書才留下
        ...normalizeResolvedIdentities(parsed.identities).filter(item => localConditions.identities.includes(item)),
        ...localConditions.identities,
      ])];
      const conditionsText = [recipient, income, identities.join(" ")].filter(Boolean).join(" ");
      const searchQuery = keepResolvedQueryOnTopic(query, parsedSearchQuery, conditionsText) || query;
      const area = normalizeResolvedArea(parsed.area)
        || localConditions.area
        || resolveFallbackArea(conversation, body.context);
      // recallConcepts 只是搜尋召回用的概念詞，與上面的篩選條件（recipient／income／identities／area）
      // 完全無關：不過字面白名單、不會被套進任何篩選器，僅做基本清洗後隨回應一起帶給前端擴大搜尋。
      const recallConcepts = sanitizeRecallConcepts(parsed.recallConcepts);
      // beneficiary 同樣只是「這次求助主要為了誰」的排序提示，和 recallConcepts 一樣完全不參與篩選條件：
      // 不過字面白名單、不會被套進任何篩選器、也刻意不併入上面的 conditionsText；只做收斂後帶給前端當排序線索。
      const beneficiary = sanitizeBeneficiary(parsed.beneficiary);

      const result = {
        originalQuery: query,
        searchQuery,
        intent: String(parsed.intent || "").replace(/\s+/g, " ").trim().slice(0, 100),
        area,
        recipient,
        income,
        identities,
        recallConcepts,
        beneficiary,
        source: candidate.provider,
        model: candidate.model,
        errorMessage: "",
      };
      // 過期時間由快取工具依 ttlMs 自動計算，這裡只存回應本身
      searchIntentCache.set(cacheKey, result);
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
    area: localConditions.area || resolveFallbackArea(conversation, body.context),
    recipient: localConditions.recipient,
    income: localConditions.income,
    identities: localConditions.identities,
    // fallback 沒有 LLM 輸出可解析，召回概念詞一律回空陣列（維持回應契約）
    recallConcepts: [] as string[],
    // fallback 同樣沒有 LLM 輸出可判斷受助對象，一律回 "unknown"（維持回應契約）
    beneficiary: "unknown",
    source: "fallback",
    model: "script",
    // 【去敏｜問題 C】errors 內含供應商名、型號、配額訊息，逐筆已在上方 catch 的
    // console.warn 記到伺服器端；回給前端的 errorMessage 只給通用字串，不外洩內部細節
    errorMessage: "AI 服務暫時無法使用",
  };
});
