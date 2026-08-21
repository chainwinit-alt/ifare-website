declare module "#app" {
  interface NuxtApp {
    $llm: {
      summarizeCases(payload: {
        query?: string;
        context?: {
          policy?: string;
          recipient?: string;
          area?: string;
          income?: string;
          identity?: string;
          query?: string;
        };
        cases: Array<{
          id: number;
          title: string;
          area: string;
          qualification: string;
          hasRecipient: boolean;
          hasIncome: boolean;
          hasIndentity: boolean;
        }>;
        conversation?: Array<{ role: "user" | "assistant"; content: string }>;
        provider?: "openai" | "gemini" | "groq" | "ollama";
      }): Promise<{ provider: string; summary: string }>;
      streamSummarizeCases(payload: {
        query?: string;
        context?: {
          policy?: string;
          recipient?: string;
          area?: string;
          income?: string;
          identity?: string;
          query?: string;
        };
        cases: Array<{
          id: number;
          title: string;
          area: string;
          qualification: string;
          hasRecipient: boolean;
          hasIncome: boolean;
          hasIndentity: boolean;
        }>;
        conversation?: Array<{ role: "user" | "assistant"; content: string }>;
        provider?: "openai" | "gemini" | "groq" | "ollama";
        /** 追問問到目前條件以外的範圍時，前端查回來的真實筆數 */
        scopeHint?: { field: string; label: string; value: string; count: number } | null;
        /** 使用者按了「重新摘要」：跳過伺服器端快取 */
        refresh?: boolean;
        /** 政策明細頁：畫面上只有這一筆，每一輪都當成在問它 */
        focusPolicy?: boolean;
        onChunk?: (chunk: string, fullText: string) => void;
        onMeta?: (meta: any) => void;
        signal?: AbortSignal;
      }): Promise<string>;
    };
  }
}

export {};
