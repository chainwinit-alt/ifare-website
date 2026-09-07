import type { AxiosRequestConfig } from "axios";

function GetCheckFilterParams(params: {[key:string]: any}){
    let _keys = Object.keys(params)

    _keys.forEach((key:any, i:number) => {
        if (params[key] == null){
            delete params[key]
        }
    })

    return params
}

export class AjaxRef {
    isDevMode: boolean = process.env.NODE_ENV != 'production';
    baseUrl: string = this.getBaseUrl()
    method?: string = "get"
    middleUrl: string = "/api/services/app"
    httpUrl: string = ""
    headers: {[key: string]: any} = {}
    params: {[key: string]: any} = {}
    data: {[key: string]: any} | string = {}
    contentType: string | boolean = "application/json; charset=utf-8"
    processData: boolean = true
    axiosReqConfig: AxiosRequestConfig<string | object> = { responseType: "json"}

    constructor(httpUrl: string, method?: string) {
        this.httpUrl = httpUrl
        if (typeof method !== "undefined") this.setMethod(method)
    }

    setDevMethod(isDevMode: boolean): void {
        this.isDevMode = isDevMode
    }

    setMethod(method: string): void {
        switch (method.toLowerCase()) {
            case "get":
                break;
            case "post":
                break;
            case "post/file":
                this.method = "post"
                this.contentType = false
                this.processData = false
                break;
            case "get/file":
                this.method = "get"
                this.axiosReqConfig.responseType = "blob"
                break;
        }
        this.method = method.toLowerCase()
    }

    setHeaders(headers: {[key: string]: any}): void {
        this.headers = headers
    }

    setMiddleUrl(middleUrl: string): void {
        this.middleUrl = middleUrl
    }

    setHttpUrl(httpUrl: string): void {
        this.httpUrl = httpUrl
    }

    setParams(params: {[key:string]: any}): void {
        this.params = GetCheckFilterParams(params)
    }

    setData(data: {[key:string]: any}): void {
        this.data = data
    }

    getIsDevMode(): boolean {
        return this.isDevMode
    }

    getBaseUrl(): string {
        // 2026-09-01：正式環境改用相對路徑。後台 SPA（/ifare_backend）與後台 API（/ifare_bdapi）
        // 掛在同一個 IIS 站台，相對路徑天然同源——不吃寫死的內網 IP、不用 CORS、協定跟著站台走，
        // 換網域或 IP 都不需要重建。（舊值 http://10.200.0.39/ifare_bdapi 使後台只能在該內網使用。）
        return this.isDevMode ? "https://localhost:44311" : "/ifare_bdapi"
    }

    getUrl(): string {
        return this.middleUrl + this.httpUrl
    }

    getMethod(): string {
        return `${this.method}`
    }

    getHeaders(): any {
        return this.headers
    }

    getParam(): object {
        return this.params
    }

    getData(): any {
        return this.data
    }

    getAxiosReqConfig(): AxiosRequestConfig<string | object> {
        return this.axiosReqConfig
    }
}
