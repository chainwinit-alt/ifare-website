import { createGeminiClient, createGroqClient } from "./providers";
import type {
  LlmProviderName,
  LlmSummaryInput,
} from "./types";

export const DEFAULT_GEMINI_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash-lite",
];

// 2026-08-12：qwen/qwen3.6-27b 為 Groq Preview 模型（官方警告可能隨時下架），
// 改用 Production 的 gpt-oss 系列，成本較低且支援 prompt caching。
export const DEFAULT_GROQ_MODELS = [
  "openai/gpt-oss-20b",
  "openai/gpt-oss-120b",
];

/**
 * 指定要用哪一個模型（開發時比較模型用）。
 *
 * 指定之後就不做候選退讓——比較模型時最怕的是「以為在測 A，其實 A 掛了退到 B」，
 * 那會得出完全相反的結論。指定的模型失敗就直接讓它失敗，看得見才修得掉。
 */
export interface ModelOverride {
  provider?: string;
  model?: string;
}

interface ResolvedModelOverride {
  provider: LlmProviderName;
  model: string;
}

/** 從型號名稱推供應商：gemini 開頭的是 Gemini，其餘走 Groq */
function resolveModelOverride(override?: ModelOverride): ResolvedModelOverride | null {
  const model = String(override?.model || "").trim();
  const rawProvider = String(override?.provider || "").trim().toLowerCase();
  const provider: LlmProviderName | "" =
    rawProvider === "gemini" || rawProvider === "groq" ? rawProvider : "";

  if (!model) return provider ? { provider, model: "" } : null;
  return { provider: provider || (/^gemini/iu.test(model) ? "gemini" : "groq"), model };
}

export interface FreeTierLlmConfig {
  geminiApiKey?: string;
  geminiModels?: string | string[];
  groqApiKey?: string;
  groqModels?: string | string[];
  summaryCacheTtlMs?: number;
}

export interface FreeTierSummaryResult {
  provider: LlmProviderName;
  model: string;
  summary: string;
  cached: boolean;
}

const summaryCache = new Map<
  string,
  { expiresAt: number; result: FreeTierSummaryResult }
>();
const providerCooldowns = new Map<string, number>();
const MAX_CACHE_ENTRIES = 500;
const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const RATE_LIMIT_COOLDOWN_MS = 10 * 60 * 1000;
const BLOCKED_MODEL_COOLDOWN_MS = 60 * 60 * 1000;

export function parseModelList(
  value: string | string[] | undefined,
  fallback: string[]
) {
  const values = Array.isArray(value) ? value : String(value || "").split(",");
  const normalized = values.map((item) => item.trim()).filter(Boolean);
  return [...new Set(normalized.length ? normalized : fallback)];
}

/**
 * override：指定了供應商／型號時要獨立一個快取桶。
 *
 * 不分開的話，換一個模型重跑會直接拿回上一個模型寫好的字——比較模型時
 * 兩邊看起來一模一樣，會誤以為模型沒有差別。沒指定時 key 與原本完全相同，
 * 正常流量的快取命中率不受影響。
 */
function buildCacheKey(input: LlmSummaryInput, override?: ResolvedModelOverride) {
  return JSON.stringify({
    mode: input.mode || "guidance",
    query: (input.query || input.context?.query || "").trim().toLowerCase(),
    context: input.context || {},
    cases: input.cases.map(item => ({ id: item.id, title: item.title })),
    conversation: input.conversation || [],
    scopeHint: input.scopeHint || null,
    ...(override ? { override: `${override.provider}:${override.model}` } : {}),
  });
}

function removeExpiredCacheEntries() {
  const now = Date.now();
  for (const [key, item] of summaryCache) {
    if (item.expiresAt <= now) summaryCache.delete(key);
  }

  while (summaryCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = summaryCache.keys().next().value;
    if (!oldestKey) break;
    summaryCache.delete(oldestKey);
  }
}

function getCachedSummary(input: LlmSummaryInput, override?: ResolvedModelOverride) {
  const key = buildCacheKey(input, override);
  const item = summaryCache.get(key);
  if (!item) return null;
  if (item.expiresAt <= Date.now()) {
    summaryCache.delete(key);
    return null;
  }

  summaryCache.delete(key);
  summaryCache.set(key, item);
  return { ...item.result, cached: true };
}

function setCachedSummary(
  input: LlmSummaryInput,
  result: FreeTierSummaryResult,
  ttlMs: number,
  override?: ResolvedModelOverride
) {
  removeExpiredCacheEntries();
  summaryCache.set(buildCacheKey(input, override), {
    expiresAt: Date.now() + ttlMs,
    result: { ...result, cached: false },
  });
}

function isRateLimitError(error: unknown) {
  const message = String((error as any)?.message || error || "");
  return /\b429\b|resource[_ ]exhausted|rate limit|quota/iu.test(message);
}

function isBlockedModelError(error: unknown) {
  const message = String((error as any)?.message || error || "");
  return /model_permission_blocked|blocked at the (?:project|organization) level|permissions_error/iu.test(message);
}

function isCoolingDown(candidateKey: string) {
  const expiresAt = providerCooldowns.get(candidateKey) || 0;
  if (expiresAt <= Date.now()) {
    providerCooldowns.delete(candidateKey);
    return false;
  }
  return true;
}

export async function summarizeWithFreeTier(
  input: LlmSummaryInput,
  config: FreeTierLlmConfig,
  // 使用者按「重新摘要」時要跳過這層快取。不跳的話同樣的條件會拿回一模一樣的
  // 字，按了等於沒事發生——那顆按鈕的意義就沒了。產生後照樣寫回快取。
  options?: { skipCache?: boolean } & ModelOverride
): Promise<FreeTierSummaryResult> {
  const override = resolveModelOverride(options);
  const cached = options?.skipCache ? null : getCachedSummary(input, override || undefined);
  if (cached) return cached;

  const makeCandidate = (provider: LlmProviderName, model: string) =>
    provider === "gemini"
      ? {
          provider: "gemini" as const,
          model,
          apiKey: config.geminiApiKey || "",
          client: createGeminiClient({ apiKey: config.geminiApiKey || "", model }),
        }
      : {
          provider: "groq" as const,
          model,
          apiKey: config.groqApiKey || "",
          client: createGroqClient({ apiKey: config.groqApiKey || "", model }),
        };

  const allCandidates = [
    ...parseModelList(config.groqModels, DEFAULT_GROQ_MODELS).map((model) =>
      makeCandidate("groq", model)
    ),
    ...parseModelList(config.geminiModels, DEFAULT_GEMINI_MODELS).map((model) =>
      makeCandidate("gemini", model)
    ),
  ];

  // 指定了型號就只跑那一個（型號不在設定清單裡也照跑，才測得到還沒設定的新模型）；
  // 只指定供應商則在該供應商的清單內照原本的順序退讓。
  const candidates = override?.model
    ? [makeCandidate(override.provider, override.model)]
    : override?.provider
      ? allCandidates.filter((candidate) => candidate.provider === override.provider)
      : allCandidates;

  const errors: string[] = [];
  for (const candidate of candidates) {
    if (!candidate.apiKey) continue;
    const candidateKey = `${candidate.provider}:${candidate.model}`;
    // 指定型號時不看冷卻：要測的就是它，被跳過會讓人以為測過了
    if (!override?.model && isCoolingDown(candidateKey)) continue;

    try {
      const rawSummary = await candidate.client.summarize(input);
      // overview / overview_general / answer 是多段 Markdown，換行就是版面結構，
      // 只能收斂行內空白；guidance 維持原本的單行輸出。
      const isMarkdownMode = input.mode === "overview"
        || input.mode === "overview_general"
        || input.mode === "answer";
      const summary = isMarkdownMode
        ? rawSummary.replace(/[ \t]+/g, " ").trim()
        : rawSummary.replace(/\s+/g, " ").trim();
      if (!summary) throw new Error("LLM returned an empty summary.");

      const result: FreeTierSummaryResult = {
        provider: candidate.provider,
        model: candidate.model,
        summary,
        cached: false,
      };
      setCachedSummary(
        input,
        result,
        Number(config.summaryCacheTtlMs) || DEFAULT_CACHE_TTL_MS,
        override || undefined
      );
      return result;
    } catch (error: any) {
      const message = error?.message || String(error);
      errors.push(`${candidateKey}: ${message}`);
      console.warn(`[LLM][free-tier][${candidateKey}]`, message);
      if (isRateLimitError(error)) {
        providerCooldowns.set(candidateKey, Date.now() + RATE_LIMIT_COOLDOWN_MS);
      } else if (isBlockedModelError(error)) {
        providerCooldowns.set(candidateKey, Date.now() + BLOCKED_MODEL_COOLDOWN_MS);
      }
    }
  }

  throw new Error(errors.join(" | ") || "No free-tier LLM provider is configured.");
}
