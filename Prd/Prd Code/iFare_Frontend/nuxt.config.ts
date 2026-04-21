// Nuxt 3 核心設定檔 — iFare（愛心基金會）前台網站
// 官方文件：https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // 關閉 Nuxt DevTools（正式環境不需要）
  devtools: { enabled: false },

  // Nitro 伺服器設定（部署至 IIS 時使用）
  nitro: {
    // IIS 部署選項
    iis: {
      // 合併既有的 web.config 到 Nitro 預設設定
      mergeConfig: true,
      // 不完全覆蓋 Nitro 預設的 web.config
      overrideConfig: false
    }
  },

  // 使用的 Nuxt 模組：Google Analytics 追蹤 & 網站地圖產生
  modules: ['nuxt-gtag', 'nuxt-simple-sitemap'],

  // 全域 CSS：normalize.css 重置樣式 + 網站自定義樣式
  css: [
    'normalize.css/normalize.css',
    '~/assets/style/styleIFare.scss'
  ],

  // HTML <head> 全域設定
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      meta: [
        // 避免行動裝置自動偵測電話號碼格式
        { name: 'format-detection', content: 'telephone=no'}
      ]
    }
  },

  // Google Analytics 追蹤 ID
  gtag: {
    id: 'G-QCT2XVFX2L'
  },

  // 網站正式網址（供 sitemap 模組使用）
  site: {
    url: 'https://www.i-fare.org.tw/'
  },

  // Sitemap XML 欄位設定（Sitemap 頁面的顯示欄位）
  sitemap: {
    xslColumns: [
      { label: 'URL', width: '25%'},
      { label: 'Last Modified', select: 'sitemap:lastmod', width: '25%'},
      { label: 'Change Frequency', select: 'sitemap:changefreq', width: '25%'},
      { label: 'Priority', select: 'sitemap:priority', width: '12.5%'},
      { label: 'Hreflangs', select: 'count(xhtml:link)', width: '12.5%'}
    ]
  },

  // 路由規則：設定各頁面的 sitemap 優先權、更新頻率與排除搜尋引擎索引
  routeRules: {
    // 首頁：最高優先權，每日更新
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
    // 以下子頁面為動態內容頁，不納入 sitemap 索引
    '/articles/lazy': {
      index: false  // 懶人包詳細頁不列入搜尋引擎索引
    },
    '/articles/welfare': {
      index: false  // 福利專欄詳細頁不列入搜尋引擎索引
    },
    '/ifare/contact': {
      index: false  // i-Fare 聯絡單位頁不列入搜尋引擎索引
    },
    '/ifare/info': {
      index: false  // i-Fare 福利詳細頁不列入搜尋引擎索引
    },
    '/ifare/result': {
      index: false  // i-Fare 搜尋結果頁不列入搜尋引擎索引
    },
    '/news/info': {
      index: false  // 最新消息詳細頁不列入搜尋引擎索引
    }
  }
})
