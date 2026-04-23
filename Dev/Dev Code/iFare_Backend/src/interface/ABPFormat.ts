export interface ABPResBase {
    error: any
    result: any
    success: boolean
    targetUrl: any
    unAuthorizedRequest: boolean
    __abp: boolean
}

//  Response Error Info
export interface ABPResErrorInfo {
    code: number
    message: string
    detail: string
    validationErrors: any
}
export interface ABPResError extends ABPResBase {
    error: ABPResErrorInfo
}

//  Response Success Info
export interface ABPResSuccessInfo {
    Result?: any
    errCode: number
    errString: string
}
export interface ABPResSuccess extends ABPResBase{
    result: ABPResSuccessInfo
}

//#region Else response
export interface ResImage {
    ImagePath: string
    ImageName: string
    ImageExtension: string
}
export interface ResKeyWord {
    CreateUserName: string
    CreateUserID: number
    CreateDate: string
    UpdateUserName: string
    UpdateUserID: number
    UpdateDate: string
    ID: number
    LabelName: string
    State: string
}
//#endregion

//#region Account
export interface ResAccount_GetAccountList {
    CreateUserName: string
    CreateUserID: number
    CreateDate: string
    UpdateUserName: string
    UpdateUserID: number
    ID: number
    Account: string
    UserName: string
    Email: string
    Permission: string
    State: string
    Pwd: string
}
//#endregion

//#region ArticlesLazy
export interface ResArticlesLazy_GetDataList {
    CreateUserName: string
    CreateUserID: number
    CreateDate: string
    UpdateUserName: string
    UpdateUserID: number
    UpdateDate: string
    ID: number
    Title: string
    ImageList: Array<ResImage>
    CodePolicy_ID: number
    CodePolicy_LabelName: string
    CodeKeyworkList: Array<ResKeyWord>
    ReleaseTime: string
    DiscontinuedTime: string
    State: string
}
//#endregion

//#region ArticlesWelfare
//#endregion

//#region CodeDomicile
//#endregion

//#region COdeIdentity
//#endregion

//#region CodeIncome
//#endregion

//#region CodeKeyword
//#endregion

//#region CodePolicy
//#endregion

//#region CodeRecipient
//#endregion

//#region Collaborator
//#endregion

//#region FareOfficeUnit
//#endregion

//#region FarePolicy
//#endregion

//#region FareQA
//#endregion

//#region ImgManager
//#endregion

//#region Main
//#endregion

//#region News
//#endregion

//#region Personal
//#endregion

//#region TokenAuth
//#endregion

//#region Visitor
//#endregion