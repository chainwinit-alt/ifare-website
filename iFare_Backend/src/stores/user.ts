import { defineStore } from "pinia";

interface UserState {
    act: string,
    userName: string,
    email: string,
    userID: number | null,
    token: string,
    permission: string,
    state: string,
    tokenExpiredTime: Date | null
}

export const useUserStore = defineStore('user', {
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
    persist: true,
    getters: {
        isLogin: state => state.token != "" && state.token != null
    },
    actions: {
        login (_act:string, _token: string, _userName: string, _email: string, _userID: number, _permission: string, _state: string, _expiredTimeSec?: number) {
            if (!_act || !_token) return false

            console.log(_userName)

            let expiredTime: Date | null = null
            if (_expiredTimeSec) {
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