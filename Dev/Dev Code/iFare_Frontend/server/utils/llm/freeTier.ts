import { createGeminiClient, createGroqClient } from "./providers";
import { clampOverviewLead } from "./shared";
import type {
  LlmProviderName,
  LlmSummaryDeltaHandler,
  LlmSummaryInput,
} from "./types";

// 2026-08-21：移除 gemini-2.5-flash-lite。Google 已對新用戶下架，API 直接回 404：
//「This model models/gemini-2.5-flash-lite is no longer available to new users.
//  Please update your code to use models/gemini-3.5-flash-lite」。
// 它原本掛在候選鏈最後一棒，前面全部失敗時會再白打一次註定 404 的請求才掉到
// 本地腳本——等於每次全鏈失敗都多付一趟往返延遲，卻不可能成功。
// 清單同步 nuxt.config.ts 的 llm.geminiModels 預設值。
export const DEFAULT_GEMINI_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
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
  /**
   * 供應商的嘗試順序，"gemini" 開頭表示 Gemini 先跑，其餘（含未設定）維持 Groq 先跑。
   *
   * 2026-08-24：AI 摘要的問答改成 Gemini 優先。跨 12 個政策類別實測，兩個 gemini 模型
   * 沒有出現過編造、斷定資格或把符合資格者擋掉的情形，gpt-oss 系列則三種都出現過。
   * 只有摘要走這個設定；聊天機器人與意圖判讀各自組裝候選，不受影響。
   */
  providerOrder?: string;
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
  // signal：呼叫端（SSE 端點）的中止訊號。client 斷線時要一路傳到供應商的 fetch，
  // 否則民眾關掉頁面後，這裡還會把剩下的候選一個個試完，白燒額度。
  options?: {
    skipCache?: boolean;
    onDelta?: LlmSummaryDeltaHandler;
    signal?: AbortSignal;
  } & ModelOverride
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

  const groqCandidates = parseModelList(config.groqModels, DEFAULT_GROQ_MODELS).map((model) =>
    makeCandidate("groq", model)
  );
  const geminiCandidates = parseModelList(config.geminiModels, DEFAULT_GEMINI_MODELS).map((model) =>
    makeCandidate("gemini", model)
  );

  // 順序沒設就維持原本的 Groq 優先，這樣其他呼叫端（沒傳 providerOrder 的）行為完全不變。
  const geminiFirst = /^gemini/iu.test(String(config.providerOrder || "").trim());
  const allCandidates = geminiFirst
    ? [...geminiCandidates, ...groqCandidates]
    : [...groqCandidates, ...geminiCandidates];

  // 指定了型號就只跑那一個（型號不在設定清單裡也照跑，才測得到還沒設定的新模型）；
  // 只指定供應商則在該供應商的清單內照原本的順序退讓。
  const candidates = override?.model
    ? [makeCandidate(override.provider, override.model)]
    : override?.provider
      ? allCandidates.filter((candidate) => candidate.provider === override.provider)
      : allCandidates;

  const errors: string[] = [];
  for (const candidate of candidates) {
    // 已經斷線（或整體逾時）就不要再往下試——沒有人在等這篇字了
    if (options?.signal?.aborted) break;
    if (!candidate.apiKey) continue;
    const candidateKey = `${candidate.provider}:${candidate.model}`;
    // 指定型號時不看冷卻：要測的就是它，被跳過會讓人以為測過了
    if (!override?.model && isCoolingDown(candidateKey)) continue;

    try {
      // 逐段回呼交給 client 自己決定要不要用（目前只有 Groq 走串流）。
      // 額度不足或金鑰錯誤都是在讀 body 之前就以非 2xx 回來，所以退讓到下一個
      // 候選時，前面那個不會已經吐出半篇文字到畫面上。
      const rawSummary = await candidate.client.summarize(
        input,
        options?.onDelta,
        options?.signal
      );
      // overview / overview_general / answer 是多段 Markdown，換行就是版面結構，
      // 只能收斂行內空白；guidance 維持原本的單行輸出。
      const isMarkdownMode = input.mode === "overview"
        || input.mode === "overview_general"
        || input.mode === "answer";
      const cleaned = isMarkdownMode
        ? rawSummary.replace(/[ \t]+/g, " ").trim()
        : rawSummary.replace(/\s+/g, " ").trim();
      // 只有帶政策的首次摘要需要收開頭段；查無政策（overview_general）與
      // 回答問題（answer）的版面不同，交給各自的提示詞控制。
      const summary = input.mode === "overview" ? clampOverviewLead(cleaned) : cleaned;
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
      // 斷線造成的失敗不是這個候選的問題，也沒有必要退讓——直接收工
      if (options?.signal?.aborted) break;
      if (isRateLimitError(error)) {
        providerCooldowns.set(candidateKey, Date.now() + RATE_LIMIT_COOLDOWN_MS);
      } else if (isBlockedModelError(error)) {
        providerCooldowns.set(candidateKey, Date.now() + BLOCKED_MODEL_COOLDOWN_MS);
      }
    }
  }

  throw new Error(errors.join(" | ") || "No free-tier LLM provider is configured.");
}
