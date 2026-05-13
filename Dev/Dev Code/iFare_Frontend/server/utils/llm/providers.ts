import type { LlmClient, LlmSummaryInput } from "./types";
import { buildSummaryPrompt } from "./shared";

const SUMMARY_SYSTEM_PROMPT =
  "You are a polite i-Fare policy summary assistant. Reply in Traditional Chinese. Be warm, concise, and helpful. If the user's keywords or filters are incomplete, do not point that out and do not ask for missing information. Instead, infer carefully from the available cases and use cautious wording.";

const OLLAMA_SUMMARY_SYSTEM_PROMPT =
  "You are an i-Fare policy summary assistant. Reply only in Traditional Chinese. All Chinese characters must be Traditional Chinese. Never use Simplified Chinese. Follow the user's task directly. Do not ask follow-up questions. Do not explain what the document is. Do not describe your reasoning process. Do not mention missing information. Do not add introductions or conclusions. Do not greet the user. Do not say that you have read the provided information. Do not ask what the user wants you to do. Output only a short Markdown bullet list with 3 to 5 bullets. Each bullet should directly summarize what support the matched policies can provide, who they are suitable for, or what the user should check next. Use only the provided references. Keep the exact reference format [參考 1][參考 2]. Never write grouped formats like [參考 1, 2].";

function normalizeSummary(text: string) {
  return (text || "")
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function sanitizeOllamaSummary(text: string) {
  return normalizeSummary(
    (text || "")
      .replace(/^(您好|哈囉|嗨|您好呀|您好，|您好。)\s*/u, "")
      .replace(/^我已閱讀您提供的相關資訊[。！!\s]*/u, "")
      .replace(/^以下是(?:根據|依據)?您提供資料的?(?:摘要|整理)[：:\s]*/u, "")
      .replace(/^請問您希望我針對這些資料做些什麼？[\s\S]*$/u, "")
      .replace(/^請告訴我您的具體需求[\s\S]*$/u, "")
  );
}

async function readErrorText(response: Response) {
  const rawText = await response.text().catch(() => "");
  if (!rawText) return "";

  try {
    const data = JSON.parse(rawText);
    return data?.error?.message || data?.error?.status || data?.error?.details?.[0]?.message || rawText;
  } catch {
    return rawText;
  }
}

export function createOpenAIClient(config: {
  apiKey: string;
  model: string;
}): LlmClient {
  return {
    async summarize(input: LlmSummaryInput) {
      if (!config.apiKey) {
        throw new Error("OpenAI API key is not configured.");
      }

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          temperature: 0.3,
          messages: [
            {
              role: "developer",
              content: SUMMARY_SYSTEM_PROMPT,
            },
            {
              role: "user",
              content: buildSummaryPrompt(input.query || "", input.cases, input.context),
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI request failed with status ${response.status}.`);
      }

      const data: any = await response.json();
      return normalizeSummary(data?.choices?.[0]?.message?.content ?? "");
    },
  };
}

export function createGeminiClient(config: {
  apiKey: string;
  model: string;
}): LlmClient {
  return {
    async summarize(input: LlmSummaryInput) {
      if (!config.apiKey) {
        throw new Error("Gemini API key is not configured.");
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent?key=${encodeURIComponent(config.apiKey)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [
                {
                  text: SUMMARY_SYSTEM_PROMPT,
                },
              ],
            },
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: buildSummaryPrompt(input.query || "", input.cases, input.context),
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.3,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await readErrorText(response);
        throw new Error(`Gemini request failed with status ${response.status}. ${errorText}`.trim());
      }

      const data: any = await response.json();
      const parts = data?.candidates?.[0]?.content?.parts ?? [];
      const text = parts
        .map((part: any) => part?.text ?? "")
        .join("")
        .trim();
      return normalizeSummary(text);
    },
  };
}

export function createOllamaClient(config: {
  baseUrl: string;
  model: string;
}): LlmClient {
  return {
    async summarize(input: LlmSummaryInput) {
      const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: config.model,
          stream: false,
          messages: [
            {
              role: "system",
              content: OLLAMA_SUMMARY_SYSTEM_PROMPT,
            },
            {
              role: "user",
              content: buildSummaryPrompt(input.query || "", input.cases, input.context),
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await readErrorText(response);
        throw new Error(`Ollama request failed with status ${response.status}. ${errorText}`.trim());
      }

      const data: any = await response.json();
      return sanitizeOllamaSummary(data?.message?.content ?? "");
    },
  };
}
