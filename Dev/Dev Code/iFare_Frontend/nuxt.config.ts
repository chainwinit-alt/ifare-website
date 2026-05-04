// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },

  runtimeConfig: {
    frontendApiServerBase:
      process.env.NUXT_FRONTEND_API_SERVER_BASE || '/api/services/app',
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://ifare.local',
      frontendApiBase:
        process.env.NUXT_PUBLIC_FRONTEND_API_BASE || '/api/services/app'
    }
  },

  nitro: {
    devProxy: {
      '/api/services/app': {
        target: 'https://localhost:44312/api/services/app',
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
    url: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
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
        lastmod: '2023-12-27T11:09:27+00:00'
      }
    },
    '/about': {
      sitemap: {
        priority: 0.8,
        changefreq: 'daily',
        lastmod: '2023-12-27T11:09:27+00:00'
      }
    },
    '/news': {
      sitemap: {
        priority: 0.8,
        changefreq: 'daily',
        lastmod: '2023-12-27T11:09:27+00:00'
      }
    },
    '/articles': {
      sitemap: {
        priority: 0.8,
        changefreq: 'daily',
        lastmod: '2023-12-27T11:09:27+00:00'
      }
    },
    '/collaborator': {
      sitemap: {
        priority: 0.8,
        changefreq: 'daily',
        lastmod: '2023-12-27T11:09:27+00:00'
      }
    },
    '/ifare': {
      sitemap: {
        priority: 0.8,
        changefreq: 'daily',
        lastmod: '2023-12-27T11:09:27+00:00'
      }
    },
    '/articles/lazy': {
      index: false
    },
    '/articles/welfare': {
      index: false
    },
    '/ifare/contact': {
      index: false
    },
    '/ifare/info': {
      index: false
    },
    '/ifare/result': {
      index: false
    },
    '/news/info': {
      index: false
    }
  }
})
