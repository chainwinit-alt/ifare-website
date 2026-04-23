<template>
  <div class="section-login">
    <logo class="ic-login-bg" />
    <logoTitle class="ic-login-title" />
    <div class="card-login">
      <h3 class="title-card-login">歡迎回來</h3>
      <h4 class="subtitle-card-login">登入</h4>
      <el-form class="form-login" 
              ref="ruleFormRef"
              :rules="rules">
        <el-form-item class="form-item-login">
          <el-input
            v-model="ruleForm.account"
            class="input-card-login"
            type="text"
            placeholder="輸入帳號"
            @keyup.enter.native="sendActPwd(ruleFormRef)"
          ></el-input>
          <el-input
            v-model="ruleForm.password"
            class="input-card-login"
            type="password"
            placeholder="輸入密碼"
            show-password
            @keyup.enter.native="sendActPwd(ruleFormRef)"
          ></el-input>
        </el-form-item>
        <el-form-item>
          <el-button class="btn-card-login" type="primary" @click="sendActPwd(ruleFormRef)" :loading="isLoading">登入</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$padding-section-login: 40px;
.section-login {
  position: relative;
  display: flex;
  width: 100%;
  min-width: 640px;
  height: calc(100vh - $padding-section-login * 2);
  padding: $padding-section-login 0;
  flex-direction: column;
  align-items: center;
  @include linearBgColor;
}
.ic-login-bg {
  position: absolute;
  top: calc($padding-section-login / 2);
  left: -200px;
  width: auto;
  height: calc(100% - $padding-section-login);
  opacity: 0.04;
  z-index: 99;
}
.card-login,
.ic-login-title {
  z-index: 100;
}
.ic-login-title{
  min-width: 292px;
  min-height: 44px;
}
.card-login {
  display: inline-flex;
  flex-direction: column;
  width: 454px;
  align-items: center;
  background-color: white;
  box-shadow: 0px 12px 32px 4px rgba(0, 0, 0, 0.04),
    0px 8px 20px rgba(0, 0, 0, 0.08);
  border-radius: 4px;
  margin-top: 40px;

  .title-card-login {
    margin-top: 48px;
    font-style: normal;
    font-size: 24px;
    line-height: 28px;
  }
  .subtitle-card-login {
    font-style: normal;
    font-weight: 400;
    font-size: 16px;
    line-height: 24px;
    margin: 0;
  }

  .form-login{
    width: 320px;
    margin-top: 28px;
    margin-bottom: 42px;
  }

  .input-card-login {
    & ~ .input-card-login {
      margin-top: 16px;
    }
  }

  .btn-card-login {
    margin-top: 36px;
  }

  button {
    width: 100%;
  }
}
</style>

<script setup lang="ts">
import { reactive, ref, getCurrentInstance } from 'vue'
import { type FormInstance, type FormRules, ElMessage } from 'element-plus';
import type { RuleForm } from '@/interface/Login';
import logo from "../components/icons/IconLogo.vue";
import logoTitle from "../components/icons/IconLogoTitle.vue";
import { useUserStore } from '@/stores/user';

const app = getCurrentInstance()
const $commonLib = app?.appContext.config.globalProperties.$CommonLib
const $WebAPI = app?.appContext.config.globalProperties.$WebAPI
const $Message = app?.appContext.config.globalProperties.$message;
const userStore = useUserStore()

const act = ref("")
const pwd = ref("")
const isLoading = ref(false)

const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive<RuleForm>({
  account: "",
  password: ""
})

const rules = reactive<FormRules<RuleForm>>({
  account: [
    { required: true, message: 'Please input your account.', trigger: 'blur'}
  ],
  password: [
    { required: true, message: 'Please input your password.', trigger: 'blur'}
  ]
})

const sendActPwd = (formEl: FormInstance | undefined) => {
  if (!formEl) return

  console.log('send')
  console.log(formEl)

  isLoading.value = true
  $WebAPI.Auth(ruleForm.account, ruleForm.password, (res:any) => {
    console.log(res)
    
    if (res.response && res.response.status == 500) {
      isLoading.value = false

      let errMsg = `[Error_${res.response.status}]: System__>Error`

      if (res.response.data.error.message && res.response.data.error.message.toLowerCase().indexOf('authentication') >= 0) {
        errMsg = `[Error_401]: 帳密有誤`
      }

      ElMessage({
        message: errMsg,
        type: 'error'
      })
      return false
    }

    if (res.name && res.name.toLowerCase().indexOf('error') >= 0) {
      isLoading.value = false
      ElMessage({
        message: `[Error_${res.code}]: ${res.message}`,
        type: 'error'
      })
      return false
    }

    const token = res.data.result.accessToken
    const expiredTimeSec = res.data.result.expireInSeconds
    console.log(token)
    if (token) {
      $WebAPI.Login(token, ruleForm.account, ruleForm.password, (resLogin:any) => {
        const _resL = resLogin.data.result

        isLoading.value = false
        if (_resL.errCode != 0) {
          $Message({ message: `${_resL.errMsg}`, type: "error" })
          return false
        }
        const _resLData = _resL.result
        userStore.login(_resLData.account, token, _resLData.userName, _resLData.email, _resLData.id, _resLData.permission, _resLData.state, expiredTimeSec)

        $commonLib.GuideToPage('Home')
      })
    }
  })
}

</script>