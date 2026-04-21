/**
 * CommonLib.ts
 * 後台管理端共用工具外掛。
 *
 * 這裡提供的是偏「畫面層與互動層」會反覆使用的小工具，
 * 例如日期格式化、物件重置、深拷貝、頁面跳轉與圖片轉 Base64。
 * 透過 app.config.globalProperties 掛上去後，元件可直接以 $CommonLib 使用。
 */
export default {
    install(app: any, options: any) {
        // 取得 Vue 全域屬性，後續會把自訂工具統一掛載到這裡
        let _global = app.config.globalProperties
        
        _global.$CommonLib = {
            Date: {
                /**
                 * 取得今天日期字串，格式依 zh-tw 語系輸出為 YYYY/MM/DD 類型。
                 */
                GetDateNow() {
                    const _d = new Date()
                    const _formatDate = new Intl.DateTimeFormat('zh-tw', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    }).format(_d)
                    return `${_formatDate}`
                },
                /**
                 * 將指定日期格式化為繁中日期字串。
                 */
                GetFormatDateString(date:Date) {
                    return date.toLocaleString('zh-tw', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    })
                }
            },
            /**
             * 盡量保留原物件參考位址的前提下，將內容重設為初始值。
             *
             * 這在 Vue 響應式資料中特別重要，因為若直接替換整個物件，
             * 可能會讓既有綁定失效；使用 Object.assign / splice 可以保留參考。
             */
            ResetObjRef(obj:any, initObj: any) {
                console.log('【ResetObjRef】')
                if (typeof obj != 'object' || obj == null) return false;
                const isObjArray = obj.constructor === [].constructor
                const isObjJSON = obj.constructor === ({}).constructor
                const isInitObjArray = initObj.constructor === [].constructor
                const isInitObjJSON = initObj.constructor === ({}).constructor
                if (!initObj) {
                    if (isObjArray) initObj = []
                    if (isObjJSON) initObj = {}
                }

                if (isObjArray && isInitObjJSON) {
                    obj.splice(0, obj.length)
                    return obj.push(initObj)
                }

                Object.assign(obj, initObj)
            },
            /**
             * 回傳傳入值的 JavaScript 型別字串。
             * 目前 allowTypes 尚未參與判斷，保留作為後續擴充用途。
             */
            CheckValueType(val: any, allowTypes?: Array<string>){
                const valType = typeof val
                
                return valType
            },
            /**
             * 以 JSON 序列化方式進行簡易深拷貝。
             * 適合處理一般物件/陣列，不適合含 Date、Function、Map 等特殊型別。
             */
            CopyArrayObj(obj: any) {
                if (typeof obj != 'object' || obj == null) return false;
                return JSON.parse(JSON.stringify(obj))
            },
            /**
             * 依路由名稱導頁。
             * 目前 options 參數尚未實作，但保留未來可擴充 query / params 的空間。
             */
            GuideToPage(routeName: string, options?: any) {
                let routeParam = { name: routeName }

                _global.$router.push(routeParam)
            },
            /**
             * 將檔案轉為 Base64 字串。
             *
             * 若傳入值原本就是 Base64 或字串型態的特殊占位值（如 NA），
             * 會直接回傳，避免重複轉換。
             */
            GetImgBase64(file: any) {
                return new Promise((resolve, reject) => {
                    if (typeof file == 'string') {
                        if (file == 'NA') return resolve('NA')
                        if (file.indexOf('data:') >= 0 && file.indexOf('base64') >= 0) return resolve(file)
                    }

                    const reader = new FileReader()
                    let imgResult:any = ''
                    // 讀取圖片為 data URL，供預覽或上傳時使用
                    reader.readAsDataURL(file)
                    reader.onload = () => {
                        imgResult = reader.result
                    }
                    reader.onerror = (error) => {
                        reject(error)
                    }
                    reader.onloadend = () => {
                        // 不論成功或失敗都在讀取結束時回傳目前結果
                        resolve(imgResult)
                    }
                })
            }
        }
    }
}
