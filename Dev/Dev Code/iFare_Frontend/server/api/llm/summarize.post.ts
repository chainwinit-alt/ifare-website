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
  LlmSummarySearchContext,
} from "../../utils/llm/types";

interface SummaryPayload {
  query?: string;
  context?: LlmSummarySearchContext;
  cases?: LlmSummaryCaseItem[];
  conversation?: LlmSummaryConversationMessage[];
  provider?: string;
}

export default defineEventHandler(async (event) => {
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

  try {
    const result = await summarizeWithFreeTier(
      {
        query,
        context: body.context,
        cases: enrichedCases,
        conversation,
      },
      {
        geminiApiKey: llmConfig.geminiApiKey || "",
        geminiModels: llmConfig.geminiModels || llmConfig.geminiModel || "",
        groqApiKey: llmConfig.groqApiKey || "",
        groqModels: llmConfig.groqModels || llmConfig.groqModel || "",
        summaryCacheTtlMs: llmConfig.summaryCacheTtlMs,
      }
    );
    summary = result.summary;
    resolvedProvider = result.provider;
    model = result.model;
    cached = result.cached;
  } catch (error: any) {
    console.warn("[LLM][summarize]", error);
    errorMessage = error?.message || "";
    summary = conversation.length
      ? ""
      : buildFallbackSummary(query, enrichedCases, body.context, conversation);
  }

  return {
    provider: resolvedProvider,
    model,
    cached,
    summary,
    errorMessage,
  };
});
