import { summarizeWithFreeTier } from "../../../utils/llm/freeTier";
import {
  buildFallbackSummary,
  normalizeSummaryQuery,
  sanitizeSummaryCases,
  sanitizeSummaryConversation,
} from "../../../utils/llm/shared";
import { enrichSummaryCases } from "../../../utils/llm/enrich";
import type {
  LlmSummaryCaseItem,
  LlmSummaryConversationMessage,
  LlmSummaryMode,
  LlmSummarySearchContext,
} from "../../../utils/llm/types";

interface SummaryPayload {
  query?: string;
  context?: LlmSummarySearchContext;
  cases?: LlmSummaryCaseItem[];
  conversation?: LlmSummaryConversationMessage[];
  provider?: string;
}

type PushEvent = (event: string, data: unknown) => void;

function getUtf8Bytes(value: string) {
  return new TextEncoder().encode(value || "").length;
}

function toKilobytes(bytes: number) {
  return Math.round((bytes / 1024) * 100) / 100;
}

function createSseResponse(handler: (push: PushEvent) => Promise<void>) {
  const encoder = new TextEncoder();

  return new Response(
    new ReadableStream({
      start(controller) {
        const push: PushEvent = (event, data) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        };

        (async () => {
          try {
            await handler(push);
          } catch (error) {
            console.warn("[LLM][sse]", error);
          } finally {
            controller.close();
          }
        })();
      },
    }),
    {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    }
  );
}

export default defineEventHandler(async (event) => {
  const body = (await readBody<SummaryPayload>(event)) || {};
  const config = useRuntimeConfig();
  const llmConfig = (config as any).llm || {};
  const query = normalizeSummaryQuery(body.query);

  if (!query) {
    return createSseResponse(async (push) => {
      push("meta", { provider: "auto", streaming: false, skipped: true });
      push("done", {
        summary: "",
        provider: "auto",
        fallback: false,
        skipped: true,
      });
    });
  }

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
  // 首次摘要且站內有相符政策 → 引用版結構化總覽（overview）；
  // 首次摘要但查無政策 → 清楚標示的一般知識總覽（overview_general，可用環境變數關閉）；
  // 追問對話 → 維持原本的一句話循序引導（guidance）。
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
  const input = {
    query,
    context: body.context,
    cases: enrichedCases,
    conversation,
    mode,
  };

  return createSseResponse(async (push) => {
    const startedAt = Date.now();
    const requestBytes = getUtf8Bytes(JSON.stringify(input));
    push("meta", {
      provider: "auto",
      model: "",
      mode,
      requestBytes,
      requestKilobytes: toKilobytes(requestBytes),
      streaming: false,
    });

    try {
      const result = await summarizeWithFreeTier(input, {
        geminiApiKey: llmConfig.geminiApiKey || "",
        geminiModels: llmConfig.geminiModels || llmConfig.geminiModel || "",
        groqApiKey: llmConfig.groqApiKey || "",
        groqModels: llmConfig.groqModels || llmConfig.groqModel || "",
        summaryCacheTtlMs: llmConfig.summaryCacheTtlMs,
      });
      const responseBytes = getUtf8Bytes(result.summary);
      const durationMs = Date.now() - startedAt;

      push("meta", {
        provider: result.provider,
        model: result.model,
        mode,
        cached: result.cached,
        streaming: false,
      });
      push("chunk", { delta: result.summary });
      push("done", {
        summary: result.summary,
        provider: result.provider,
        model: result.model,
        mode,
        cached: result.cached,
        fallback: false,
        requestBytes,
        requestKilobytes: toKilobytes(requestBytes),
        responseBytes,
        responseKilobytes: toKilobytes(responseBytes),
        totalBytes: requestBytes + responseBytes,
        totalKilobytes: toKilobytes(requestBytes + responseBytes),
        durationMs,
      });
    } catch (error: any) {
      console.warn("[LLM][stream]", error);
      const isConversation = conversation.length > 0;
      const summary = isConversation
        ? ""
        : buildFallbackSummary(query, enrichedCases, body.context, conversation);
      const responseBytes = getUtf8Bytes(summary);
      const durationMs = Date.now() - startedAt;

      if (summary) push("chunk", { delta: summary });
      push("error", {
        message: error?.message || "All free-tier LLM providers failed.",
        provider: isConversation ? "unavailable" : "fallback",
      });
      push("done", {
        summary,
        provider: isConversation ? "unavailable" : "fallback",
        model: isConversation ? "" : "script",
        mode: "guidance",
        cached: false,
        fallback: !isConversation,
        requestBytes,
        requestKilobytes: toKilobytes(requestBytes),
        responseBytes,
        responseKilobytes: toKilobytes(responseBytes),
        totalBytes: requestBytes + responseBytes,
        totalKilobytes: toKilobytes(requestBytes + responseBytes),
        durationMs,
      });
    }
  });
});
