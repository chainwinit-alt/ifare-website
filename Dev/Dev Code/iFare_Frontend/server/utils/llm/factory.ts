import type { LlmClient, LlmProviderName } from "./types";
import {
  createGeminiClient,
  createGroqClient,
  createOllamaClient,
  createOpenAIClient,
} from "./providers";

export function createLlmClient(config: {
  provider: LlmProviderName;
  openaiApiKey: string;
  openaiModel: string;
  geminiApiKey: string;
  geminiModel: string;
  groqApiKey: string;
  groqModel: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
}): LlmClient {
  if (config.provider === "gemini") {
    return createGeminiClient({
      apiKey: config.geminiApiKey,
      model: config.geminiModel,
    });
  }

  if (config.provider === "groq") {
    return createGroqClient({
      apiKey: config.groqApiKey,
      model: config.groqModel,
    });
  }

  if (config.provider === "ollama") {
    return createOllamaClient({
      baseUrl: config.ollamaBaseUrl,
      model: config.ollamaModel,
    });
  }

  return createOpenAIClient({
    apiKey: config.openaiApiKey,
    model: config.openaiModel,
  });
}
