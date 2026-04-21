/**
 * 全域路由中介層（Global Route Middleware）
 * 每次路由切換時自動執行，負責：
 * 1. 記錄訪客瀏覽路徑至後端 API
 * 2. 處理帶有 ?reload 查詢參數的強制重新載入邏輯
 */
export default defineNuxtRouteMiddleware((to, from) => {
    const $router = useRouter();
    // 檢查目標路由是否含有 reload 查詢參數（用於強制重新整理頁面）
    const isReload = to.query.hasOwnProperty('reload')
    const { $WebApiPost } = useNuxtApp();


    // 呼叫後端 API 記錄訪客造訪的路由路徑
    const visitorRecord = $WebApiPost("/Visitor/SetVisitorRecord", { router: to.path})
    visitorRecord.then((res: any) => {
        // console.log(res)
    })

    // 若路由含有 reload 參數，移除該參數後強制重新載入頁面
    if (isReload) {
        // 移除 reload 查詢參數，避免重複觸發
        delete to.query.reload
        const _query = JSON.parse(JSON.stringify(to.query))
        // 以乾淨的查詢參數取代目前路由
        $router.replace({ path: to.path, query: _query})
        setTimeout(() => {
            // 捲回頁面頂端後重新載入（ttl: 3000ms 為快取存活時間）
            window.scrollTo(0,0)
            reloadNuxtApp({ path: to.path, ttl: 3000 })
        }, 10)
    }
})
