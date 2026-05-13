// https://nuxt.com/docs/api/configuration/nuxt-config
const SITEMAP_LASTMOD = new Date().toISOString();
const DEFAULT_SITE_URL = "https://www.i-fare.org.tw";
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
      process.env.NUXT_FRONTEND_API_SERVER_BASE || "http://localhost/ifare_api/api/services/app",
    llm: {
      provider: (readEnv("NUXT_LLM_PROVIDER", "LLM_PROVIDER") || "gemini").toLowerCase(),
      openaiApiKey: readEnv("OPENAI_API_KEY"),
      openaiModel: readEnv("NUXT_OPENAI_MODEL", "LLM_MODEL") || "gpt-4o-mini",
      geminiApiKey: readEnv("GEMINI_API_KEY", "GOOGLE_API_KEY"),
      geminiModel: readEnv("NUXT_GEMINI_MODEL", "GEMINI_MODEL") || "gemini-2.5-flash",
      ollamaBaseUrl: readEnv("NUXT_OLLAMA_BASE_URL") || "http://localhost:11434",
      ollamaModel: readEnv("NUXT_OLLAMA_MODEL") || "llama3.1",
    },
    public: {
      siteUrl: RESOLVED_SITE_URL,
      llmProvider: (readEnv("NUXT_LLM_PROVIDER", "LLM_PROVIDER") || "gemini").toLowerCase(),
      frontendApiBase:
        process.env.NUXT_PUBLIC_FRONTEND_API_BASE || "/api/services/app",
    },
  },

  nitro: {
    devProxy: {
      "/api/services/app": {
        target: "http://localhost/ifare_api/api/services/app",
        changeOrigin: true,
        secure: false,
      },
    },
    iis: {
      mergeConfig: true,
      overrideConfig: false,
    },
  },

  modules: ["nuxt-gtag", "nuxt-simple-sitemap"],
  css: ["normalize.css/normalize.css", "~/assets/style/styleIFare.scss"],
  app: {
    head: {
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1",
      meta: [{ name: "format-detection", content: "telephone=no" }],
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
