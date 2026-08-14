// API 錯誤分類 — 給呼叫端 + 全域監聽用
type ApiErrorCategory = 'timeout' | 'network' | 'client' | 'server' | 'unknown'

interface ApiErrorInfo {
    category: ApiErrorCategory
    status?: number
    message: string
    path: string
    method: 'GET' | 'POST'
    raw?: any
}

interface ApiResponseResult<T> {
    data: T | null
    error: ApiErrorInfo | null
}

function categorizeError(error: any): ApiErrorCategory {
    // $fetch (ofetch) 對 timeout 拋的 error.cause 是 AbortError
    if (error?.name === 'AbortError' || error?.cause?.name === 'AbortError') return 'timeout'
    const status = error?.statusCode ?? error?.response?.status
    if (typeof status === 'number') {
        if (status >= 500) return 'server'
        if (status >= 400) return 'client'
    }
    if (error?.message?.includes('fetch failed') || error?.message?.includes('Network')) return 'network'
    return 'unknown'
}

const API_TIMEOUT_MS = 90000

// 機器層級環境變數 NUXT_PUBLIC_FRONTEND_API_BASE="/ifare_api/..." 若 dev server 從
// git-bash 啟動，MSYS 路徑轉換會把值誤改成 "C:/Program Files/Git/ifare_api/..."，
// 導致瀏覽器把 API 打到 file:// 而整站資料變空。這裡在執行期把誤轉的值還原。
// （Nuxt 的 NUXT_PUBLIC_* 執行期覆寫發生在 nuxt.config 之後，所以必須在這裡處理。）
function normalizeApiBase(value: unknown) {
    const base = String(value || '')
    const mangled = base.match(/^[A-Za-z]:[\\/].*?([\\/]ifare_api[\\/].*)$/i)
    return mangled ? mangled[1].replace(/\\/g, '/') : base
}

export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig()
    const baseURL = normalizeApiBase(
        import.meta.server
            ? config.frontendApiServerBase
            : config.public.frontendApiBase
    )

    function logError(info: ApiErrorInfo) {
        // 結構化 log，方便日後改成集中 reporter
        // eslint-disable-next-line no-console
        console.warn(`[WebAPI][${info.method}][${info.category}]`, info.path, {
            status: info.status,
            message: info.message,
        })
    }

    async function requestWithDetail<T>(
        method: 'GET' | 'POST',
        path: string,
        query?: object,
    ): Promise<ApiResponseResult<T>> {
        try {
            const data = await $fetch<T>(path, {
                method,
                baseURL,
                query,
                timeout: API_TIMEOUT_MS,
            })

            return { data, error: null }
        } catch (error: any) {
            const detail: ApiErrorInfo = {
                category: categorizeError(error),
                status: error?.statusCode ?? error?.response?.status,
                message: error?.message ?? String(error),
                path,
                method,
                raw: error?.data ?? error,
            }

            logError(detail)
            return { data: null, error: detail }
        }
    }

    return {
        provide: {
            WebApiGet: async (path: string, query?: object) => {
                const { data } = await requestWithDetail('GET', path, query)
                return data
            },
            WebApiPost: async (path: string, query?: object) => {
                const { data } = await requestWithDetail('POST', path, query)
                return data
            },
            WebApiGetDetailed: async (path: string, query?: object) => {
                return requestWithDetail('GET', path, query)
            },
            WebApiPostDetailed: async (path: string, query?: object) => {
                return requestWithDetail('POST', path, query)
            },
        },
    }
})
