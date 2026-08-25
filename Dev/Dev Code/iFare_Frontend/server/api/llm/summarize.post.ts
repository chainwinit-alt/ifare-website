import { summarizeWithFreeTier } from "../../utils/llm/freeTier";
import {
  buildFallbackSummary,
  normalizeSummaryQuery,
  sanitizeSummaryCases,
  sanitizeSummaryConversation,
} from "../../utils/llm/shared";
import { enrichSummaryCases } from "../../utils/llm/enrich";
import type {
  LlmSummaryCaseItem,
  LlmSummaryConversationMessage,
  LlmSummaryMode,
  LlmSummarySearchContext,
} from "../../utils/llm/types";
import { createRateLimiter, getClientKey } from "~/server/utils/rateLimit";

interface SummaryPayload {
  query?: string;
  context?: LlmSummarySearchContext;
  cases?: LlmSummaryCaseItem[];
  conversation?: LlmSummaryConversationMessage[];
  provider?: string;
}

// 每個 IP 每分鐘的請求上限：這支端點每次請求都會觸發外部 LLM 呼叫，
// 沒有限流的話腳本連打就能燒光額度，所以設定每 IP 每分鐘上限。
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;
const summaryRateLimiter = createRateLimiter({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
});

export default defineEventHandler(async (event) => {
  // 【限流｜問題 A】放在處理器最前面（讀 body／快取之前）：超限直接回 429、
  // 並帶 Retry-After，完全不觸發下游的 LLM 呼叫，用來擋腳本連打燒額度。
  const rl = summaryRateLimiter(getClientKey(event));
  if (!rl.allowed) {
    setResponseHeader(event, "Retry-After", String(rl.retryAfter));
    throw createError({
      statusCode: 429,
      statusMessage: "Too many requests",
      data: { retryAfter: rl.retryAfter },
    });
  }

  const body = (await readBody<SummaryPayload>(event)) || {};
  const config = useRuntimeConfig();
  const llmConfig = (config as any).llm || {};
  const provider = "auto";
  const query = normalizeSummaryQuery(body.query);

  if (!query) {
    return {
      provider,
      summary: "",
      errorMessage: "",
    };
  }

  let summary = "";
  let errorMessage = "";
  let resolvedProvider: string = provider;
  let model = "";
  let cached = false;
  const conversation = sanitizeSummaryConversation(body.conversation);
  const receivedCases = sanitizeSummaryCases(body.cases, 3);
  const enrichedCases = sanitizeSummaryCases(
    await enrichSummaryCases(
      receivedCases,
      String((config as any).frontendApiServerBase || ""),
      3
    ),
    3
  );

  // 與 stream 版一致：首次摘要有政策 → overview；查無政策 → overview_general；追問 → guidance
  const generalFallbackEnabled = !["0", "false", "off"].includes(
    String(
      llmConfig.summaryGeneralFallback
        ?? process.env.NUXT_LLM_SUMMARY_GENERAL_FALLBACK
        ?? "true"
    ).toLowerCase()
  );
  const mode: LlmSummaryMode = conversation.length > 0
    ? "guidance"
    : enrichedCases.length > 0
      ? "overview"
      : generalFallbackEnabled
        ? "overview_general"
        : "guidance";

  try {
    const result = await summarizeWithFreeTier(
      {
        query,
        context: body.context,
        cases: enrichedCases,
        conversation,
        mode,
      },
      {
        geminiApiKey: llmConfig.geminiApiKey || "",
        // 跟串流版同源：摘要有自己的 Gemini 與 Groq 清單，也有自己的供應商順序
        geminiModels:
          llmConfig.geminiSummaryModels || llmConfig.geminiModels || llmConfig.geminiModel || "",
        groqApiKey: llmConfig.groqApiKey || "",
        groqModels:
          llmConfig.groqSummaryModels || llmConfig.groqModels || llmConfig.groqModel || "",
        providerOrder: llmConfig.summaryProviderOrder || "",
        summaryCacheTtlMs: llmConfig.summaryCacheTtlMs,
      }
    );
    summary = result.summary;
    resolvedProvider = result.provider;
    model = result.model;
    cached = result.cached;
  } catch (error: any) {
    // 原始錯誤（含供應商名、型號、配額訊息）只留在伺服器端 log
    console.warn("[LLM][summarize]", error);
    // 【去敏｜問題 C】回給前端的 errorMessage 改用通用字串，不外洩上游內部細節
    errorMessage = "AI 服務暫時無法使用";
    summary = conversation.length
      ? ""
      : buildFallbackSummary(query, enrichedCases, body.context, conversation);
  }

  return {
    provider: resolvedProvider,
    model,
    mode,
    cached,
    summary,
    errorMessage,
  };
});
