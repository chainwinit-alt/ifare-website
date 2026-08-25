import { summarizeWithFreeTier } from "../../../utils/llm/freeTier";
import {
  buildFallbackSummary,
  getSummaryGuidanceField,
  getSummaryGuidanceFields,
  hasResolvedTopic,
  isSummaryAnswerTurn,
  isModelOverrideAllowed,
  normalizeSummaryQuery,
  sanitizeSummaryCases,
  sanitizeSummaryConversation,
  sanitizeSummaryScopeHint,
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
  scopeHint?: unknown;
  /** 使用者按了「重新摘要」：跳過伺服器端快取，真的重跑一次 */
  refresh?: boolean;
  /**
   * 指定要用哪一個供應商／型號。給了就不做候選退讓，也會用獨立的快取桶。
   *
   * 比較模型時最怕「以為在測 A、其實 A 掛了退到 B」，或是換了模型卻拿回
   * 上一個模型寫好的快取——兩種都會得出相反的結論。這兩件事在 freeTier 處理。
   */
  provider?: string;
  model?: string;
  /**
   * 政策明細頁的「問這筆政策」：畫面上只有這一筆，每一輪都當成在問它。
   * 詳細理由見下方讀取 body.focusPolicy 之處。
   */
  focusPolicy?: boolean;
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

  const overrideAllowed = isModelOverrideAllowed(llmConfig);
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
  // 追問回合：主題已經明確（問得出是哪一類福利）且有查到政策 → 一樣給引用版總覽，
  // 讓每一輪都是「這幾筆最相符 ＋ 下一個問題」；主題還不明確（例如只說了「新北市補助」）
  // → 只問不推薦，那時候的前三筆等於隨機挑。
  const topicResolved = hasResolvedTopic({
    query,
    context: body.context,
    cases: enrichedCases,
    conversation,
  });
  // 追問框裡問了問題（「需要準備甚麼文件」「補助多少錢」）→ 直接回答那個問題。
  // 這一段以前不存在：問句和補充條件都走總覽，而總覽的提示詞根本沒帶上對話，
  // 使用者的問題等於沒被送出去，畫面上只會換回一份長得一樣的摘要。
  // 政策明細頁的「問這筆政策」：畫面上就只有這一筆，沒有東西可以再搜尋，
  // 每一輪都是在問它。不強制的話，使用者打「我媽媽 80 歲」會被當成補充條件而落到
  // guidance 模式——那會反問他一句，但明細頁沒有可以縮小的範圍，問了也沒有下一步。
  const focusPolicy = body.focusPolicy === true && enrichedCases.length > 0;
  const answerTurn = conversation.length > 0
    && isSummaryAnswerTurn(conversation)
    && enrichedCases.length > 0;
  const mode: LlmSummaryMode = focusPolicy || answerTurn
    ? "answer"
    : conversation.length > 0
      ? topicResolved && enrichedCases.length > 0
        ? "overview"
        : "guidance"
      : enrichedCases.length > 0
        ? "overview"
        : generalFallbackEnabled
          ? "overview_general"
          : "guidance";
  // 只有回答問題時用得到：使用者問到目前條件以外的範圍，前端查回了那個範圍的真實筆數。
  const scopeHint = mode === "answer" && !focusPolicy
    ? sanitizeSummaryScopeHint(body.scopeHint)
    : null;
  const input = {
    query,
    context: body.context,
    cases: enrichedCases,
    conversation,
    mode,
    scopeHint,
  };
  // 摘要結尾那句引導問題問的是哪一項條件。answer 模式的結尾是答案不是問句，
  // 沒有可對齊的問題，就不要算。
  const guidanceField = mode === "answer" ? "" : getSummaryGuidanceField(input);
  // 摘要卡推薦區要列的幾項條件。問的不是同一件事（見 getSummaryGuidanceFields），
  // 但有問句時第一項一定就是它，讀完問句往下看不會對不上。
  const guidanceFields = mode === "answer" ? [] : getSummaryGuidanceFields(input);

  return createSseResponse(async (push) => {
    const startedAt = Date.now();
    const requestBytes = getUtf8Bytes(JSON.stringify(input));
    // 逐段把模型吐出來的字送給前端。摘要卡與 plugins/llm.ts 本來就會累積 chunk、
    // 並在 done 事件用整理過的全文取代，所以這裡只要真的分段送就會有逐字長出來的效果。
    //
    // 實測 gpt-oss-120b 寫一份摘要：不串流要等 3,100ms 才看得到任何東西，
    // 串流則 474ms 就出現第一個字。中間那段空白正是「沒有互動感」的來源。
    let streamedAny = false;
    const onDelta = (delta: string) => {
      streamedAny = true;
      push("chunk", { delta });
    };

    push("meta", {
      provider: "auto",
      model: "",
      mode,
      guidanceField,
      guidanceFields,
      requestBytes,
      requestKilobytes: toKilobytes(requestBytes),
      streaming: true,
    });

    try {
      const result = await summarizeWithFreeTier(
        input,
        {
          geminiApiKey: llmConfig.geminiApiKey || "",
          // 摘要有自己的 Gemini 清單，不跟意圖判讀／協作搜尋共用（見 nuxt.config.ts）
          geminiModels:
            llmConfig.geminiSummaryModels || llmConfig.geminiModels || llmConfig.geminiModel || "",
          groqApiKey: llmConfig.groqApiKey || "",
          // 摘要有自己的候選清單（見 nuxt.config.ts 的 groqSummaryModels）；
          // 沒設定時才退回跟聊天機器人共用的那一份
          groqModels:
            llmConfig.groqSummaryModels || llmConfig.groqModels || llmConfig.groqModel || "",
          // Gemini 優先。理由見 nuxt.config.ts 對 summaryProviderOrder 的說明
          providerOrder: llmConfig.summaryProviderOrder || "",
          summaryCacheTtlMs: llmConfig.summaryCacheTtlMs,
        },
        {
          skipCache: body.refresh === true,
          // 指定模型只在開放時採用，正式環境預設忽略（見 nuxt.config.ts）
          provider: overrideAllowed ? body.provider : undefined,
          model: overrideAllowed ? body.model : undefined,
          onDelta,
        }
      );
      const responseBytes = getUtf8Bytes(result.summary);
      const durationMs = Date.now() - startedAt;

      push("meta", {
        provider: result.provider,
        model: result.model,
        mode,
        guidanceField,
        guidanceFields,
        cached: result.cached,
        streaming: streamedAny,
      });
      // 走快取或供應商不支援串流時沒有逐段送過，這裡補一次整篇。
      // 已經串流過就不能再補——前端是累加的，補了會變成兩份疊在一起。
      if (!streamedAny) push("chunk", { delta: result.summary });
      push("done", {
        summary: result.summary,
        provider: result.provider,
        model: result.model,
        mode,
        guidanceField,
        guidanceFields,
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
