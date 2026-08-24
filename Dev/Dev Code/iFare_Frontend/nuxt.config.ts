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
      // 2026-08-20 曾實測 7 個模型跑 4 種情境，結論是「120b 全面優於 20b，20b 留第二順位」。
      // 那次只測了搜尋總覽（overview），而總覽測不出下面這些問題——問答才會出現。
      //
      // 2026-08-24 改測「追問問答」，涵蓋全部 1337 筆政策所屬的 12 個類別，
      // 每個回答都比對過網站原始資料並人工複核。三種會害到民眾的錯誤：
      //   編造     憑空生出網站沒有的內容（例如來源只寫流程，卻列出一整份應備文件清單）
      //   斷定資格 把「須經評估或審核才能確定」的事說成已確定
      //   擋錯人   漏讀條件，把符合資格的民眾說成不符合
      // 結果：gpt-oss-20b 三種全中（編造三輪三中、斷定 3 次、擋錯人 1 次），
      //       gpt-oss-120b 僅單一政策測試中斷定過一次，跨 11 個類別未再犯，
      //       兩個 gemini 模型完全沒有出現過。
      //
      // 因此摘要改成 Gemini 優先（見下方 summaryProviderOrder），Groq 只留 120b 當最後備援：
      // Gemini 兩個都掛掉時，120b 多數題目仍答得正確，比完全沒有摘要好。
      // 20b 已整個移出——它接手的那一次，正是最可能給出錯誤資訊的一次。
      groqSummaryModels:
        readEnv("NUXT_LLM_GROQ_SUMMARY_MODELS") ||
        "openai/gpt-oss-120b",
      // 摘要專用的 Gemini 清單。不共用 geminiModels，因為那份還餵給意圖判讀
      //（search-intent）與協作搜尋（collaborator-search），那兩條這次沒測過，不動它們。
      //
      // 3.1 排第一是因為它在七道功能題與 11 個類別的資格題全數正確，是本次唯一零缺點的；
      // 3.5 排第二當備援——它同樣沒出過錯，只是有一題答得過於簡略。
      // 注意 3.1 是較舊的版本，Google 有下架舊模型的前例（見上方 geminiModels 的說明），
      // 哪天它回 404 就把兩者對調。
      geminiSummaryModels:
        readEnv("NUXT_LLM_GEMINI_SUMMARY_MODELS") ||
        "gemini-3.1-flash-lite,gemini-3.5-flash-lite",
      // 摘要的供應商順序。空值或非 gemini 開頭 = 維持原本的 Groq 優先。
      // 代價：Gemini 目前不走串流，民眾等到第一個字的時間從約 0.8 秒變成 1.3～1.5 秒。
      summaryProviderOrder:
        readEnv("NUXT_LLM_SUMMARY_PROVIDER_ORDER") || "gemini,groq",
      groqIntentModels:
        readEnv("NUXT_LLM_GROQ_INTENT_MODELS") ||
        "openai/gpt-oss-20b,openai/gpt-oss-120b",
      // 芒寶（chatbot.post.ts）專用的 Gemini 清單與供應商順序。
      //
      // 2026-08-24 實測芒寶的 LLM 生成層（Layer 3，只有這一層會自由作答）：
      //   gpt-oss-120b 出現三次編造——把民眾導向不存在的「福利專欄的低收入戶懶人包」、
      //     保證政策內頁「會列出需要的文件與申請步驟」（多數政策其實只寫流程）、
      //     保證搜得到一個測試用的虛構補助；另把長照問題導向就業服務站。
      //   gpt-oss-20b 表現正常，只回「站內沒有這項細節，建議洽承辦單位確認」。
      //   兩個 gemini 型號都沒有出現上述情形。
      // 因此改為 Gemini 優先，Groq 留作備援並維持 20b 在 120b 前面。
      //
      // 已知共通弱點（換模型解決不了，要改提示詞）：問到站內沒有的虛構政策時，
      // 四個模型都不會說「查無此政策」，而是請民眾去搜尋，等於讓人白找一趟。
      geminiChatbotModels:
        readEnv("NUXT_LLM_GEMINI_CHATBOT_MODELS") ||
        "gemini-3.1-flash-lite,gemini-3.5-flash-lite",
      chatbotProviderOrder:
        readEnv("NUXT_LLM_CHATBOT_PROVIDER_ORDER") || "gemini,groq",
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
      // 沒有 lang 的話，NVDA／JAWS 會退回系統預設語音引擎（多半是英文）去念中文——
      // 使用者聽到的不是口音怪，是逐字亂念或整段跳過。本站的長者與視障使用者比例
      // 遠高於一般網站，這一行沒寫等於整站對報讀軟體不可用。WCAG 3.1.1（A）。
      htmlAttrs: { lang: "zh-Hant-TW" },
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
