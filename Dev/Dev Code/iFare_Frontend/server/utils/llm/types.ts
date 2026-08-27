export type LlmProviderName = "openai" | "gemini" | "groq" | "ollama";

export interface LlmSummaryCaseItem {
  id: number;
  title: string;
  area: string;
  qualification: string;
  hasRecipient: boolean;
  hasIncome: boolean;
  hasIndentity: boolean;
  welfareInfo?: string;
  evidence?: string;
  officeUnitInfo?: string;
  officeUnitTel?: string;
  competentAuthority?: string;
  remark?: string;
  sourceSummary?: string;
  /** 這筆政策的類別名稱。引導問句要照實際查到的類別舉例，不能寫死 */
  policyCategory?: string;
}

export interface LlmSummarySearchContext {
  policy?: string;
  recipient?: string;
  area?: string;
  income?: string;
  identity?: string;
  query?: string;
}

/**
 * 追問問到目前條件以外的範圍時，前端查回來的真實筆數。
 * 有這個東西，回答才能說「本站確實有台北市的 68 筆」而不是「站內資料未載明」。
 */
export interface LlmSummaryScopeHint {
  /** area | recipient | income | identity | policy */
  field: string;
  /** 給人看的欄位名稱，例如「地區」 */
  label: string;
  /** 目標值，例如「台北市」 */
  value: string;
  /** 換成這個值以後符合的政策筆數 */
  count: number;
  /**
   * 這個筆數是不是伺服器自己核算出來的。
   *
   * 目前一律是 false：數字由瀏覽器算完送上來（前端的探測要先把縣市名轉成後端代碼、
   * 再打數趟 GetIFarePolicyList 去重，伺服器這邊拿不到同一份可靠來源）。
   * 未驗證的數字不能讓 AI 當成本站統計斬釘截鐵地引用，提示詞會據此改口（見 buildAnswerPrompt）。
   */
  verified?: boolean;
}

export interface LlmSummaryConversationMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * overview：首次搜尋且站內有相符政策時，輸出 Google AI 摘要式的結構化 Markdown 總覽（含 [參考 N] 引用）。
 * overview_general：首次搜尋但站內查無政策時，輸出「清楚標示為一般資訊」的保守科普總覽（無引用、附免責說明）。
 * answer：追問框裡問了問題（要準備什麼文件、補助多少錢、怎麼申請…）時，直接回答那個問題。
 * guidance：一句話循序引導（追問補充條件時使用；也可用環境變數關閉 general 後作為查無資料的回覆）。
 */
export type LlmSummaryMode = "overview" | "overview_general" | "answer" | "guidance";

export interface LlmSummaryInput {
  query?: string;
  context?: LlmSummarySearchContext;
  cases: LlmSummaryCaseItem[];
  conversation?: LlmSummaryConversationMessage[];
  mode?: LlmSummaryMode;
  scopeHint?: LlmSummaryScopeHint | null;
}

/**
 * onDelta：模型每吐出一小段就回呼一次（delta 是新增的片段，full 是目前累積的全文）。
 *
 * 給了才會走串流。實測 gpt-oss-120b 寫一份摘要：不串流要等 3,100ms 才拿得到全文，
 * 串流則 474ms 就吐出第一個字。使用者盯著轉圈圈的時間差了六倍以上，
 * 而摘要卡與 plugins/llm.ts 早就接好逐段更新，只差伺服器這一端真的分段送。
 *
 * Groq 與 Gemini 都走串流（各自的 SSE 形式不同，見 providers.ts）。其餘 client
 * 與所有不給 onDelta 的呼叫都維持原本的一次回傳，所以是可選的加強，不是必要條件。
 */
export type LlmSummaryDeltaHandler = (delta: string, full: string) => void;

export interface LlmClient {
  /**
   * signal：呼叫端的中止訊號（SSE 的 client 斷線、整體逾時）。
   * 傳下去之後，民眾關掉頁面時上游那趟 LLM 請求會跟著停，而不是自己寫完再丟掉。
   */
  summarize(
    input: LlmSummaryInput,
    onDelta?: LlmSummaryDeltaHandler,
    signal?: AbortSignal
  ): Promise<string>;
}
