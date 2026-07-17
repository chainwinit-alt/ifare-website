import { GoogleGenAI } from "@google/genai";
import { enrichSummaryCases } from "../../../utils/llm/enrich";
import {
  buildFallbackSummary,
  buildSummaryPrompt,
  normalizeLlmSummaryByQuery,
  selectSummaryCases,
} from "../../../utils/llm/shared";
import type { LlmSummaryCaseItem, LlmSummarySearchContext } from "../../../utils/llm/types";

interface SummaryPayload {
  query?: string;
  context?: LlmSummarySearchContext;
  cases?: LlmSummaryCaseItem[];
  provider?: string;
}

type PushEvent = (event: string, data: unknown) => void;

const SUMMARY_SYSTEM_PROMPT =
  "You are a polite i-Fare policy summary assistant. Reply in Traditional Chinese. Be warm, concise, and helpful. If the user's keywords or filters are incomplete, do not point that out and do not ask for missing information. Instead, infer carefully from the available cases and use cautious wording. Do not force unrelated policies into the answer. If a policy is not clearly relevant to the user's search intent, omit it instead of stretching the interpretation.";

function getUtf8Bytes(value: string) {
  return new TextEncoder().encode(value || "").length;
}

function toKilobytes(bytes: number) {
  return Math.round((bytes / 1024) * 100) / 100;
}

function summarizeQuery(query: string) {
  const compact = (query || "").replace(/\s+/g, " ").trim();
  if (!compact) return "";
  return compact.length > 80 ? `${compact.slice(0, 80)}...` : compact;
}

function formatTrafficSummary(usage: {
  totalKilobytes: number;
  requestKilobytes: number;
  responseKilobytes: number;
  model: string;
  durationMs: number;
  queryPreview: string;
}) {
  const queryPart = usage.queryPreview ? ` query="${usage.queryPreview}"` : "";
  return `[LLM][traffic] total=${usage.totalKilobytes}KB request=${usage.requestKilobytes}KB response=${usage.responseKilobytes}KB model=${usage.model} duration=${usage.durationMs}ms${queryPart}`;
}

function createSseResponse(handler: (push: PushEvent) => Promise<void>) {
  const encoder = new TextEncoder();

  return new Response(
    new ReadableStream({
      start(controller) {
        const push: PushEvent = (event, data) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
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

function emitFallbackAsChunks(push: PushEvent, text: string) {
  const paragraphs = text.split(/\n{2,}/);
  let current = "";
  for (const paragraph of paragraphs) {
    current = current ? `${current}\n\n${paragraph}` : paragraph;
    push("chunk", { delta: paragraph });
  }
  return current || text;
}

export default defineEventHandler(async (event) => {
  const body = (await readBody<SummaryPayload>(event)) || {};
  const config = useRuntimeConfig();
  const llmConfig = (config as any).llm || {};
  const provider = "gemini";
  const query = body.query || "";
  const cases = Array.isArray(body.cases) ? body.cases : [];
  const summaryCases = selectSummaryCases(query, cases);
  const enrichedCases = await enrichSummaryCases(
    summaryCases,
    llmConfig.frontendApiServerBase || config.frontendApiServerBase || ""
  );
  const prompt = buildSummaryPrompt(query, enrichedCases, body.context);

  if (enrichedCases.length === 0) {
    const emptySummary = buildFallbackSummary(query, enrichedCases);
    return createSseResponse(async (push) => {
      push("meta", { provider, streaming: false, fallback: true });
      emitFallbackAsChunks(push, emptySummary);
      push("done", { summary: emptySummary, provider, fallback: true });
    });
  }

  return createSseResponse(async (push) => {
    const model = llmConfig.geminiModel || "gemini-2.0-flash";
    const startedAt = Date.now();
    const requestPayload = {
      model,
      contents: prompt,
      config: {
        systemInstruction: SUMMARY_SYSTEM_PROMPT,
        temperature: 0.3,
      },
    };
    const requestBytes = getUtf8Bytes(JSON.stringify(requestPayload));
    const usageBase = {
      provider,
      model,
      requestBytes,
      requestKilobytes: toKilobytes(requestBytes),
    };

    push("meta", { ...usageBase, streaming: true });

    let summary = "";
    let hadChunk = false;
    let responseBytes = 0;
    const append = (delta: string) => {
      if (!delta) return;
      hadChunk = true;
      summary += delta;
      responseBytes += getUtf8Bytes(delta);
    };

    try {
      const apiKey = llmConfig.geminiApiKey || "";
      if (!apiKey) throw new Error("Gemini API key is not configured.");
      const ai = new GoogleGenAI({
        apiKey,
        apiVersion: "v1beta",
      });

      const response = await ai.models.generateContentStream(requestPayload);

      for await (const chunk of response) {
        append(chunk.text || "");
      }

      if (!hadChunk) {
        summary = buildFallbackSummary(query, enrichedCases);
      } else {
        summary = normalizeLlmSummaryByQuery(
          query,
          body.context,
          summary,
          buildFallbackSummary(query, enrichedCases)
        );
        responseBytes = getUtf8Bytes(summary);
      }
      push("chunk", { delta: summary });

      const durationMs = Date.now() - startedAt;
      const totalBytes = requestBytes + responseBytes;
      const usage = {
        ...usageBase,
        responseBytes,
        responseKilobytes: toKilobytes(responseBytes),
        totalBytes,
        totalKilobytes: toKilobytes(totalBytes),
        durationMs,
        queryPreview: summarizeQuery(query),
      };
      console.info(formatTrafficSummary(usage));
      console.info("[LLM][traffic][detail]", usage);
      push("done", {
        summary,
        ...usage,
        fallback: !hadChunk,
      });
    } catch (error: any) {
      console.warn("[LLM][stream]", error);
      if (!hadChunk) {
        summary = buildFallbackSummary(query, enrichedCases);
        push("chunk", { delta: summary });
      }
      const durationMs = Date.now() - startedAt;
      const totalBytes = requestBytes + responseBytes;
      const usage = {
        ...usageBase,
        responseBytes,
        responseKilobytes: toKilobytes(responseBytes),
        totalBytes,
        totalKilobytes: toKilobytes(totalBytes),
        durationMs,
        queryPreview: summarizeQuery(query),
      };
      console.warn(`${formatTrafficSummary(usage)} failed=true`);
      console.warn("[LLM][traffic][failed][detail]", usage);
      push("error", {
        message: error?.message || "LLM stream failed.",
        provider,
      });
      push("done", {
        summary,
        ...usage,
        fallback: true,
      });
    }
  });
});
