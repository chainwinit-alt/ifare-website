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
}

export interface LlmSummarySearchContext {
  policy?: string;
  recipient?: string;
  area?: string;
  income?: string;
  identity?: string;
  query?: string;
}

export interface LlmSummaryConversationMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * overview：首次搜尋且站內有相符政策時，輸出 Google AI 摘要式的結構化 Markdown 總覽（含 [參考 N] 引用）。
 * overview_general：首次搜尋但站內查無政策時，輸出「清楚標示為一般資訊」的保守科普總覽（無引用、附免責說明）。
 * guidance：一句話循序引導（追問對話使用；也可用環境變數關閉 general 後作為查無資料的回覆）。
 */
export type LlmSummaryMode = "overview" | "overview_general" | "guidance";

export interface LlmSummaryInput {
  query?: string;
  context?: LlmSummarySearchContext;
  cases: LlmSummaryCaseItem[];
  conversation?: LlmSummaryConversationMessage[];
  mode?: LlmSummaryMode;
}

export interface LlmClient {
  summarize(input: LlmSummaryInput): Promise<string>;
}
