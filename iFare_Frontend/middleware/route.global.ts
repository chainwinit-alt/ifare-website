export default defineNuxtRouteMiddleware((to, from) => {
    const $router = useRouter();
    const isReload = to.query.hasOwnProperty('reload')
    const { $WebApiPost } = useNuxtApp();

    
    // Record visitor route.
    const visitorRecord = $WebApiPost("/Visitor/SetVisitorRecord", { router: to.path})
    visitorRecord.then((res: any) => {
        // console.log(res)
    })

    if (isReload) {
        delete to.query.reload
        const _query = JSON.parse(JSON.stringify(to.query))
        $router.replace({ path: to.path, query: _query})
        setTimeout(() => {
            window.scrollTo(0,0)
            reloadNuxtApp({ path: to.path, ttl: 3000 })
        }, 10)
    }
})