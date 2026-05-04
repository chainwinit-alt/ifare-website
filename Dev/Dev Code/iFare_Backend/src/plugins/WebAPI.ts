/**
 * WebAPI.ts
 * 後台管理端的 API 呼叫封裝外掛。
 *
 * 此檔案把所有後台可用的 API 端點集中在同一個全域物件 `$WebAPI` 下，
 * 讓各個畫面只需要呼叫語意化的方法名稱，例如 `GetNewsList`、
 * `InsertAccount`、`UpdatePersonalInfo`，而不必重複撰寫 Axios 設定。
 *
 * 每個方法大致都遵循相同流程：
 * 1. 建立 `AjaxRef`，描述本次請求的 URL 與 HTTP 方法
 * 2. 視需求塞入 Bearer Token、查詢參數或本文資料
 * 3. 統一交給底部的 `ajax()` 方法送出
 * 4. 成功與失敗都透過 callback 回傳，讓呼叫端自行處理畫面邏輯
 *
 * 實際串接路徑可概略理解為：
 * Vue 畫面 / 元件
 *   -> 呼叫 `$WebAPI.某方法(...)`
 *   -> 建立 `AjaxRef`
 *   -> 交由 `ajax()` 組成 Axios 請求
 *   -> 後端 `iFare_Backend_API`
 *   -> `/api/services/app/<AppService>/<Method>` 或 `/api/TokenAuth/*`
 *   -> AppService -> TaskManager -> Repository -> SQL Server
 */
import axios from "axios"
import { AjaxRef } from "./AjaxRef"
import { useUserStore } from "@/stores/user";

export default {
    install(app: any, options: any) {
        // 取得 Vue 全域屬性，讓 plugin 可以註冊 $WebAPI 供整個應用共用
        let _global = app.config.globalProperties

        _global.$WebAPI = {
            /**
             * 向後端驗證帳號密碼，取得初始 JWT Token。
             * 此方法走的是 TokenAuth 路徑，而不是一般 app service 路徑。
             *
             * 原因是登入驗證屬於「先取得身分」的特殊流程，
             * 尚未能使用 `/api/services/app` 內需要授權的應用服務，
             * 因此必須改走 `TokenAuthController` 暴露的獨立入口。
             */
            Auth(act: string, pwd: string, callback: any){
                const ajaxRef = new AjaxRef("/Authenticate", "post")
                ajaxRef.setMiddleUrl("/api/TokenAuth")
                ajaxRef.setData({"userNameOrEmailAddress": act, "password": pwd})
                this.ajax(ajaxRef, callback)
            },
            /**
             * 以已取得的 JWT Token 呼叫後台登入流程，
             * 讓系統載入更多屬於後台使用者的登入資料。
             *
             * 這是後台目前採用的雙階段登入：
             * 1. `Auth()` 先驗證帳密並換到 JWT
             * 2. `Login()` 再透過授權後的 AppService 取得後台使用者資料
             */
            Login(token: string, act: string, pwd: string, callback: any){
                const ajaxRef = new AjaxRef("/Main/Login", "post")
                ajaxRef.setHeaders({ Authorization: "Bearer " + token })
                ajaxRef.setData({"act": act, "pwd": pwd})
                this.ajax(ajaxRef, callback)
            },
            //#region News
            GetNewsList(token: string, createDate_start: string, createDate_end: string, updateDate_start: string, updateDate_end: string, state: string, ids: Array<number>, callback: any){
                const ajaxRef = new AjaxRef('/News/GetDataList')
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setParams({
                    CreateDateStart: createDate_start,
                    CreateDateEnd: createDate_end,
                    UpdateDateStart: updateDate_start,
                    UpdateDateEnd: updateDate_end,
                    State: state,
                    IDs: ids
                })
                this.ajax(ajaxRef, callback)
            },
            InsertNews(token: string, title: string, detail: string, releaseTime: string, discontinuedTime: string, state: boolean, callback: any){
                const ajaxRef = new AjaxRef('/News/InsertNews', "post")
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setData({
                    title: title,
                    detail: detail,
                    releaseTime: releaseTime,
                    discontinuedTime: discontinuedTime,
                    isEnabled: state
                  })
                this.ajax(ajaxRef, callback)
            },
            UpdateNews(token: string, id: number, title: string, detail: string, releaseTime: string, discontinuedTime: string, state: boolean, callback: any){
                const ajaxRef = new AjaxRef('/News/UpdateNews', "post")
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setData({
                    id: id,
                    title: title,
                    detail: detail,
                    releaseTime: releaseTime,
                    discontinuedTime: discontinuedTime,
                    isEnabled: state
                  })
                this.ajax(ajaxRef, callback)
            },
            DeleteNews(token: string, id: number, callback: any){
                const ajaxRef = new AjaxRef('/News/DeleteNews', "post")
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setData({
                    id: id
                  })
                this.ajax(ajaxRef, callback)
            },
            //#endregion
            //#region Articles
            //#region Articles_Welfare
            GetArticlesWelfareList(token: string, createDate_start: string, createDate_end: string, updateDate_start: string, updateDate_end: string, 
                releaseDate_start: string, releaseDate_end: string, discontinuedDate_start: string, discontinuedDate_end: string, codePolicy: number, 
                codeKeywords: Array<number>, state: string, ids: Array<number>, callback: any){
                const ajaxRef = new AjaxRef('/ArticlesWelfare/GetDataList')
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setParams({
                    CreateDateStart: createDate_start,
                    CreateDateEnd: createDate_end,
                    UpdateDateStart: updateDate_start,
                    UpdateDateEnd: updateDate_end,
                    ReleaseTimeStart: releaseDate_start,
                    ReleaseTimeEnd: releaseDate_end,
                    DiscontinuedTimeStart: discontinuedDate_start,
                    DiscontinuedTimeEnd: discontinuedDate_end,
                    CodePolicy: codePolicy,
                    CodeKeywords: codeKeywords,
                    State: state,
                    IDs: ids
                })
                this.ajax(ajaxRef, callback)
            },
            InsertArticlesWelfare(token: string, title: string, detail: string, codePolicyID: number, codeKeywordIDs: Array<number>, 
                releaseTime: string, discontinuedTime: string, state: boolean, callback: any){
                const ajaxRef = new AjaxRef('/ArticlesWelfare/InsertArticlesWelfare', "post")
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setData({
                    title: title,
                    detail: detail,
                    codePolicyID: codePolicyID,
                    codeKeywordIDs: codeKeywordIDs,
                    releaseTime: releaseTime,
                    discontinuedTime: discontinuedTime,
                    isEnabled: state
                  })
                this.ajax(ajaxRef, callback)
            },
            UpdateArticlesWelfare(token: string, id: number, title: string, detail: string, codePolicyID: number, codeKeywordIDs: Array<number>, 
                releaseTime: string, discontinuedTime: string, state: boolean, callback: any){
                const ajaxRef = new AjaxRef('/ArticlesWelfare/UpdateArticlesWelfare', "post")
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setData({
                    id: id,
                    title: title,
                    detail: detail,
                    codePolicyID: codePolicyID,
                    codeKeywordIDs: codeKeywordIDs,
                    releaseTime: releaseTime,
                    discontinuedTime: discontinuedTime,
                    isEnabled: state
                  })
                this.ajax(ajaxRef, callback)
            },
            DeleteArticlesWelfare(token: string, id: number, callback: any){
                const ajaxRef = new AjaxRef('/ArticlesWelfare/DeleteArticlesWelfare', "post")
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setData({
                    id: id
                  })
                this.ajax(ajaxRef, callback)
            },
            //#endregion
            //#region Articles_Lazy
            GetArticlesLazyList(token: string, createDate_start: string, createDate_end: string, updateDate_start: string, updateDate_end: string, 
                releaseDate_start: string, releaseDate_end: string, discontinuedDate_start: string, discontinuedDate_end: string, codeKeywords: Array<number>, 
                state: string, ids: Array<number>, callback: any){
                const ajaxRef = new AjaxRef('/ArticlesLazy/GetDataList')
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setParams({
                    CreateDateStart: createDate_start,
                    CreateDateEnd: createDate_end,
                    UpdateDateStart: updateDate_start,
                    UpdateDateEnd: updateDate_end,
                    ReleaseTimeStart: releaseDate_start,
                    ReleaseTimeEnd: releaseDate_end,
                    DiscontinuedTimeStart: discontinuedDate_start,
                    DiscontinuedTimeEnd: discontinuedDate_end,
                    CodeKeywords: codeKeywords,
                    State: state,
                    IDs: ids
                })
                this.ajax(ajaxRef, callback)
            },
            InsertArticlesLazy(token: string, title: string, imageList: any, codePolicyID: number, codeKeywordIDs: Array<number>, releaseTime: string,
                discontinuedTime: string, state: boolean, callback: any){
                const ajaxRef = new AjaxRef('/ArticlesLazy/InsertArticlesLazy', "post")
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setData({
                    title: title,
                    imageList: imageList,
                    codePolicyID: codePolicyID,
                    codeKeywordIDs: codeKeywordIDs,
                    releaseTime: releaseTime,
                    discontinuedTime: discontinuedTime,
                    isEnabled: state
                  })
                this.ajax(ajaxRef, callback)
            },
            UpdateArticlesLazy(token: string, id: number, title: string, imageList: any, codePolicyID: number, codeKeywordIDs: Array<number>, releaseTime: string,
                discontinuedTime: string, state: boolean, callback: any){
                const ajaxRef = new AjaxRef('/ArticlesLazy/UpdateArticlesLazy', "post")
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setData({
                    id: id,
                    title: title,
                    imageList: imageList,
                    codePolicyID: codePolicyID,
                    codeKeywordIDs: codeKeywordIDs,
                    releaseTime: releaseTime,
                    discontinuedTime: discontinuedTime,
                    isEnabled: state
                  })
                this.ajax(ajaxRef, callback)
            },
            DeleteArticlesLazy(token: string, id: number, callback: any){
                const ajaxRef = new AjaxRef('/ArticlesLazy/DeleteArticlesLazy', "post")
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setData({
                    id: id
                  })
                this.ajax(ajaxRef, callback)
            },
            //#endregion
            //#endregion
            //#region I-Fare
            //#region I-Fare_OfficeUnit
            GetFareOfficeUnitList(token: string, createDate_start: string, createDate_end: string, updateDate_start: string, updateDate_end: string, 
                searchName: string, isContainElse: boolean, ids: Array<number>, callback: any){
                const ajaxRef = new AjaxRef('/FareOfficeUnit/GetDataList')
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setParams({
                    CreateDateStart: createDate_start,
                    CreateDateEnd: createDate_end,
                    UpdateDateStart: updateDate_start,
                    UpdateDateEnd: updateDate_end,
                    SearchName: searchName,
                    isContainElse: isContainElse,
                    IDs: ids
                })
                this.ajax(ajaxRef, callback)
            },
            InsertFareOfficeUnit(token: string, title: string, officeList: any, state: boolean, callback: any){
                const ajaxRef = new AjaxRef('/FareOfficeUnit/InsertFareOfficeUnit', "post")
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setData({
                    title: title,
                    officeList: officeList,
                    isEnabled: state
                  })
                this.ajax(ajaxRef, callback)
            },
            UpdateFareOfficeUnit(token: string, id: number, title: string, officeList: any, state: boolean, callback: any){
                const ajaxRef = new AjaxRef('/FareOfficeUnit/UpdateFareOfficeUnit', "post")
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setData({
                    id: id,
                    title: title,
                    officeList: officeList,
                    isEnabled: state
                  })
                this.ajax(ajaxRef, callback)
            },
            //#endregion
            //#region I-Fare_Policy
            GetFarePolicyList(token: string, createDate_start: string, createDate_end: string, updateDate_start: string, updateDate_end: string, 
                releaseDate_start: string, releaseDate_end: string, discontinuedDate_start: string, discontinuedDate_end: string, codeDomicile: number,
                codePolicy: number, codeKeywords: Array<number>, state: string, ids: Array<number>, state_release: string, callback: any){
                const ajaxRef = new AjaxRef('/FarePolicy/GetDataList')
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setParams({
                    CreateDateStart: createDate_start,
                    CreateDateEnd: createDate_end,
                    UpdateDateStart: updateDate_start,
                    UpdateDateEnd: updateDate_end,
                    ReleaseTimeStart: releaseDate_start,
                    ReleaseTimeEnd: releaseDate_end,
                    DiscontinuedTimeStart: discontinuedDate_start,
                    DiscontinuedTimeEnd: discontinuedDate_end,
                    CodeDomicile: codeDomicile,
                    CodePolicy: codePolicy,
                    CodeKeywords: codeKeywords,
                    State: state,
                    IDs: ids,
                    State_Release: state_release
                })
                this.ajax(ajaxRef, callback)
            },
            InsertFarePolicy(token: string, title: string, qualification: string, welfareInfo: string, evidence: string, iFareOfficeUnitID: number,
                officeUnitInfo: string, officeUnitTel: string, codePolicyID: number, codeDomicileID: number, codeIndentityIDs: Array<number>, codeIncomeIDs: Array<number>, 
                codeRecipientIDs: Array<number>, codeKeywordIDs: Array<number>, competentAuthority: string, releaseTime: string, discontinuedTime: string,
                remark: string, state: boolean, callback: any){
                const ajaxRef = new AjaxRef('/FarePolicy/InsertFarePolicy', "post")
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setData({
                    title: title,
                    qualification: qualification,
                    welfareInfo: welfareInfo,
                    evidence: evidence,
                    iFareOfficeUnitID: iFareOfficeUnitID,
                    officeUnitInfo: officeUnitInfo,
                    officeUnitTel: officeUnitTel,
                    codePolicyID: codePolicyID,
                    codeDomicileID: codeDomicileID,
                    codeIndentityIDs: codeIndentityIDs,
                    codeIncomeIDs: codeIncomeIDs,
                    codeRecipientIDs: codeRecipientIDs,
                    codeKeywordIDs: codeKeywordIDs,
                    competentAuthority: competentAuthority,
                    releaseTime: releaseTime,
                    discontinuedTime: discontinuedTime,
                    remark: remark,
                    isEnabled: state
                  })
                this.ajax(ajaxRef, callback)
            },
            UpdateFarePolicy(token: string, id: number, title: string, qualification: string, welfareInfo: string, evidence: string, iFareOfficeUnitID: number,
                officeUnitInfo: string, officeUnitTel: string, codePolicyID: number, codeDomicileID: number, codeIndentityIDs: Array<number>, codeIncomeIDs: Array<number>, 
                codeRecipientIDs: Array<number>, codeKeywordIDs: Array<number>, competentAuthority: string, releaseTime: string, discontinuedTime: string,
                remark: string, state: boolean, callback: any){
                const ajaxRef = new AjaxRef('/FarePolicy/UpdateFarePolicy', "post")
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setData({
                    id: id,
                    title: title,
                    qualification: qualification,
                    welfareInfo: welfareInfo,
                    evidence: evidence,
                    iFareOfficeUnitID: iFareOfficeUnitID,
                    officeUnitInfo: officeUnitInfo,
                    officeUnitTel: officeUnitTel,
                    codePolicyID: codePolicyID,
                    codeDomicileID: codeDomicileID,
                    codeIndentityIDs: codeIndentityIDs,
                    codeIncomeIDs: codeIncomeIDs,
                    codeRecipientIDs: codeRecipientIDs,
                    codeKeywordIDs: codeKeywordIDs,
                    competentAuthority: competentAuthority,
                    releaseTime: releaseTime,
                    discontinuedTime: discontinuedTime,
                    remark: remark,
                    isEnabled: state
                  })
                this.ajax(ajaxRef, callback)
            },
            DeleteFarePolicy(token: string, id: number, callback: any){
                const ajaxRef = new AjaxRef('/FarePolicy/DeleteFarePolicy', "post")
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setData({
                    id: id
                  })
                this.ajax(ajaxRef, callback)
            },
            //#endregion
            //#region I-Fare_QA
            GetFareQAList(token: string, createDate_start: string, createDate_end: string, updateDate_start: string, updateDate_end: string, ids: Array<number>, callback: any){
                const ajaxRef = new AjaxRef('/FareQA/GetDataList')
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setParams({
                    CreateDateStart: createDate_start,
                    CreateDateEnd: createDate_end,
                    UpdateDateStart: updateDate_start,
                    UpdateDateEnd: updateDate_end,
                    IDs: ids
                })
                this.ajax(ajaxRef, callback)
            },
            InsertFareQA(token: string, question: string, answer: string, state: boolean, callback: any){
                const ajaxRef = new AjaxRef('/FareQA/InsertFareQA', "post")
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setData({
                    question: question,
                    answer: answer,
                    isEnabled: state
                  })
                this.ajax(ajaxRef, callback)
            },
            UpdateFareQA(token: string, id: number, question: string, answer: string, state: boolean, callback: any){
                const ajaxRef = new AjaxRef('/FareQA/UpdateFareQA', "post")
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setData({
                    id: id,
                    question: question,
                    answer: answer,
                    isEnabled: state
                  })
                this.ajax(ajaxRef, callback)
            },
            DeleteFareQA(token: string, id: number, callback: any){
                const ajaxRef = new AjaxRef('/FareQA/DeleteFareQA', "post")
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setData({
                    id: id
                  })
                this.ajax(ajaxRef, callback)
            },
            //#endregion
            //#endregion
            //#region Collaborator
            GetCollaboratorList(token: string, state: string, updateDate_start: string, updateDate_end: string, searchName: string, ids: Array<number>, callback: any){
                const ajaxRef = new AjaxRef('/Collaborator/GetDataList')
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setParams({
                    State: state,
                    UpdateDateStart: updateDate_start,
                    UpdateDateEnd: updateDate_end,
                    SearchName: searchName,
                    IDs: ids
                })
                this.ajax(ajaxRef, callback)
            },
            InsertCollaborator(token: string, title: string, serviceItem: string, tel: string, url: string, imageFile: string,
                imageName: string, imageExtension: string, state: boolean, callback: any){
                const ajaxRef = new AjaxRef('/Collaborator/InsertCollaborator', "post")
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setData({
                    title: title,
                    serviceItem: serviceItem,
                    tel: tel,
                    url: url,
                    imageFile: imageFile,
                    imageName: imageName,
                    imageExtension: imageExtension,
                    isEnabled: state
                  })
                this.ajax(ajaxRef, callback)
            },
            UpdateCollaborator(token: string, id: number, title: string, serviceItem: string, tel: string, url: string, imageFile: string,
                imageName: string, imageExtension: string, state: boolean, callback: any){
                const ajaxRef = new AjaxRef('/Collaborator/UpdateCollaborator', "post")
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setData({
                    id: id,
                    title: title,
                    serviceItem: serviceItem,
                    tel: tel,
                    url: url,
                    imageFile: imageFile,
                    imageName: imageName,
                    imageExtension: imageExtension,
                    isEnabled: state
                  })
                this.ajax(ajaxRef, callback)
            },
            DeleteCollaborator(token: string, id: number, callback: any){
                const ajaxRef = new AjaxRef('/Collaborator/DeleteCollaborator', "post")
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setData({
                    id: id
                  })
                this.ajax(ajaxRef, callback)
            },
            //#endregion
            //#region Code
            //#region Code_Domicile
            GetCodeDomicile(token: string, createDate_start: string, createDate_end: string, updateDate_start: string, updateDate_end: string, searchName: string, isContainAll: boolean, ids: Array<number>, callback: any){
                const ajaxRef = new AjaxRef('/CodeDomicile/GetDataList')
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setParams({
                    CreateDateStart: createDate_start,
                    CreateDateEnd: createDate_end,
                    UpdateDateStart: updateDate_start,
                    UpdateDateEnd: updateDate_end,
                    SearchName: searchName,
                    IsContainAll: isContainAll,
                    IDs: ids
                })
                this.ajax(ajaxRef, callback)
            },
            InsertCodeDomicile(token: string, labelName: string, state: boolean, callback: any){
                const ajaxRef = new AjaxRef('/CodeDomicile/InsertCodeDomicile', "post")
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setData({
                    "labelName": labelName,
                    "isEnabled": state
                  })
                this.ajax(ajaxRef, callback)
            },
            UpdateCodeDomicile(token: string, id: number, labelName: string, state: boolean, callback: any){
                const ajaxRef = new AjaxRef('/CodeDomicile/UpdateCodeDomicile', "post")
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setData({
                    "id": id,
                    "labelName": labelName,
                    "isEnabled": state
                  })
                this.ajax(ajaxRef, callback)
            },
            //#endregion
            //#region Code_Identity
            GetCodeIdentity(token: string, createDate_start: string, createDate_end: string, updateDate_start: string, updateDate_end: string, searchName: string, isContainAll: boolean, ids: Array<number>, callback: any){
                const ajaxRef = new AjaxRef('/CodeIdentity/GetDataList')
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setParams({
                    CreateDateStart: createDate_start,
                    CreateDateEnd: createDate_end,
                    UpdateDateStart: updateDate_start,
                    UpdateDateEnd: updateDate_end,
                    SearchName: searchName,
                    IsContainAll: isContainAll,
                    IDs: ids
                })
                this.ajax(ajaxRef, callback)
            },
            InsertCodeIdentity(token: string, labelName: string, state: boolean, callback: any){
                const ajaxRef = new AjaxRef('/CodeIdentity/InsertCodeIdentity', "post")
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setData({
                    "labelName": labelName,
                    "isEnabled": state
                  })
                this.ajax(ajaxRef, callback)
            },
            UpdateCodeIdentity(token: string, id: number, labelName: string, state: boolean, callback: any){
                const ajaxRef = new AjaxRef('/CodeIdentity/UpdateCodeIdentity', "post")
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setData({
                    "id": id,
                    "labelName": labelName,
                    "isEnabled": state
                  })
                this.ajax(ajaxRef, callback)
            },
            //#endregion
            //#region Code_Income
            GetCodeIncome(token: string, createDate_start: string, createDate_end: string, updateDate_start: string, updateDate_end: string, searchName: string, isContainAll: boolean, ids: Array<number>, callback: any){
                const ajaxRef = new AjaxRef('/CodeIncome/GetDataList')
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setParams({
                    CreateDateStart: createDate_start,
                    CreateDateEnd: createDate_end,
                    UpdateDateStart: updateDate_start,
                    UpdateDateEnd: updateDate_end,
                    SearchName: searchName,
                    IsContainAll: isContainAll,
                    IDs: ids
                })
                this.ajax(ajaxRef, callback)
            },
            InsertCodeIncome(token: string, labelName: string, state: boolean, callback: any){
                const ajaxRef = new AjaxRef('/CodeIncome/InsertCodeIncome', "post")
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setData({
                    "labelName": labelName,
                    "isEnabled": state
                  })
                this.ajax(ajaxRef, callback)
            },
            UpdateCodeIncome(token: string, id: number, labelName: string, state: boolean, callback: any){
                const ajaxRef = new AjaxRef('/CodeIncome/UpdateCodeIncome', "post")
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setData({
                    "id": id,
                    "labelName": labelName,
                    "isEnabled": state
                  })
                this.ajax(ajaxRef, callback)
            },
            //#endregion
            //#region Code_Keyword
            GetCodeKeyword(token: string, createDate_start: string, createDate_end: string, updateDate_start: string, updateDate_end: string, searchName: string, ids: Array<number>, callback: any){
                const ajaxRef = new AjaxRef('/CodeKeyword/GetDataList')
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setParams({
                    CreateDateStart: createDate_start,
                    CreateDateEnd: createDate_end,
                    UpdateDateStart: updateDate_start,
                    UpdateDateEnd: updateDate_end,
                    SearchName: searchName,
                    IDs: ids
                })
                this.ajax(ajaxRef, callback)
            },
            InsertCodeKeyword(token: string, labelName: string, state: boolean, callback: any){
                const ajaxRef = new AjaxRef('/CodeKeyword/InsertCodeKeyword', "post")
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setData({
                    "labelName": labelName,
                    "isEnabled": state
                  })
                this.ajax(ajaxRef, callback)
            },
            UpdateCodeKeyword(token: string, id: number, labelName: string, state: boolean, callback: any){
                const ajaxRef = new AjaxRef('/CodeKeyword/UpdateCodeKeyword', "post")
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setData({
                    "id": id,
                    "labelName": labelName,
                    "isEnabled": state
                  })
                this.ajax(ajaxRef, callback)
            },
            //#endregion
            //#region Code_Policy
            GetCodePolicy(token: string, createDate_start: string, createDate_end: string, updateDate_start: string, updateDate_end: string, searchName: string, ids: Array<number>, IsContainDisabled: boolean, callback: any){
                const ajaxRef = new AjaxRef('/CodePolicy/GetDataList')
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setParams({
                    CreateDateStart: createDate_start,
                    CreateDateEnd: createDate_end,
                    UpdateDateStart: updateDate_start,
                    UpdateDateEnd: updateDate_end,
                    SearchName: searchName,
                    IDs: ids,
                    IsContainDisabled: IsContainDisabled
                })
                this.ajax(ajaxRef, callback)
            },
            InsertCodePolicy(token: string, labelName: string, state: boolean, callback: any){
                const ajaxRef = new AjaxRef('/CodePolicy/InsertCodePolicy', "post")
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setData({
                    "labelName": labelName,
                    "isEnabled": state
                  })
                this.ajax(ajaxRef, callback)
            },
            UpdateCodePolicy(token: string, id: number, labelName: string, state: boolean, callback: any){
                const ajaxRef = new AjaxRef('/CodePolicy/UpdateCodePolicy', "post")
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setData({
                    "id": id,
                    "labelName": labelName,
                    "isEnabled": state
                  })
                this.ajax(ajaxRef, callback)
            },
            //#endregion
            //#region Code_Recipient
            GetCodeRecipient(token: string, createDate_start: string, createDate_end: string, updateDate_start: string, updateDate_end: string, searchName: string, isContainAll: boolean, ids: Array<number>, callback: any){
                const ajaxRef = new AjaxRef('/CodeRecipient/GetDataList')
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setParams({
                    CreateDateStart: createDate_start,
                    CreateDateEnd: createDate_end,
                    UpdateDateStart: updateDate_start,
                    UpdateDateEnd: updateDate_end,
                    SearchName: searchName,
                    IsContainAll: isContainAll,
                    IDs: ids
                })
                this.ajax(ajaxRef, callback)
            },
            InsertCodeRecipient(token: string, labelName: string, state: boolean, callback: any){
                const ajaxRef = new AjaxRef('/CodeRecipient/InsertCodeRecipient', "post")
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setData({
                    "labelName": labelName,
                    "isEnabled": state
                  })
                this.ajax(ajaxRef, callback)
            },
            UpdateCodeRecipient(token: string, id: number, labelName: string, state: boolean, callback: any){
                const ajaxRef = new AjaxRef('/CodeRecipient/UpdateCodeRecipient', "post")
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setData({
                    "id": id,
                    "labelName": labelName,
                    "isEnabled": state
                  })
                this.ajax(ajaxRef, callback)
            },
            //#endregion
            //#endregion
            //#region Account
            GetAccountList(token: string, permission: string, state: string, account: string, ids: Array<number>, callback: any){
                const ajaxRef = new AjaxRef('/Account/GetAccountList')
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setParams({
                    Permission: permission,
                    State: state,
                    Account: account,
                    IDs: ids
                })
                this.ajax(ajaxRef, callback)
            },
            InsertAccount(token: string, userName: string, account: string, email: string, permission: string, state: boolean, pwd: string, pwdConfirm: string, callback: any){
                const ajaxRef = new AjaxRef('/Account/InsertAccount', "post")
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setData({
                    userName: userName,
                    account: account,
                    email: email,
                    permission: permission,
                    isEnabled: state,
                    pwd: pwd,
                    pwdConfirm: pwdConfirm
                  })
                this.ajax(ajaxRef, callback)
            },
            UpdateAccount(token: string, id: number, userName: string, account: string, email: string, permission: string, state: boolean, callback: any){
                const ajaxRef = new AjaxRef('/Account/UpdateAccount', "post")
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setData({
                    id: id,
                    userName: userName,
                    account: account,
                    email: email,
                    permission: permission,
                    isEnabled: state,
                  })
                this.ajax(ajaxRef, callback)
            },
            //#endregion
            //#region Analysis
            GetVisitorSummary(token: string, callback: any){
                const ajaxRef = new AjaxRef('/Visitor/GetVisitorSummary')
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setData({})
                this.ajax(ajaxRef, callback)
            },
            GetVisitorChartData(token: string, selectYear: number, startDate: string, endDate: string, callback: any){
                const ajaxRef = new AjaxRef('/Visitor/GetVisitorChartData')
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setParams({
                    selectYear: selectYear,
                    startDate: startDate,
                    endDate: endDate
                })
                this.ajax(ajaxRef, callback)
            },
            //#endregion
            //#region Personal
            GetPersonalInfo(token: string, callback: any){
                const ajaxRef = new AjaxRef('/Personal/GetPersonalInfo')
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setParams({})
                this.ajax(ajaxRef, callback)
            },
            UpdatePersonalInfo(token: string, userID: number, userName: string, email: string, callback: any){
                const ajaxRef = new AjaxRef('/Personal/UpdatePersonalInfo', "post")
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setData({
                    userID: userID,
                    userName: userName,
                    email: email
                  })
                this.ajax(ajaxRef, callback)
            },
            UpdatePersonalPwd(token: string, userID: number, pwdOld: string, pwdNew: string, callback: any){
                const ajaxRef = new AjaxRef('/Personal/UpdatePersonalPwd', "post")
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setData({
                    userID: userID,
                    password_Old: pwdOld,
                    Password_New: pwdNew
                  })
                this.ajax(ajaxRef, callback)
            },
            //#endregion
            //#region ImgManager
            GetImgManagerList(token: string, updateDate_start: string, updateDate_end: string, type: string, searchName: string, callback: any){
                const ajaxRef = new AjaxRef('/ImgManager/GetImgManagerList')
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setParams({
                    UpdateDateStart: updateDate_start,
                    UpdateDateEnd: updateDate_end,
                    Type: type,
                    SearchName: searchName
                })
                this.ajax(ajaxRef, callback)
            },
            InsertImg(token: string, title: string, imgPath: string, imgExtension: string, type: string, size: number, callback: any){
                const ajaxRef = new AjaxRef('/ImgManager/InsertImg', "post")
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setData({
                    title: title,
                    imgPath: imgPath,
                    imgExtension: imgExtension,
                    type: type,
                    size: size
                  })
                this.ajax(ajaxRef, callback)
            },
            EditImg(token: string, id: number, title: string, imgPath: string, imgExtension: string, type: string, size: number, callback: any){
                const ajaxRef = new AjaxRef('/ImgManager/EditImg', "post")
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setData({
                    title: title,
                    imgPath: imgPath,
                    imgExtension: imgExtension,
                    type: type,
                    size: size,
                    id: id
                  })
                this.ajax(ajaxRef, callback)
            },
            DeleteImg(token: string, id: number, callback: any){
                const ajaxRef = new AjaxRef('/ImgManager/DeleteImg', "delete")
                ajaxRef.setHeaders({ Authorization: "Bearer " + token})
                ajaxRef.setParams({
                    imgID: id
                  })
                this.ajax(ajaxRef, callback)
            },
            //#endregion
            ajax(ajaxRef: AjaxRef, callback: any) {
                // 統一在這裡把 AjaxRef 轉成真正的 Axios 請求。
                // 各個 API 方法只要負責描述需求，不必重複處理底層傳輸細節。
                //
                // 這裡同時是「前端與後端 API 串接」真正落地的地方：
                // - `baseURL` 決定要打到哪一台 API 主機
                // - `url` 決定要呼叫哪個 Controller / AppService 方法
                // - `headers` 通常帶 Bearer Token
                // - `params` 會被組成 query string
                // - `data` 會成為 request body
                axios({
                    method: ajaxRef.getMethod(),
                    baseURL: ajaxRef.getBaseUrl(),
                    url: ajaxRef.getUrl(),
                    headers: ajaxRef.getHeaders(),
                    params: ajaxRef.getParam(),
                    paramsSerializer: { indexes: null},
                    data: ajaxRef.getData(),
                    responseType: ajaxRef.getAxiosReqConfig().responseType
                })
                .then((res) => {
                    // 成功時原樣把 Axios 回應物件交回呼叫端
                    console.log(res)
                    callback(res)
                })
                .catch((error) => {
                    console.error(error)
                    
                    if (error.response){
                        // 若 Token 已失效或無權限，統一強制登出並導回登入頁
                        // 這代表後端 JWT 驗證或授權規則沒有通過。
                        if (error.response.status == 401){
                            useUserStore().logout()
                            _global.$router.push({ name: 'Login'})
                            return false;
                        }
                    }
                    // 其餘錯誤交由各頁面自行決定如何顯示提示或錯誤訊息
                    callback(error)
                })
                
            }
        }
    }
}
