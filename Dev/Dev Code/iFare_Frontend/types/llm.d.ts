declare module "#app" {
  interface NuxtApp {
    $llm: {
      summarizeCases(payload: {
        query?: string;
        cases: Array<{
          id: number;
          title: string;
          area: string;
          qualification: string;
          hasRecipient: boolean;
          hasIncome: boolean;
          hasIndentity: boolean;
        }>;
        provider?: "openai" | "gemini" | "ollama";
      }): Promise<{ provider: string; summary: string }>;
      streamSummarizeCases(payload: {
        query?: string;
        cases: Array<{
          id: number;
          title: string;
          area: string;
          qualification: string;
          hasRecipient: boolean;
          hasIncome: boolean;
          hasIndentity: boolean;
        }>;
        provider?: "openai" | "gemini" | "ollama";
        onChunk?: (chunk: string, fullText: string) => void;
        onMeta?: (meta: any) => void;
        signal?: AbortSignal;
      }): Promise<string>;
    };
  }
}

export {};

