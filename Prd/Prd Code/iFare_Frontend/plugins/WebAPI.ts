/**
 * WebAPI Plugin — 全域 HTTP 請求工具
 * 透過 Nuxt Plugin 機制，將 API 呼叫方法注入到應用程式中，
 * 各頁面和元件可透過 useNuxtApp() 取得 $WebApiGet / $WebApiPost。
 *
 * 後端 API 基礎網址：https://www.i-fare.org.tw/ifare_api/api/services/app
 *
 * 這個 Plugin 是前台網站串接 API 的第一個入口。
 * 頁面邏輯不直接寫完整網址，而是只提供相對路徑，例如 `/News/GetNewsList`，
 * 再由這裡自動補上 ABP AppService 的固定前綴 `/api/services/app`。
 *
 * 實際串接流程：
 * Nuxt Page / Component
 *   -> useNuxtApp().$WebApiGet / $WebApiPost
 *   -> iFare_Frontend_API 的 AppService
 *   -> TaskManager
 *   -> EF Core / Repository
 *   -> SQL Server 的 IFare 業務資料庫
 */
export default defineNuxtPlugin(() => {
    return {
        provide: {
            /**
             * $WebApiGet：發送 GET 請求
             * @param path   API 路徑（相對於 baseURL），例如 "/News/GetNewsList"
             * @param query  查詢參數物件（可選），會附加在 URL 後方
             * @returns      Promise，解析為後端回傳的 JSON 資料；錯誤時印出 error.data
             *
             * 此處的 `path` 對應的是 ABP 自動暴露的應用服務方法，
             * 例如 `/News/GetNewsList` 實際會進到：
             * `iFare_Frontend_API -> NewsAppService.GetNewsList()`
             */
            WebApiGet: async (path: string, query?: object) => await $fetch(path, { baseURL: 'https:///www.i-fare.org.tw/ifare_api/api/services/app', query: query}).catch(error => console.error(error.data)),

            /**
             * $WebApiPost：發送 POST 請求
             * @param path   API 路徑（相對於 baseURL），例如 "/Visitor/SetVisitorRecord"
             * @param query  查詢參數物件（可選），會附加在 URL 後方
             * @returns      Promise，解析為後端回傳的 JSON 資料；錯誤時印出 error.data
             *
             * 前台目前主要用 POST 做像是訪客紀錄這類行為性 API。
             * 若後端方法未額外宣告 `[HttpPost]`，ABP 仍會依 AppService 方法規則暴露對應端點。
             */
            WebApiPost: async (path: string, query?: object) => await $fetch(path, { method: "POST", baseURL: 'https:///www.i-fare.org.tw/ifare_api/api/services/app', query: query}).catch(error => console.error(error.data))
        }
    }
})
