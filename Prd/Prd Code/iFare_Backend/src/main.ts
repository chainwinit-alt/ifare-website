/**
 * main.ts
 * iFare 愛心基金會後台管理系統 — 應用程式進入點
 * 負責建立 Vue 應用程式實例、註冊全域外掛與元件，並掛載至 DOM
 */

import { createApp } from 'vue'
import { createPinia } from 'pinia'
// pinia-plugin-persistedstate：讓 Pinia store 的狀態可持久化至 localStorage
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// Normalize.css：重置各瀏覽器預設樣式，確保跨瀏覽器一致性
import 'normalize.css'

// Element Plus：基於 Vue 3 的 UI 元件庫，並使用繁體中文語言包
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import zhTw from 'element-plus/es/locale/lang/zh-tw'

// Apexcharts：圖表元件庫，用於資料分析頁面的圖表顯示
import VueApexCharts from 'vue3-apexcharts'

// CommonLib：自訂通用工具函式（日期格式化、物件操作、路由跳轉等）
import CommonLib from './plugins/CommonLib'

// WebAPI：封裝所有後端 API 呼叫方法，掛載於 $WebAPI 全域屬性
import WebAPI from './plugins/WebAPI'

// 全域 SCSS 樣式表
import './assets/style/styleIFare.scss'

import App from './App.vue'
import router from './router'

// 建立 Vue 應用程式實例
const app = createApp(App)

// 批次註冊所有 Element Plus 圖示為全域元件，可直接在 template 中使用圖示名稱
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}

// 建立 Pinia 狀態管理實例，並啟用持久化外掛（狀態存至 localStorage）
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// 依序掛載所有外掛
app.use(VueApexCharts)                    // 圖表外掛
app.use(pinia)                            // 狀態管理
app.use(router, { app: app})              // 路由（含導航守衛）
app.use(ElementPlus, {
    locale: zhTw                          // Element Plus 使用繁體中文
})
app.use(CommonLib, { app: app })          // 通用工具函式庫
app.use(WebAPI, {app: app})               // Web API 呼叫封裝

// 將應用程式掛載至 index.html 中 id="app" 的 DOM 元素
app.mount('#app')
