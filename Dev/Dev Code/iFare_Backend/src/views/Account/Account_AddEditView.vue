<template>
  <!-- 帳號新增／編輯頁面 Header：顯示建立日期與帳號 ID（編輯模式才顯示） -->
  <main-header>
    <template #subtitle v-if="$route.name != 'Account_Add'">
      <!-- 帳號建立日期 -->
      <sub class="sub-title sub-createDate">{{ createdate }}</sub>
      <!-- 帳號 ID（來自 URL query） -->
      <sub class="sub-title sub-number">{{ $route.query.id }}</sub>
    </template>
    <template #btnsRight>
      <!-- 取消按鈕：返回上一頁 -->
      <el-button
        :icon="Close"
        size="large"
        @click="$router.go(-1)"
        >取消</el-button>
      <!-- 儲存按鈕：呼叫 SaveAction 執行新增或更新 -->
      <el-button
        :icon="Check"
        size="large"
        type="primary"
        @click="SaveAction"
        >儲存</el-button>
    </template>
  </main-header>
  <el-scrollbar class="main-scrollbar">
    <!-- 基本資料卡片 -->
    <div class="section-main-card card-fullsize card-account card-input-format" name="add-mode">
      <div class="card-info">
          <!-- 姓名輸入 -->
          <div class="item-group">
              <label class="input-title required">姓名</label>
              <el-input class="c-input-format" v-model="input_name" type="text" size="large" placeholder="請輸入姓名" />
          </div>
          <!-- 帳號：新增模式顯示輸入框；編輯模式僅顯示文字（帳號不可修改） -->
          <div class="item-group">
              <label class="input-title required">帳號</label>
              <el-input class="c-input-format" v-model="input_account" type="text" size="large" placeholder="請輸入帳號" v-if="$route.name != 'Account_Edit'" />
              <span class="input-value" v-else>{{ input_account }}</span>
          </div>
          <!-- E-mail 輸入 -->
          <div class="item-group">
              <label class="input-title required">E-mail</label>
              <el-input class="c-input-format" v-model="input_email" type="email" size="large" placeholder="請輸入E-mail" />
          </div>
          <!-- 權限：新增模式顯示 Radio 選項；編輯模式僅顯示文字 -->
          <div class="item-group">
            <label class="input-title required">權限</label>
            <el-radio-group v-model="userState" v-if="$route.name != 'Account_Edit'">
                <el-radio v-for="(radio) in permissionList" :label="radio.value">{{ radio.title }}</el-radio>
            </el-radio-group>
            <span class="input-value" v-else>{{ userState }}</span>
          </div>
      </div>
    </div>
    <!-- 資料狀態卡片 -->
    <div class="section-main-card card-fullsize card-account card-input-format" name="add-mode">
        <div class="card-info">
            <div class="item-group">
                <label class="input-title required" >資料狀態</label>
                <!-- 新增模式：Switch 開關（啟用/停用）；編輯模式：僅顯示狀態文字 -->
                <el-switch
                    v-model="switch_state"
                    size="large"
                    active-text="啟用"
                    inactive-text="停用"
                    v-if="$route.name != 'Account_Edit'"
                    />
                <span class="input-value" v-else>{{ swtich_state_val }}</span>
            </div>
        </div>
    </div>
    <!-- 密碼區塊：新增模式顯示密碼設定欄位；非編輯模式顯示現有密碼 -->
    <template v-if="$route.name == 'Account_Add'">
        <!-- 新增帳號時需設定預設密碼及確認密碼 -->
        <div class="section-main-card card-fullsize card-account card-input-format" name="add-mode">
            <div class="card-info">
                <div class="item-group">
                    <label class="input-title required">預設密碼</label>
                    <el-input class="c-input-format input-pwd-alert" v-model="input_password" type="password" size="large" placeholder="請輸入預設密碼" show-password />
                </div>
                <div class="item-group">
                    <label class="input-title required">確認密碼</label>
                    <el-input class="c-input-format" v-model="input_passwordConfirm" type="password" size="large" placeholder="再次確認密碼" show-password />
                </div>
            </div>
        </div>
    </template>
    <template v-else>
        <!-- 檢視模式：顯示現有密碼（非編輯路由才顯示） -->
        <div class="section-main-card card-fullsize card-account card-input-format" name="edit-mode" v-if="$route.name != 'Account_Edit'">
            <div class="card-info">
                <div class="item-group">
                    <label class="input-title">密碼</label>
                    <span class="input-value">{{ input_password }}</span>
                </div>
            </div>
        </div>
    </template>
  </el-scrollbar>
</template>
<script setup lang="ts">
/**
 * Account_AddEditView.vue
 * 帳號新增／編輯頁面
 * - 路由名稱為 'Account_Add' 時為新增模式
 * - 路由名稱含 'Edit' 時為編輯模式，會先載入既有資料
 * 資料流：
 *  編輯模式：頁面載入 → 呼叫 GetAccountList API 取得帳號資料 → 填入表單
 *  儲存時：
 *    新增模式 → 呼叫 InsertAccount API → 成功後導向列表頁
 *    編輯模式 → 呼叫 UpdateAccount API → 成功後返回上一頁
 */
import { ref, reactive, watch, getCurrentInstance } from "vue";
import { ElButton, ElRadioGroup, ElRadio, ElSwitch, ElInput, ElScrollbar } from "element-plus";
import { Check, Close } from "@element-plus/icons-vue";
import MainHeader from "@/components/MainHeader.vue";
import type { RadioObj } from "@/interface/Component";
import { useUserStore } from "@/stores/user";
import { useRouter } from "vue-router";

// 取得 Vue 全域屬性
const app = getCurrentInstance();
const $commonLib = app?.appContext.config.globalProperties.$CommonLib;
const $WebAPI = app?.appContext.config.globalProperties.$WebAPI;
const _$route = app?.appContext.config.globalProperties.$route;
const _router = useRouter();
const userStore = useUserStore();
const $Message = app?.appContext.config.globalProperties.$message;

// 判斷目前路由模式（add 或 edit），轉小寫方便比對
const routeNameType = _$route?.name?.toString().toLocaleLowerCase() || "";
// 從 URL query 取得帳號 ID（編輯模式使用），轉為數字陣列
const ids = _$route?.query.id ? [parseInt(_$route?.query.id.toString())] : null
const createdate = ref("")

// 表單輸入值
const input_name = ref('')
const input_account = ref('')
const input_email = ref('')
const input_password = ref('')
const input_passwordConfirm = ref('')

// 權限選項清單（檢視者、編輯者、管理者）
const permissionList = reactive<Array<RadioObj>>([
        { title: '檢視者', value: '檢視者'},
        { title: '編輯者', value: '編輯者'},
        { title: '管理者', value: '管理者'}
    ])

// 目前選取的權限值
const userState = ref("");

// 資料狀態開關（true = 啟用）
const switch_state = ref(true);
// 顯示用的狀態文字（停用/啟用）
const swtich_state_val = ref('')

// 編輯模式：載入既有帳號資料並填入表單
if (routeNameType.indexOf("edit") >= 0) {
  $WebAPI.GetAccountList(userStore.token, null, null, null, ids, (res:any) => {
    let _resData = res.data || "error";
    if (_resData == "error") return console.error(`API res ${_resData}`);

    let _res = _resData.result;
    if (_res.errCode != 0) return console.error(_res.errMsg);
    if (_res.result.length <= 0) return console.error("No Datas.")
    createdate.value = _res.result[0].createDate
    input_name.value = _res.result[0].userName
    input_account.value = _res.result[0].account
    input_email.value = _res.result[0].email
    input_password.value = _res.result[0].pwd
    switch_state.value = _res.result[0].state != "停用"
    swtich_state_val.value = _res.result[0].state
    userState.value = _res.result[0].permission
  })
}

/**
 * SaveAction - 儲存帳號資料
 * 1. 驗證各欄位是否填寫（姓名、帳號、E-mail、權限、密碼）
 * 2. 密碼格式驗證：超過6字、含大小寫英文與數字
 * 3. 確認密碼與密碼一致性驗證
 * 4. 依路由模式呼叫對應 API（InsertAccount / UpdateAccount）
 */
function SaveAction() {
  const _userName = input_name.value
  const _account = input_account.value
  const _email = input_email.value
  const _permission = userState.value
  const _pwd = input_password.value
  const _pwdConfirm = input_passwordConfirm.value
  const _isEnabled = switch_state.value

  // 必填欄位驗證
  if (!_userName) {
    return $Message({ message: `【姓名】不可為空`, type: "warning" })
  }
  if (!_account) {
    return $Message({ message: `【帳號】不可為空`, type: "warning" })
  }
  if (!_email) {
    return $Message({ message: `【E-mail】不可為空`, type: "warning" })
  }
  if (!_permission) {
    return $Message({ message: `【權限】不可為空`, type: "warning" })
  }
  if (!_pwd) {
    return $Message({ message: `【預設密碼】不可為空`, type: "warning" })
  }
  // 密碼強度驗證：長度 > 6、含數字、含小寫英文、含大寫英文
  if (_pwd.length < 6 || !/\d/.test(_pwd) || !/[a-z]/.test(_pwd) || !/[A-Z]/.test(_pwd)) {
      return $Message({ message: `密碼須超過6字以上，包含英文大小寫、數字`, type: "warning" })
  }
  // 確認密碼一致性
  if (_pwd != _pwdConfirm) {
    return $Message({ message: `【預設密碼】與【確認密碼】不符`, type: "warning" })
  }

  // 新增模式：呼叫 InsertAccount API
  if (routeNameType.indexOf("add") >= 0) {
    console.log("[Add] Save action");
    $WebAPI.InsertAccount(userStore.token, _userName, _account, _email, _permission, _isEnabled, _pwd, _pwdConfirm,(res: any) => {
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

        $Message({ message: '新增成功', type: "success" })
        // 新增成功後導向帳號列表頁
        $commonLib.GuideToPage('Account_DataList')
      }
    );
  }

  // 編輯模式：呼叫 UpdateAccount API（帳號不可修改，故不傳 account）
  if (routeNameType.indexOf("edit") >= 0) {
    console.log("[Edit] Save action");
    const _id = ids? ids[0] : 0
    if (_id == 0) return false
    $WebAPI.UpdateAccount(userStore.token, _id, _userName, _account, _email, _permission, _isEnabled,(res: any) => {
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

        $Message({ message: '編輯成功', type: "success" })
        // 編輯成功後返回上一頁
        _router.back()
      }
    );
  }
}
</script>
