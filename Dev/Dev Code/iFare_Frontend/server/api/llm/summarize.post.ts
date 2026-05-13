import { createLlmClient } from "../../utils/llm/factory";
import { enrichSummaryCases } from "../../utils/llm/enrich";
import { buildFallbackSummary, selectSummaryCases } from "../../utils/llm/shared";
import type { LlmSummaryCaseItem, LlmSummarySearchContext } from "../../utils/llm/types";

interface SummaryPayload {
  query?: string;
  context?: LlmSummarySearchContext;
  cases?: LlmSummaryCaseItem[];
  provider?: string;
}

export default defineEventHandler(async (event) => {
  const body = (await readBody<SummaryPayload>(event)) || {};
  const config = useRuntimeConfig();
  const llmConfig = (config as any).llm || {};
  const provider = "gemini";
  const cases = Array.isArray(body.cases) ? body.cases : [];

  if (cases.length === 0) {
    return {
      provider,
      summary: "先完成搜尋，AI 會依照目前找到的政策資料整理摘要。",
      errorMessage: "",
    };
  }

  const client = createLlmClient({
    provider,
    openaiApiKey: llmConfig.openaiApiKey || "",
    openaiModel: llmConfig.openaiModel || "gpt-4o-mini",
    geminiApiKey: llmConfig.geminiApiKey || "",
    geminiModel: llmConfig.geminiModel || "gemini-2.0-flash",
    ollamaBaseUrl: llmConfig.ollamaBaseUrl || "http://localhost:11434",
    ollamaModel: llmConfig.ollamaModel || "llama3.1",
  });

  const query = body.query || "";
  const summaryCases = selectSummaryCases(query, cases);
  const enrichedCases = await enrichSummaryCases(
    summaryCases,
    llmConfig.frontendApiServerBase || config.frontendApiServerBase || ""
  );

  let summary = "";
  let errorMessage = "";

  try {
    summary = await client.summarize({
      query,
      context: body.context,
      cases: enrichedCases,
    });
  } catch (error: any) {
    console.warn("[LLM][summarize]", error);
    errorMessage = error?.message || "";
    summary = buildFallbackSummary(query, enrichedCases);
  }

  return {
    provider,
    summary,
    errorMessage,
  };
});
