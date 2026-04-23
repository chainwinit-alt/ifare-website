// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },
  nitro: {
    // IIS options default
    iis: {
      // merges in a pre-existing web.config file to the nitro default file
      mergeConfig: true,
      // overrides the default nitro web.config file all together
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
        { name: 'format-detection', content: 'telephone=no'}
      ]
    }
  },
  gtag: {
    id: 'G-QCT2XVFX2L'
  },
  site: {
    url: 'https://www.i-fare.org.tw/'
  },
  sitemap: {
    // xsl: false,
    // defaults: {
    //   priority: 0.8,
    //   changefreq: 'daily',
    //   lastmod: '2023-12-27T11:09:27+00:00'
    // },
    xslColumns: [
      { label: 'URL', width: '25%'},
      { label: 'Last Modified', select: 'sitemap:lastmod', width: '25%'},
      { label: 'Change Frequency', select: 'sitemap:changefreq', width: '25%'},
      { label: 'Priority', select: 'sitemap:priority', width: '12.5%'},
      { label: 'Hreflangs', select: 'count(xhtml:link)', width: '12.5%'}
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
