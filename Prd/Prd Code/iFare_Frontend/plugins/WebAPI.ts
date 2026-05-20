type ApiErrorCategory = 'timeout' | 'network' | 'client' | 'server' | 'unknown'

interface ApiErrorInfo {
    category: ApiErrorCategory
    status?: number
    message: string
    path: string
    method: 'GET' | 'POST'
    raw?: any
}

function categorizeError(error: any): ApiErrorCategory {
    if (error?.name === 'AbortError' || error?.cause?.name === 'AbortError') return 'timeout'

    const status = error?.statusCode ?? error?.response?.status
    if (typeof status === 'number') {
        if (status >= 500) return 'server'
        if (status >= 400) return 'client'
    }

    if (error?.message?.includes('fetch failed') || error?.message?.includes('Network')) return 'network'
    return 'unknown'
}

const API_TIMEOUT_MS = 60000

function sanitizeQuery(path: string, query?: object) {
    if (!query) return query

    const nextQuery: Record<string, any> = { ...(query as Record<string, any>) }

    if (path.includes('/FarePolicy/GetIFarePolicyList')) {
        if (nextQuery.CodePolicy === '__all_policy' || nextQuery.CodePolicy === '全部') {
            delete nextQuery.CodePolicy
        }

        if (nextQuery.CodeDomicile === '__all_area' || nextQuery.CodeDomicile === '全國') {
            delete nextQuery.CodeDomicile
        }
    }

    return nextQuery
}

export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig()
    const baseURL = import.meta.server
        ? config.frontendApiServerBase
        : config.public.frontendApiBase

    function logError(info: ApiErrorInfo) {
        console.warn(`[WebAPI][${info.method}][${info.category}]`, info.path, {
            status: info.status,
            message: info.message,
        })
    }

    return {
        provide: {
            WebApiGet: async (path: string, query?: object) => {
                try {
                    return await $fetch(path, {
                        baseURL,
                        query: sanitizeQuery(path, query),
                        timeout: API_TIMEOUT_MS,
                    })
                } catch (error: any) {
                    logError({
                        category: categorizeError(error),
                        status: error?.statusCode ?? error?.response?.status,
                        message: error?.message ?? String(error),
                        path,
                        method: 'GET',
                        raw: error?.data ?? error,
                    })
                    return null
                }
            },
            WebApiPost: async (path: string, query?: object) => {
                try {
                    return await $fetch(path, {
                        method: 'POST',
                        baseURL,
                        query: sanitizeQuery(path, query),
                        timeout: API_TIMEOUT_MS,
                    })
                } catch (error: any) {
                    logError({
                        category: categorizeError(error),
                        status: error?.statusCode ?? error?.response?.status,
                        message: error?.message ?? String(error),
                        path,
                        method: 'POST',
                        raw: error?.data ?? error,
                    })
                    return null
                }
            },
        },
    }
})
