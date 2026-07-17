export type LlmProviderName = "openai" | "gemini" | "ollama";

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

export interface LlmSummaryInput {
  query?: string;
  context?: LlmSummarySearchContext;
  cases: LlmSummaryCaseItem[];
}

export interface LlmClient {
  summarize(input: LlmSummaryInput): Promise<string>;
}
