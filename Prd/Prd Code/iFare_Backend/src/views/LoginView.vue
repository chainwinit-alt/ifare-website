<template>
  <!-- 登入頁面：提供帳號密碼輸入表單 -->
  <div class="section-login">
    <!-- 背景 Logo 圖示（低透明度裝飾用） -->
    <logo class="ic-login-bg" />
    <!-- 標題 Logo 文字 -->
    <logoTitle class="ic-login-title" />
    <!-- 登入卡片區塊 -->
    <div class="card-login">
      <h3 class="title-card-login">歡迎回來</h3>
      <h4 class="subtitle-card-login">登入</h4>
      <!-- 登入表單，綁定驗證規則 ruleFormRef -->
      <el-form class="form-login"
              ref="ruleFormRef"
              :rules="rules">
        <el-form-item class="form-item-login">
          <!-- 帳號輸入框，按 Enter 亦可觸發登入 -->
          <el-input
            v-model="ruleForm.account"
            class="input-card-login"
            type="text"
            placeholder="輸入帳號"
            @keyup.enter.native="sendActPwd(ruleFormRef)"
          ></el-input>
          <!-- 密碼輸入框，支援顯示/隱藏切換，按 Enter 亦可觸發登入 -->
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
          <!-- 登入按鈕，點擊後執行 sendActPwd；loading 狀態避免重複送出 -->
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
/**
 * LoginView.vue
 * 後台登入頁面
 * 資料流：
 *  1. 使用者輸入帳號密碼 → sendActPwd()
 *  2. 呼叫 $WebAPI.Auth() 取得 AccessToken
 *  3. 取得 Token 後呼叫 $WebAPI.Login() 取得使用者詳細資訊
 *  4. 將使用者資訊寫入 Pinia userStore
 *  5. 導向首頁 (Home)
 */
import { reactive, ref, getCurrentInstance } from 'vue'
import { type FormInstance, type FormRules, ElMessage } from 'element-plus';
import type { RuleForm } from '@/interface/Login';
import logo from "../components/icons/IconLogo.vue";
import logoTitle from "../components/icons/IconLogoTitle.vue";
import { useUserStore } from '@/stores/user';

// 取得 Vue 全域屬性
const app = getCurrentInstance()
const $commonLib = app?.appContext.config.globalProperties.$CommonLib
const $WebAPI = app?.appContext.config.globalProperties.$WebAPI
const $Message = app?.appContext.config.globalProperties.$message;
const userStore = useUserStore()

const act = ref("")
const pwd = ref("")
// 控制登入按鈕的 loading 狀態，防止重複提交
const isLoading = ref(false)

// Element Plus 表單實例參考
const ruleFormRef = ref<FormInstance>()
// 表單雙向綁定資料
const ruleForm = reactive<RuleForm>({
  account: "",
  password: ""
})

// 表單驗證規則：帳號與密碼皆為必填
const rules = reactive<FormRules<RuleForm>>({
  account: [
    { required: true, message: 'Please input your account.', trigger: 'blur'}
  ],
  password: [
    { required: true, message: 'Please input your password.', trigger: 'blur'}
  ]
})

/**
 * sendActPwd - 執行登入流程
 * @param formEl Element Plus 表單實例，用於驗證
 * 流程：
 *  1. 呼叫 $WebAPI.Auth() 進行身份驗證，取得 accessToken 與 expireInSeconds
 *  2. 驗證成功後呼叫 $WebAPI.Login() 取得帳號詳細資訊（包含 permission、state 等）
 *  3. 將所有資訊存入 userStore，並透過 GuideToPage 導向首頁
 *  4. 錯誤時顯示對應錯誤訊息（包含 500、認證失敗等情況）
 */
const sendActPwd = (formEl: FormInstance | undefined) => {
  if (!formEl) return

  console.log('send')
  console.log(formEl)

  isLoading.value = true
  $WebAPI.Auth(ruleForm.account, ruleForm.password, (res:any) => {
    console.log(res)

    // 處理 HTTP 500 伺服器錯誤（含帳密錯誤情況）
    if (res.response && res.response.status == 500) {
      isLoading.value = false

      let errMsg = `[Error_${res.response.status}]: System__>Error`

      // 若錯誤訊息含 "authentication" 字串，視為帳密錯誤
      if (res.response.data.error.message && res.response.data.error.message.toLowerCase().indexOf('authentication') >= 0) {
        errMsg = `[Error_401]: 帳密有誤`
      }

      ElMessage({
        message: errMsg,
        type: 'error'
      })
      return false
    }

    // 處理網路層或其他 Error 物件
    if (res.name && res.name.toLowerCase().indexOf('error') >= 0) {
      isLoading.value = false
      ElMessage({
        message: `[Error_${res.code}]: ${res.message}`,
        type: 'error'
      })
      return false
    }

    // 取得 AccessToken 及過期秒數
    const token = res.data.result.accessToken
    const expiredTimeSec = res.data.result.expireInSeconds
    console.log(token)
    if (token) {
      // 使用 Token 呼叫 Login API 取得使用者詳細資訊
      $WebAPI.Login(token, ruleForm.account, ruleForm.password, (resLogin:any) => {
        const _resL = resLogin.data.result

        isLoading.value = false
        if (_resL.errCode != 0) {
          $Message({ message: `${_resL.errMsg}`, type: "error" })
          return false
        }
        const _resLData = _resL.result
        // 將使用者資訊（帳號、token、姓名、email、id、權限、狀態、過期時間）存入 Store
        userStore.login(_resLData.account, token, _resLData.userName, _resLData.email, _resLData.id, _resLData.permission, _resLData.state, expiredTimeSec)

        // 登入成功，導向首頁
        $commonLib.GuideToPage('Home')
      })
    }
  })
}

</script>
