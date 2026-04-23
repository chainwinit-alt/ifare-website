/**
 * user.ts
 * 後台管理端的登入使用者狀態中心。
 *
 * 這個 store 主要負責保存登入後的使用者資訊與 Token，
 * 並透過 pinia-plugin-persistedstate 將資料持久化到瀏覽器端，
 * 讓重新整理頁面後仍可保留登入狀態。
 */
import { defineStore } from "pinia";

interface UserState {
    // 後端帳號代碼（登入帳號）
    act: string,
    // 顯示用使用者名稱
    userName: string,
    // 使用者電子郵件
    email: string,
    // 使用者流水號 ID
    userID: number | null,
    // JWT / Bearer Token
    token: string,
    // 權限代碼，例如 Editor、Admin 等
    permission: string,
    // 帳號啟用或停用狀態
    state: string,
    // Token 預估到期時間，方便前端自行判斷是否過期
    tokenExpiredTime: Date | null
}

export const useUserStore = defineStore('user', {
    /**
     * 初始化使用者狀態。
     * 未登入時全部欄位維持空值或 null。
     */
    state: (): UserState => {
        return {
            act: "",
            userName: "",
            email: "",
            userID: null,
            token: "",
            permission: "",
            state: "",
            tokenExpiredTime: null
        }
    },
    // 啟用持久化，讓重新整理頁面後仍能保留登入資訊
    persist: true,
    getters: {
        /**
         * 判斷目前是否可視為已登入。
         * 只要 token 有值就視為登入狀態。
         */
        isLogin: state => state.token != "" && state.token != null
    },
    actions: {
        /**
         * 寫入登入成功後的使用者資料。
         * 若有帶入過期秒數，會同步換算出前端可使用的到期時間。
         */
        login (_act:string, _token: string, _userName: string, _email: string, _userID: number, _permission: string, _state: string, _expiredTimeSec?: number) {
            if (!_act || !_token) return false

            console.log(_userName)

            let expiredTime: Date | null = null
            if (_expiredTimeSec) {
                // 以目前時間為基準推算 token 到期時刻
                expiredTime = new Date()
                expiredTime.setSeconds(expiredTime.getSeconds() + _expiredTimeSec)
            }
            

            this.$patch({
                act: _act,
                token: _token,
                userName: _userName,
                email: _email,
                userID: _userID,
                permission: _permission,
                state: _state,
                tokenExpiredTime: expiredTime
            })

            return true
        },
        /**
         * 清空登入相關資訊。
         * 常用於主動登出，或 API 回傳 401 後被強制登出。
         */
        logout () {
            this.$patch({
                act: "",
                userName: "",
                email: "",
                userID: null,
                token: "",
                permission: "",
                state: ""
            })

            return false
        }
    }
})
