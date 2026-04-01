<template>
    <main-header>
      <template #btnsRight>
          <el-button :icon="Close" color="white" size="large" @click="$router.go(-1)">取消</el-button>
          <el-button :icon="Check" type="primary" size="large" @click="SaveAction">儲存</el-button>
      </template>
    </main-header>
    <el-scrollbar class="main-scrollbar">
        <div class="section-main-card card-fullsize card-personal" name="change-pwd-mode">
        <div class="card-info">
            <div class="item-group">
                <label class="personal-title required">目前密碼</label>
                <el-input class="p-input" v-model="personal_current" type="password" size="large" placeholder="請輸入密碼" show-password/>
            </div>
            <div class="item-group">
                <label class="personal-title required">預設密碼</label>
                <el-input class="p-input c-input-format input-pwd-alert" v-model="personal_new" type="password" size="large" placeholder="請輸入新密碼" show-password/>
            </div>
            <div class="item-group">
                <label class="personal-title required">確認密碼</label>
                <el-input class="p-input" v-model="personal_confirm" type="password" size="large" placeholder="請再輸入一次新密碼" show-password/>
            </div>
        </div>
        </div>
    </el-scrollbar>
  </template>
  <script setup lang="ts">
  import { ref, getCurrentInstance } from "vue";
  import { ElButton, ElInput, ElScrollbar } from "element-plus";
  import { Close, Check } from "@element-plus/icons-vue";
  import { useUserStore } from "@/stores/user";
  import { useRouter } from "vue-router";
  import MainHeader from "@/components/MainHeader.vue";
  
  const app = getCurrentInstance()
  const $commonLib = app?.appContext.config.globalProperties.$CommonLib
  const $WebAPI = app?.appContext.config.globalProperties.$WebAPI;
  const $Message = app?.appContext.config.globalProperties.$message;
  const userStore = useUserStore();
  const _router = useRouter();
  
  const personal_current = ref('')
  const personal_new = ref('')
  const personal_confirm = ref('')

  function ResetPwd() {
    personal_current.value = ''
    personal_new.value = ''
    personal_confirm.value = ''
  }
  
  function SaveAction(){
    const _pwdCurrent = personal_current.value
    const _pwdNew = personal_new.value
    const _pwdConfirm = personal_confirm.value

    if (_pwdNew.length < 6 || !/\d/.test(_pwdNew) || !/[a-z]/.test(_pwdNew) || !/[A-Z]/.test(_pwdNew)) {
        $Message({ message: `密碼須超過6字以上，包含英文大小寫、數字`, type: "error" })
        ResetPwd()
        return false;
    }
    if (_pwdNew != _pwdConfirm) {
        $Message({ message: `預設密碼與確認密碼不符`, type: "error" })
        ResetPwd()
        return false;
    }
    if (_pwdCurrent == _pwdNew) {
        $Message({ message: `目前密碼不可與新密碼相同`, type: "error" })
        ResetPwd()
        return false;
    }

    $WebAPI.UpdatePersonalPwd(userStore.token, userStore.userID, _pwdCurrent, _pwdNew,(res: any) => {
        let _resData = res.data || "error";
        if (_resData == "error") {
          $Message({ message: `API res ${_resData}`, type: "error" })
          return console.error(`API res ${_resData}`);
        }

        let _res = _resData.result;
        if (_res.errCode != 0) {
          $Message({ message: _res.errMsg, type: "error" })
          return console.error(_res.errMsg);
        }

        $Message({ message: '變更成功', type: "success" })
        _router.back();
      }
    );
  }

  </script>
  