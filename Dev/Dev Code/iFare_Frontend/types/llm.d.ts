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
        onChunk?: (chunk: string, fullText: string) => void;
        onMeta?: (meta: any) => void;
        signal?: AbortSignal;
      }): Promise<string>;
    };
  }
}

export {};
