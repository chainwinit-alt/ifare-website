export default {
    install(app: any, options: any) {
        let _global = app.config.globalProperties
        
        _global.$CommonLib = {
            Date: {
                GetDateNow() {
                    const _d = new Date()
                    const _formatDate = new Intl.DateTimeFormat('zh-tw', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    }).format(_d)
                    return `${_formatDate}`
                },
                GetFormatDateString(date:Date) {
                    return date.toLocaleString('zh-tw', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    })
                }
            },
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
            CheckValueType(val: any, allowTypes?: Array<string>){
                const valType = typeof val
                
                return valType
            },
            CopyArrayObj(obj: any) {
                if (typeof obj != 'object' || obj == null) return false;
                return JSON.parse(JSON.stringify(obj))
            },
            GuideToPage(routeName: string, options?: any) {
                let routeParam = { name: routeName }

                _global.$router.push(routeParam)
            },
            GetImgBase64(file: any) {
                return new Promise((resolve, reject) => {
                    if (typeof file == 'string') {
                        if (file == 'NA') return resolve('NA')
                        if (file.indexOf('data:') >= 0 && file.indexOf('base64') >= 0) return resolve(file)
                    }

                    const reader = new FileReader()
                    let imgResult:any = ''
                    reader.readAsDataURL(file)
                    reader.onload = () => {
                        imgResult = reader.result
                    }
                    reader.onerror = (error) => {
                        reject(error)
                    }
                    reader.onloadend = () => {
                        resolve(imgResult)
                    }
                })
            }
        }
    }
}
