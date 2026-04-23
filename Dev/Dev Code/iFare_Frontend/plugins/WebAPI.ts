export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig()
    const baseURL = import.meta.server
        ? config.frontendApiServerBase
        : config.public.frontendApiBase

    return {
        provide: {
            WebApiGet: async (path: string, query?: object) => await $fetch(path, { baseURL, query }).catch(error => {
                console.error('[WebAPI][GET]', path, error?.data ?? error)
                return null
            }),
            WebApiPost: async (path: string, query?: object) => await $fetch(path, { method: 'POST', baseURL, query }).catch(error => {
                console.error('[WebAPI][POST]', path, error?.data ?? error)
                return null
            })
        }
    }
})
