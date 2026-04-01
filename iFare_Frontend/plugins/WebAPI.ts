export default defineNuxtPlugin(() => {
    return {
        provide: {
            WebApiGet: async (path: string, query?: object) => await $fetch(path, { baseURL: 'https:///www.i-fare.org.tw/ifare_api/api/services/app', query: query}).catch(error => console.error(error.data)),
            WebApiPost: async (path: string, query?: object) => await $fetch(path, { method: "POST", baseURL: 'https:///www.i-fare.org.tw/ifare_api/api/services/app', query: query}).catch(error => console.error(error.data))
        }
    }
})