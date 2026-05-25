// https://nuxt.com/docs/api/configuration/nuxt-config
const SITEMAP_LASTMOD = new Date().toISOString();
const DEFAULT_SITE_URL = 'https://www.i-fare.org.tw';
const RESOLVED_SITE_URL =
  process.env.NUXT_PUBLIC_SITE_URL ||
  process.env.NUXT_SITE_URL ||
  DEFAULT_SITE_URL;

export default defineNuxtConfig({
  devtools: { enabled: false },

  typescript: {
    tsConfig: {
      compilerOptions: {
        ignoreDeprecations: '6.0'
      }
    }
  },

  runtimeConfig: {
    // SSR (server-side fetch) 必須用「絕對 URL」直打正式 API
    //   原因：Nuxt SSR $fetch 用相對路徑會打回 Nuxt 自己，devProxy 不會生效，造成中介層無窮迴圈
    // Client (browser) 用相對路徑，走 nitro.devProxy 轉發到正式 API
    // 部署時用環境變數覆蓋：
    //   - VM 環境：NUXT_PUBLIC_FRONTEND_API_BASE=http://10.200.0.39/ifare_api/api/services/app
    //   - 正式機：NUXT_PUBLIC_FRONTEND_API_BASE=https://www.i-fare.org.tw/ifare_api/api/services/app
    frontendApiServerBase:
      process.env.NUXT_FRONTEND_API_SERVER_BASE || 'https://www.i-fare.org.tw/ifare_api/api/services/app',
    dynamicApiToken: process.env.NUXT_DYNAMIC_API_TOKEN || '',
    dynamicApiAllowedOrigins: process.env.NUXT_DYNAMIC_API_ALLOWED_ORIGINS || '',
    geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    public: {
      siteUrl: RESOLVED_SITE_URL,
      frontendApiBase:
        process.env.NUXT_PUBLIC_FRONTEND_API_BASE || '/api/services/app'
    }
  },

  nitro: {
    devProxy: {
      '/api/services/app': {
        target: 'https://www.i-fare.org.tw/ifare_api/api/services/app',
        changeOrigin: true,
        secure: false
      }
    },
    iis: {
      mergeConfig: true,
      overrideConfig: false
    }
  },

  modules: ['nuxt-gtag', 'nuxt-simple-sitemap'],
  css: [
    'normalize.css/normalize.css',
    '~/assets/style/styleIFare.scss'
  ],
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      meta: [
        { name: 'format-detection', content: 'telephone=no' }
      ]
    }
  },
  gtag: {
    id: 'G-QCT2XVFX2L'
  },
  site: {
    url: RESOLVED_SITE_URL
  },
  sitemap: {
    xslColumns: [
      { label: 'URL', width: '25%' },
      { label: 'Last Modified', select: 'sitemap:lastmod', width: '25%' },
      { label: 'Change Frequency', select: 'sitemap:changefreq', width: '25%' },
      { label: 'Priority', select: 'sitemap:priority', width: '12.5%' },
      { label: 'Hreflangs', select: 'count(xhtml:link)', width: '12.5%' }
    ]
  },
  routeRules: {
    '/': {
      sitemap: {
        priority: 1,
        changefreq: 'daily',
        lastmod: SITEMAP_LASTMOD
      }
    },
    '/about': {
      sitemap: {
        priority: 0.8,
        changefreq: 'daily',
        lastmod: SITEMAP_LASTMOD
      }
    },
    '/news': {
      sitemap: {
        priority: 0.8,
        changefreq: 'daily',
        lastmod: SITEMAP_LASTMOD
      }
    },
    '/articles': {
      sitemap: {
        priority: 0.8,
        changefreq: 'daily',
        lastmod: SITEMAP_LASTMOD
      }
    },
    '/collaborator': {
      sitemap: {
        priority: 0.8,
        changefreq: 'daily',
        lastmod: SITEMAP_LASTMOD
      }
    },
    '/ifare': {
      sitemap: {
        priority: 0.8,
        changefreq: 'daily',
        lastmod: SITEMAP_LASTMOD
      }
    },
    '/ifare/contact': {
      index: false
    },
    '/ifare/result': {
      index: false
    }
  }
})
