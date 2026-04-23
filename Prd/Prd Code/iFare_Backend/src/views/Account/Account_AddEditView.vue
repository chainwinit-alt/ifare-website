<template>
  <main-header>
    <template #subtitle v-if="$route.name != 'Account_Add'">
      <sub class="sub-title sub-createDate">{{ createdate }}</sub>
      <sub class="sub-title sub-number">{{ $route.query.id }}</sub>
    </template>
    <template #btnsRight>
      <el-button
        :icon="Close"
        size="large"
        @click="$router.go(-1)"
        >取消</el-button>
      <el-button
        :icon="Check"
        size="large"
        type="primary"
        @click="SaveAction"
        >儲存</el-button>
    </template>
  </main-header>
  <el-scrollbar class="main-scrollbar">
    <div class="section-main-card card-fullsize card-account card-input-format" name="add-mode">
      <div class="card-info">
          <div class="item-group">
              <label class="input-title required">姓名</label>
              <el-input class="c-input-format" v-model="input_name" type="text" size="large" placeholder="請輸入姓名" />
          </div>
          <div class="item-group">
              <label class="input-title required">帳號</label>
              <el-input class="c-input-format" v-model="input_account" type="text" size="large" placeholder="請輸入帳號" v-if="$route.name != 'Account_Edit'" />
              <span class="input-value" v-else>{{ input_account }}</span>
          </div>
          <div class="item-group">
              <label class="input-title required">E-mail</label>
              <el-input class="c-input-format" v-model="input_email" type="email" size="large" placeholder="請輸入E-mail" />
          </div>
          <div class="item-group">
            <label class="input-title required">權限</label>
            <el-radio-group v-model="userState" v-if="$route.name != 'Account_Edit'">
                <el-radio v-for="(radio) in permissionList" :label="radio.value">{{ radio.title }}</el-radio>
            </el-radio-group>
            <span class="input-value" v-else>{{ userState }}</span>
          </div>
      </div>
    </div>
    <div class="section-main-card card-fullsize card-account card-input-format" name="add-mode">
        <div class="card-info">
            <div class="item-group">
                <label class="input-title required" >資料狀態</label>
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
    <template v-if="$route.name == 'Account_Add'">
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
import { ref, reactive, watch, getCurrentInstance } from "vue";
import { ElButton, ElRadioGroup, ElRadio, ElSwitch, ElInput, ElScrollbar } from "element-plus";
import { Check, Close } from "@element-plus/icons-vue";
import MainHeader from "@/components/MainHeader.vue";
import type { RadioObj } from "@/interface/Component";
import { useUserStore } from "@/stores/user";
import { useRouter } from "vue-router";

const app = getCurrentInstance();
const $commonLib = app?.appContext.config.globalProperties.$CommonLib;
const $WebAPI = app?.appContext.config.globalProperties.$WebAPI;
const _$route = app?.appContext.config.globalProperties.$route;
const _router = useRouter();
const userStore = useUserStore();
const $Message = app?.appContext.config.globalProperties.$message;

const routeNameType = _$route?.name?.toString().toLocaleLowerCase() || "";
const ids = _$route?.query.id ? [parseInt(_$route?.query.id.toString())] : null
const createdate = ref("")

const input_name = ref('')
const input_account = ref('')
const input_email = ref('')

const input_password = ref('')
const input_passwordConfirm = ref('')

const permissionList = reactive<Array<RadioObj>>([
        { title: '檢視者', value: '檢視者'},
        { title: '編輯者', value: '編輯者'},
        { title: '管理者', value: '管理者'}
    ])

const userState = ref("");

const switch_state = ref(true);
const swtich_state_val = ref('')

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

function SaveAction() {
  const _userName = input_name.value
  const _account = input_account.value
  const _email = input_email.value
  const _permission = userState.value
  const _pwd = input_password.value
  const _pwdConfirm = input_passwordConfirm.value
  const _isEnabled = switch_state.value

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
  if (_pwd.length < 6 || !/\d/.test(_pwd) || !/[a-z]/.test(_pwd) || !/[A-Z]/.test(_pwd)) {
      return $Message({ message: `密碼須超過6字以上，包含英文大小寫、數字`, type: "warning" })
  }
  if (_pwd != _pwdConfirm) {
    return $Message({ message: `【預設密碼】與【確認密碼】不符`, type: "warning" })
  }

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
        $commonLib.GuideToPage('Account_DataList')
      }
    );
  }

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
        // $commonLib.GuideToPage('Account_DataList')
        _router.back()
      }
    );
  }
}
</script>
