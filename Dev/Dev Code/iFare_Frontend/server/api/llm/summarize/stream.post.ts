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
import { createRateLimiter, getClientKey } from "~/server/utils/rateLimit";

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

/**
 * 開一條 SSE。handler 拿到的第二個參數是「這位民眾還在不在」的訊號：
 *
 * ReadableStream 原本沒有 cancel()，民眾關掉分頁、按上一頁或中途重問時，
 * 這一端完全不知道，上游那趟 LLM 請求照樣寫到底、額度照樣扣——摘要是本站最貴的
 * 呼叫，這等於每一次中途離開都白付一次。現在 cancel 會 abort 這個訊號，
 * 一路傳到 freeTier 與供應商的 fetch，請求跟著收掉。
 *
 * closed 旗標同時擋掉「串流關掉之後還在 enqueue／close」——那會丟 TypeError，
 * 而那個錯誤只會被上面的 catch 記成一筆看不懂的日誌。
 */
function createSseResponse(
  handler: (push: PushEvent, signal: AbortSignal) => Promise<void>
) {
  const encoder = new TextEncoder();
  const abortController = new AbortController();
  let closed = false;

  return new Response(
    new ReadableStream({
      start(controller) {
        const push: PushEvent = (event, data) => {
          if (closed) return;
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        };

        (async () => {
          try {
            await handler(push, abortController.signal);
          } catch (error) {
            console.warn("[LLM][sse]", error);
          } finally {
            if (!closed) {
              closed = true;
              controller.close();
            }
          }
        })();
      },
      cancel() {
        closed = true;
        abortController.abort();
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

// 每個 IP 每分鐘的請求上限：這支端點每次請求都會觸發外部 LLM 呼叫（且會開 SSE 串流），
// 沒有限流的話腳本連打就能燒光額度，所以設定每 IP 每分鐘上限。
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;
const streamRateLimiter = createRateLimiter({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
});

// ---------------------------------------------------------------------------
// 查無政策時的前置守門：這句話看得出是在找福利嗎
//
// 站內查無政策（cases 為空）本來一律走 overview_general，讓模型寫一份一般知識總覽。
// 但這條路上完全沒有守門——實測打「12345」「ㄅㄆㄇ」「asdf」「？？？」「😀」，
// 摘要卡照樣長出有粗體、有「### 常見的服務方向」、有 1957 專線的完整文章。
// 那是最危險的形態：看起來很權威，內容卻跟本站一點關係都沒有，使用者無從分辨。
//
// 所以 overview_general 多這一關：看得出在找某類福利才交給模型，看不出來就回一段
// 固定文案請使用者換個說法。寧可少寫一篇，也不要寫一篇沒有根據的。
// ---------------------------------------------------------------------------

/**
 * 福利概念詞：只要命中任何一條，就當作「看得出在找某類福利」。
 *
 * 與前端 POLICY_CATEGORY_KEYWORDS、處境詞表同源，但刻意用複製而不是 import——
 * 這是伺服器端最後一道守門，不該因為前端詞表為了排序、篩選之類的別的用途調鬆而跟著失效。
 *
 * 這是「放行清單」不是「阻擋清單」：收得寬一點只是讓查詢回到原本的行為，
 * 收得太窄卻會把真的在求助的人擋在門外，所以寧可寬。
 */
const WELFARE_INTENT_PATTERNS: RegExp[] = [
  // 長期照顧
  /長期照顧|長照|照顧|看護|居家|日照|喘息|失能|失智|無法自理|臥床|中風|復健/u,
  // 身心障礙、醫療
  /身心障礙|身障|智能障礙|殘障|輔具|重大傷病|癌症|罕見疾病|醫療|就醫|看病|住院|手術|假牙/u,
  // 兒少、生育
  /兒少|兒童|少年|青少年|孩童|幼童|小孩|孩子|育兒|托育|托嬰|生育|懷孕|新生兒|嬰幼兒|學童|早產|發展遲緩/u,
  // 老人
  /老人|長者|長輩|高齡|銀髮|敬老|安養|養老/u,
  // 社會救助、經濟處境
  /社會救助|低收|中低收|經濟弱勢|急難|紓困|生活扶助|扶助|救助|喪葬|安葬/u,
  // 社會保險
  /社會保險|健保|全民健康保險|勞保|勞工保險|國民年金|農保|年金/u,
  // 勞工、就業
  /勞工|失業|就業|求職|職業訓練|職訓|非自願離職|資遣|裁員/u,
  // 住宅
  /住宅|租屋|租房|房租|租金|包租代管|購屋|房屋/u,
  // 身分別
  /原住民|原民|新住民|外籍配偶|特殊境遇|單親|婦女|家暴|受暴/u,
  // 教育、就學
  /教育|就學|學費|學雜費|獎助學金|助學/u,
  // 泛用福利語彙：這幾個字本身就在講「我想申請某種給付」
  /補助|補貼|津貼|給付|福利|服務|申請|減免|優惠|救濟/u,
  // 家族稱謂：字面上已經講出受助者是誰（與前端 extractExplicitSearchConditions 同源）。
  // 也順便接住「爸爸」「媽媽」這種疊字詞——它們過不了下面那條「兩個不同的漢字」。
  /爸爸|媽媽|父親|母親|爺爺|奶奶|阿公|阿嬤|外公|外婆|祖父|祖母|兒子|女兒|孫子|孫女|先生|太太|配偶|老公|老婆|家人/u,
];

/**
 * 漢字。注音符號（ㄅㄆㄇ，U+3100–U+312F）是 Script=Bopomofo 不是 Han，
 * 全形標點（？）與 emoji 則是 Script=Common，三者都不會被算進來——這正是要的。
 */
const HAN_CHAR_PATTERN = /\p{Script=Han}/gu;

function countDistinctHanChars(text: string) {
  return new Set(text.match(HAN_CHAR_PATTERN) || []).size;
}

/**
 * 這句查詢看不看得出「在找某一類福利」。任一條成立就放行：
 *
 * 1. 命中福利概念詞——最強的訊號，「長照」兩個字就夠。
 * 2. 至少有兩個「不同的」漢字——「我缺錢」「我爸爸中風」一個福利詞都沒有，
 *    但那是真的在講自己的處境，一定要放行。取「不同的」是為了順手擋掉
 *    「哈哈哈」「呵呵」這種疊字雜訊；疊字的家族稱謂已經由第 1 條接住。
 *
 * 放行不等於保證有答案，只是「值得讓模型寫一份一般性總覽」。
 * 總覽本身的資料紅線（不得杜撰、須標示為一般資訊）仍然由提示詞負責，這裡不碰。
 */
function looksLikeWelfareQuery(value: string) {
  const text = String(value || "");
  if (WELFARE_INTENT_PATTERNS.some((pattern) => pattern.test(text))) return true;
  return countDistinctHanChars(text) >= 2;
}

/**
 * 擋下來時回的固定文案。刻意不交給模型寫——這一格的重點就是「不要生成內容」。
 * 也刻意不回空白：空白的摘要卡只會讓人以為系統壞了，這裡要告訴他下一步怎麼做。
 */
const UNCLEAR_QUERY_SUMMARY =
  "這幾個字看不出您想找哪一類福利。可以試試描述您的狀況（例如「我媽媽需要人照顧」"
  + "「我最近失業沒有收入」），或直接輸入「長照」「托育」「租金補貼」這類關鍵字。";

/** 給前端辨識用的模式名。刻意不是 LlmSummaryMode 的成員——這一路根本沒有叫模型 */
const UNCLEAR_QUERY_MODE = "unclear_query";

export default defineEventHandler(async (event) => {
  // 【限流｜問題 A】這支平常回傳 SSE 串流，限流檢查放在 return createSseResponse 之前：
  // 超限直接回 429（並帶 Retry-After），完全不開串流。前端 plugins/llm.ts 會檢查
  // res.ok 並丟錯，429 能被正確處理。這是每 IP 每分鐘上限，用來擋腳本連打燒額度。
  const rl = streamRateLimiter(getClientKey(event));
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
  // 【一般知識總覽的前置守門】首次搜尋（沒有對話）＋ 站內查無政策 ＋ 一般知識總覽開著，
  // 才會走到 overview_general。到這一步先看查詢本身像不像在找福利：看不出來就不叫模型，
  // 直接回固定文案。理由與判斷方式見檔案上方 looksLikeWelfareQuery。
  //
  // 只擋這一路：有查到政策（overview）、追問（answer / guidance）、以及用環境變數
  // 關掉一般總覽後的 guidance，行為都跟以前一模一樣。
  if (
    conversation.length === 0
    && enrichedCases.length === 0
    && generalFallbackEnabled
    && !looksLikeWelfareQuery(query)
  ) {
    return createSseResponse(async (push) => {
      const startedAt = Date.now();
      const requestBytes = getUtf8Bytes(JSON.stringify({ query, mode: UNCLEAR_QUERY_MODE }));
      const responseBytes = getUtf8Bytes(UNCLEAR_QUERY_SUMMARY);
      const identity = {
        // provider/model 讓摘要卡把標題顯示成「快速摘要」而不是「AI 快速摘要」，
        // 並附上「非 AI 生成」那行說明。這段話本來就不是模型寫的，不能冒充。
        provider: "guard",
        model: "script",
        mode: UNCLEAR_QUERY_MODE,
        // 沒有可推薦的條件。留空才會把上一輪的條件清掉——不然畫面上會浮著
        // 一排跟這次查詢對不上的建議按鈕。
        guidanceField: "",
        guidanceFields: [],
      };

      push("meta", {
        ...identity,
        requestBytes,
        requestKilobytes: toKilobytes(requestBytes),
        streaming: false,
      });
      // 前端是累加 chunk、再用 done 的全文取代，兩個都要推才顯示得出來
      push("chunk", { delta: UNCLEAR_QUERY_SUMMARY });
      push("done", {
        ...identity,
        summary: UNCLEAR_QUERY_SUMMARY,
        cached: false,
        // 這不是降級：模型沒掛，是我們決定不叫它
        fallback: false,
        requestBytes,
        requestKilobytes: toKilobytes(requestBytes),
        responseBytes,
        responseKilobytes: toKilobytes(responseBytes),
        totalBytes: requestBytes + responseBytes,
        totalKilobytes: toKilobytes(requestBytes + responseBytes),
        durationMs: Date.now() - startedAt,
      });
    });
  }
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
  // 只有回答問題時用得到：使用者問到目前條件以外的範圍，前端查回了那個範圍的筆數。
  //
  // 這個數字是 client 送上來的，伺服器沒有辦法用同一份來源核對（探測要先把縣市名
  // 轉成後端代碼、再打數趟 GetIFarePolicyList 去重）。sanitizeSummaryScopeHint 因此
  // 只做合理性把關（整數、正數、不超過全站量級）並標成未驗證，提示詞會把它講成概數，
  // 不讓 AI 說成「本站統計共 N 筆」。
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

  return createSseResponse(async (push, signal) => {
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
          // client 斷線就把上游那趟 LLM 請求一起收掉（見 createSseResponse）
          signal,
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
      // 民眾已經離開（關掉分頁、按上一頁、中途重問）：沒有人在等這份回覆，
      // 兜底文字也送不出去，這裡直接收工，順便不要把斷線記成一筆錯誤。
      if (signal.aborted) return;
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
        // 【與前端 plugins/llm.ts 的介面約定】全部候選都失敗、又沒有可用的兜底文字時
        //（對話回合不寫腳本兜底，summary 會是空字串），前端已經逐字長出來的半截草稿
        // 必須整段丟掉，不能留在畫面上當答案。收到 discard: true 就丟。
        discard: isConversation && !summary,
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
