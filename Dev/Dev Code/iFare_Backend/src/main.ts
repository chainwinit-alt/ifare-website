import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// Normalize.css
import 'normalize.css'

// Element-plus (element-ui)
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import zhTw from 'element-plus/es/locale/lang/zh-tw'

// Apexcharts
import VueApexCharts from 'vue3-apexcharts'

// Common library
import CommonLib from './plugins/CommonLib'

// WebAPI
import WebAPI from './plugins/WebAPI'

import './assets/style/styleIFare.scss'

import App from './App.vue'
import router from './router'

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(VueApexCharts)
app.use(pinia)
app.use(router, { app: app})
app.use(ElementPlus, {
    locale: zhTw
})
app.use(CommonLib, { app: app })
app.use(WebAPI, {app: app})

app.mount('#app')
