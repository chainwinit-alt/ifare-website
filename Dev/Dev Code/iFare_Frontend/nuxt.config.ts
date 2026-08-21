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

// 機器層級環境變數 NUXT_PUBLIC_FRONTEND_API_BASE="/ifare_api/..." 若從 git-bash 啟動，
// 會被 MSYS 路徑轉換誤改成 "C:/Program Files/Git/ifare_api/..."，導致瀏覽器把 API 打到
// file:// 而整站搜尋變 0 筆。這裡把被誤轉的值還原成站內相對路徑。
const normalizePublicApiBase = (value: string) => {
  const mangled = value.match(/^[A-Za-z]:[\\/].*?([\\/]ifare_api[\\/].*)$/i);
  return mangled ? mangled[1].replace(/\\/g, "/") : value;
};

const RESOLVED_PUBLIC_FRONTEND_API_BASE = normalizePublicApiBase(
  process.env.NUXT_PUBLIC_FRONTEND_API_BASE ||
  (process.env.NODE_ENV === "development"
    ? DEFAULT_DEV_PUBLIC_FRONTEND_API_BASE
    : DEFAULT_FRONTEND_API_BASE)
);

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
    // 芒寶自動知識庫：常見問題(FareQA)自動轉答案卡、最新消息/專欄標題進生成層。
    // 預設開啟；設 NUXT_CHATBOT_RAG_ENABLED=0 可關閉。
    chatbotRagEnabled: !["0", "false", "off"].includes(
      (readEnv("NUXT_CHATBOT_RAG_ENABLED") || "true").toLowerCase()
    ),
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
      // 2026-08-21：移除 gemini-2.5-flash-lite，Google 已對新用戶下架，API 直接回 404
      //（no longer available to new users，要求改用 models/gemini-3.5-flash-lite）。
      // 它是候選鏈最後一棒，前面全掛時只會多打一次註定失敗的請求才掉到本地腳本。
      // 與 server/utils/llm/freeTier.ts 的 DEFAULT_GEMINI_MODELS 對齊。
      geminiModels:
        readEnv("NUXT_LLM_GEMINI_MODELS") ||
        "gemini-3.5-flash-lite,gemini-3.1-flash-lite",
      groqApiKey:
        readEnv("NUXT_LLM_GROQ_API_KEY", "GROQ_API_KEY") || DEFAULT_GROQ_API_KEY,
      // 2026-08-12：qwen/qwen3.6-27b 是 Groq 的 Preview 模型，官方警告
      // 「may be discontinued at short notice」，且價格為 gpt-oss-20b 的 8.3 倍、
      // 繁體中文 tokenizer 支援較弱。改用 Production 的 gpt-oss 系列，
      // 該系列另支援 prompt caching（快取輸入 5 折，自動生效且免費）。
      groqModel:
        readEnv("NUXT_GROQ_MODEL", "GROQ_MODEL") || "openai/gpt-oss-20b",
      groqModels:
        readEnv("NUXT_LLM_GROQ_MODELS") ||
        "openai/gpt-oss-20b,openai/gpt-oss-120b",
      // AI 摘要獨立一份候選清單，跟聊天機器人（chatbot.post.ts 也吃 groqModels）分開。
      //
      // 2026-08-20 實測：同一份輸入餵 7 個模型跑 4 種情境，120b 在三件事上都贏 20b——
      // 具體資訊密度 0.48 vs 0.42（每百字寫出幾個查得證的金額或門檻）、
      // 平均字數 522 vs 652（20b 有一次把整份清單重複列了兩遍）、
      // token 消耗 2,893 vs 4,267（免費方案 8000 TPM 下，每分鐘 2.8 次 vs 1.9 次）。
      // 大的模型反而比較省，因為輸入提示詞一樣，差別在它寫得比較短。
      //
      // 20b 留第二順位：撞到額度時接手，品質只差一點，而且兩者的 TPM 額度是分開計算的。
      groqSummaryModels:
        readEnv("NUXT_LLM_GROQ_SUMMARY_MODELS") ||
        "openai/gpt-oss-120b,openai/gpt-oss-20b",
      groqIntentModels:
        readEnv("NUXT_LLM_GROQ_INTENT_MODELS") ||
        "openai/gpt-oss-20b,openai/gpt-oss-120b",
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
        // 2026-08-14：10.200.0.39 從開發機連線不穩，允許用環境變數改指本機 IIS 的 API
        target: readEnv("NUXT_DEV_PROXY_TARGET") || DEFAULT_FRONTEND_API_BASE,
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
