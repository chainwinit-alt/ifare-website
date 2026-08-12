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

export const DEFAULT_GROQ_MODELS = [
  "qwen/qwen3.6-27b",
  "openai/gpt-oss-120b",
];

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

function buildCacheKey(input: LlmSummaryInput) {
  return JSON.stringify({
    query: (input.query || input.context?.query || "").trim().toLowerCase(),
    context: input.context || {},
    cases: input.cases.map(item => ({ id: item.id, title: item.title })),
    conversation: input.conversation || [],
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

function getCachedSummary(input: LlmSummaryInput) {
  const key = buildCacheKey(input);
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
  ttlMs: number
) {
  removeExpiredCacheEntries();
  summaryCache.set(buildCacheKey(input), {
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
  config: FreeTierLlmConfig
): Promise<FreeTierSummaryResult> {
  const cached = getCachedSummary(input);
  if (cached) return cached;

  const candidates = [
    ...parseModelList(config.groqModels, DEFAULT_GROQ_MODELS).map((model) => ({
      provider: "groq" as const,
      model,
      apiKey: config.groqApiKey || "",
      client: createGroqClient({ apiKey: config.groqApiKey || "", model }),
    })),
    ...parseModelList(config.geminiModels, DEFAULT_GEMINI_MODELS).map((model) => ({
      provider: "gemini" as const,
      model,
      apiKey: config.geminiApiKey || "",
      client: createGeminiClient({ apiKey: config.geminiApiKey || "", model }),
    })),
  ];

  const errors: string[] = [];
  for (const candidate of candidates) {
    if (!candidate.apiKey) continue;
    const candidateKey = `${candidate.provider}:${candidate.model}`;
    if (isCoolingDown(candidateKey)) continue;

    try {
      const summary = (await candidate.client.summarize(input)).replace(/\s+/g, " ").trim();
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
        Number(config.summaryCacheTtlMs) || DEFAULT_CACHE_TTL_MS
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
