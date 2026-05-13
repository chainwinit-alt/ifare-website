import type { LlmClient, LlmProviderName } from "./types";
import {
  createGeminiClient,
  createOllamaClient,
  createOpenAIClient,
} from "./providers";

export function createLlmClient(config: {
  provider: LlmProviderName;
  openaiApiKey: string;
  openaiModel: string;
  geminiApiKey: string;
  geminiModel: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
}): LlmClient {
  if (config.provider === "gemini") {
    return createGeminiClient({
      apiKey: config.geminiApiKey,
      model: config.geminiModel,
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

