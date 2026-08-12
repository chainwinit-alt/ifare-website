// https://nuxt.com/docs/api/configuration/nuxt-config
const SITEMAP_LASTMOD = new Date().toISOString();
const DEFAULT_SITE_URL = "http://10.200.0.39";
const DEFAULT_FRONTEND_API_BASE = `${DEFAULT_SITE_URL}/ifare_api/api/services/app`;
const DEFAULT_DEV_PUBLIC_FRONTEND_API_BASE = "/ifare_api/api/services/app";
const DEFAULT_GEMINI_API_KEY = "";
const DEFAULT_GROQ_API_KEY = "";
const RESOLVED_SITE_URL =
  process.env.NUXT_PUBLIC_SITE_URL ||
  process.env.NUXT_SITE_URL ||
  DEFAULT_SITE_URL;

const readEnv = (...keys: string[]) => {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === "string") {
      const normalized = value.trim();
      if (normalized) {
        return normalized;
      }
    }
  }
  return "";
};

const ENABLE_IFARE_AI_SUMMARY = !["0", "false", "off"].includes(
  (readEnv("NUXT_PUBLIC_ENABLE_IFARE_AI_SUMMARY", "ENABLE_IFARE_AI_SUMMARY") || "true").toLowerCase()
);

const remoteStableMode =
  (readEnv("NUXT_REMOTE_STABLE", "IFARE_REMOTE_STABLE") || "").toLowerCase() === "1" ||
  (readEnv("NUXT_REMOTE_STABLE", "IFARE_REMOTE_STABLE") || "").toLowerCase() === "true";

const shouldDisableHmrByDefault =
  process.env.NODE_ENV === "development" &&
  !readEnv("NUXT_HMR_HOST", "NUXT_HMR_CLIENT_PORT") &&
  !readEnv("NUXT_REMOTE_STABLE", "IFARE_REMOTE_STABLE");

const RESOLVED_PUBLIC_FRONTEND_API_BASE =
  process.env.NUXT_PUBLIC_FRONTEND_API_BASE ||
  (process.env.NODE_ENV === "development"
    ? DEFAULT_DEV_PUBLIC_FRONTEND_API_BASE
    : DEFAULT_FRONTEND_API_BASE);

export default defineNuxtConfig({
  devtools: { enabled: false },

  typescript: {
    tsConfig: {
      compilerOptions: {
        ignoreDeprecations: "6.0",
      },
    },
  },

  runtimeConfig: {
    frontendApiServerBase:
      process.env.NUXT_FRONTEND_API_SERVER_BASE || DEFAULT_FRONTEND_API_BASE,
    dynamicApiToken: process.env.NUXT_DYNAMIC_API_TOKEN || "",
    dynamicApiAllowedOrigins: process.env.NUXT_DYNAMIC_API_ALLOWED_ORIGINS || "",
    geminiApiKey: readEnv(
      "NUXT_LLM_GEMINI_API_KEY",
      "GEMINI_API_KEY",
      "GOOGLE_API_KEY"
    ) || DEFAULT_GEMINI_API_KEY,
    geminiModel:
      readEnv("NUXT_GEMINI_MODEL", "GEMINI_MODEL") || "gemini-3.5-flash-lite",
    llm: {
      provider: (readEnv("NUXT_LLM_PROVIDER", "LLM_PROVIDER") || "groq").toLowerCase(),
      openaiApiKey: readEnv("OPENAI_API_KEY"),
      openaiModel: readEnv("NUXT_OPENAI_MODEL", "LLM_MODEL") || "gpt-4o-mini",
      geminiApiKey: readEnv(
        "NUXT_LLM_GEMINI_API_KEY",
        "GEMINI_API_KEY",
        "GOOGLE_API_KEY"
      ) || DEFAULT_GEMINI_API_KEY,
      geminiModel:
        readEnv("NUXT_GEMINI_MODEL", "GEMINI_MODEL") || "gemini-3.5-flash-lite",
      geminiModels:
        readEnv("NUXT_LLM_GEMINI_MODELS") ||
        "gemini-3.5-flash-lite,gemini-3.1-flash-lite,gemini-2.5-flash-lite",
      groqApiKey:
        readEnv("NUXT_LLM_GROQ_API_KEY", "GROQ_API_KEY") || DEFAULT_GROQ_API_KEY,
      groqModel:
        readEnv("NUXT_GROQ_MODEL", "GROQ_MODEL") || "qwen/qwen3.6-27b",
      groqModels:
        readEnv("NUXT_LLM_GROQ_MODELS") ||
        "qwen/qwen3.6-27b,openai/gpt-oss-120b",
      groqIntentModels:
        readEnv("NUXT_LLM_GROQ_INTENT_MODELS") ||
        "qwen/qwen3.6-27b,openai/gpt-oss-120b",
      summaryCacheTtlMs: Number(readEnv("NUXT_LLM_SUMMARY_CACHE_TTL_MS")) || 86400000,
      ollamaBaseUrl: readEnv("NUXT_OLLAMA_BASE_URL") || "http://localhost:11434",
      ollamaModel: readEnv("NUXT_OLLAMA_MODEL") || "llama3.1",
    },
    public: {
      siteUrl: RESOLVED_SITE_URL,
      llmProvider: (readEnv("NUXT_LLM_PROVIDER", "LLM_PROVIDER") || "groq").toLowerCase(),
      frontendApiBase: RESOLVED_PUBLIC_FRONTEND_API_BASE,
      enableIfareAiSummary: ENABLE_IFARE_AI_SUMMARY,
    },
  },

  nitro: {
    devProxy: {
      "/ifare_api/api/services/app": {
        target: DEFAULT_FRONTEND_API_BASE,
        changeOrigin: true,
        secure: false,
      },
    },
    iis: {
      mergeConfig: true,
      overrideConfig: false,
    },
  },

  vite: {
    server: {
      hmr: remoteStableMode || shouldDisableHmrByDefault
        ? false
        : {
            protocol: "ws",
            host: process.env.NUXT_HMR_HOST || "10.200.0.39",
            clientPort: Number(process.env.NUXT_HMR_CLIENT_PORT || 8080),
          },
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@/assets/style/_color"; @import "@/assets/style/_design-tokens";`,
        },
      },
    },
  },

  modules: ["nuxt-gtag", "nuxt-simple-sitemap"],
  css: ["normalize.css/normalize.css", "~/assets/style/styleIFare.scss"],

  app: {
    head: {
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1",
      meta: [{ name: "format-detection", content: "telephone=no" }],
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
        { rel: "dns-prefetch", href: "https://fonts.googleapis.com" },
      ],
    },
  },

  gtag: {
    id: "G-QCT2XVFX2L",
  },

  site: {
    url: RESOLVED_SITE_URL,
  },

  sitemap: {
    xslColumns: [
      { label: "URL", width: "25%" },
      { label: "Last Modified", select: "sitemap:lastmod", width: "25%" },
      { label: "Change Frequency", select: "sitemap:changefreq", width: "25%" },
      { label: "Priority", select: "sitemap:priority", width: "12.5%" },
      { label: "Hreflangs", select: "count(xhtml:link)", width: "12.5%" },
    ],
  },

  routeRules: {
    "/": {
      sitemap: {
        priority: 1,
        changefreq: "daily",
        lastmod: SITEMAP_LASTMOD,
      },
    },
    "/about": {
      sitemap: {
        priority: 0.8,
        changefreq: "daily",
        lastmod: SITEMAP_LASTMOD,
      },
    },
    "/news": {
      sitemap: {
        priority: 0.8,
        changefreq: "daily",
        lastmod: SITEMAP_LASTMOD,
      },
    },
    "/articles": {
      sitemap: {
        priority: 0.8,
        changefreq: "daily",
        lastmod: SITEMAP_LASTMOD,
      },
    },
    "/collaborator": {
      sitemap: {
        priority: 0.8,
        changefreq: "daily",
        lastmod: SITEMAP_LASTMOD,
      },
    },
    "/ifare": {
      sitemap: {
        priority: 0.8,
        changefreq: "daily",
        lastmod: SITEMAP_LASTMOD,
      },
    },
    "/ifare/contact": {
      index: false,
    },
    "/ifare/result": {
      index: false,
    },
  },
});
