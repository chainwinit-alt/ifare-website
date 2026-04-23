/**
 * AjaxRef.ts
 * 後台管理端的 HTTP 請求描述物件。
 *
 * 這個檔案的責任不是直接送出請求，而是把一次 API 呼叫會用到的
 * baseURL、路徑、方法、標頭、查詢參數、本文內容與 Axios 額外設定
 * 統一包裝成一個可傳遞的物件，最後交由 WebAPI.ts 內的 ajax() 送出。
 */
import type { AxiosRequestConfig } from "axios";

/**
 * 將查詢參數中值為 null 的欄位剔除，避免把無效條件一併送給後端。
 * 這樣後端在判斷篩選條件時，只需要處理真正有帶值的欄位即可。
 */
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
    // 是否為開發模式；會直接影響 API 主機位置的選擇
    isDevMode: boolean = process.env.NODE_ENV != 'production';
    // API 主機位置，例如本機開發站或正式站
    baseUrl: string = this.getBaseUrl()
    // HTTP 方法，預設為 GET
    method?: string = "get"
    // 後端服務共用中繼路徑；大多數應用服務都會掛在這裡
    middleUrl: string = "/api/services/app"
    // 實際要呼叫的 API 路徑，例如 /News/GetDataList
    httpUrl: string = ""
    // HTTP 標頭，常見用途為帶入 Bearer Token
    headers: {[key: string]: any} = {}
    // GET 查詢參數
    params: {[key: string]: any} = {}
    // POST/PUT 等請求本文
    data: {[key: string]: any} | string = {}
    // 預設使用 JSON；若為檔案上傳會切換為 false 交給瀏覽器自行判定
    contentType: string | boolean = "application/json; charset=utf-8"
    // 是否需要讓 Axios/瀏覽器協助處理資料序列化
    processData: boolean = true
    // 補充的 Axios 設定，預設要求 JSON 回應
    axiosReqConfig: AxiosRequestConfig<string | object> = { responseType: "json"}

    /**
     * 建立一個新的 API 請求描述物件。
     * @param httpUrl 實際 API 路徑
     * @param method  HTTP 方法；未提供時預設為 GET
     */
    constructor(httpUrl: string, method?: string) {
        this.httpUrl = httpUrl
        if (typeof method !== "undefined") this.setMethod(method)
    }

    /**
     * 手動指定是否採用開發模式。
     * 若專案需要在特殊情境覆蓋 NODE_ENV 判斷，可以透過此方法調整。
     */
    setDevMethod(isDevMode: boolean): void {
        this.isDevMode = isDevMode
    }

    /**
     * 設定 HTTP 方法，並同步調整與檔案傳輸有關的附屬設定。
     * 目前支援一般 get/post，以及 get/file、post/file 兩種檔案情境。
     */
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

    /**
     * 設定 HTTP 標頭。
     */
    setHeaders(headers: {[key: string]: any}): void {
        this.headers = headers
    }

    /**
     * 覆寫中繼路徑。
     * 例如登入流程會改走 /api/TokenAuth，而不是一般 app service 路徑。
     */
    setMiddleUrl(middleUrl: string): void {
        this.middleUrl = middleUrl
    }

    /**
     * 設定實際 API 路徑。
     */
    setHttpUrl(httpUrl: string): void {
        this.httpUrl = httpUrl
    }

    /**
     * 設定查詢參數，並自動移除值為 null 的欄位。
     */
    setParams(params: {[key:string]: any}): void {
        this.params = GetCheckFilterParams(params)
    }

    /**
     * 設定請求本文。
     */
    setData(data: {[key:string]: any}): void {
        this.data = data
    }

    /**
     * 取得目前是否為開發模式。
     */
    getIsDevMode(): boolean {
        return this.isDevMode
    }

    /**
     * 根據執行環境回傳 API 主機位置。
     * 開發環境走本機站台，正式環境走公開後端站台。
     */
    getBaseUrl(): string {
        return this.isDevMode ? "https://localhost:44311" : "http://10.200.0.39/ifare_bdapi"
    }

    /**
     * 組合出最終 API 路徑。
     */
    getUrl(): string {
        return this.middleUrl + this.httpUrl
    }

    /**
     * 取得 HTTP 方法。
     */
    getMethod(): string {
        return `${this.method}`
    }

    /**
     * 取得 HTTP 標頭。
     */
    getHeaders(): any {
        return this.headers
    }

    /**
     * 取得查詢參數。
     */
    getParam(): object {
        return this.params
    }

    /**
     * 取得請求本文。
     */
    getData(): any {
        return this.data
    }

    /**
     * 取得 Axios 額外設定。
     */
    getAxiosReqConfig(): AxiosRequestConfig<string | object> {
        return this.axiosReqConfig
    }
}
