<template>
  <main-header>
    <template #btnsLeft>
        <el-button
        :icon="ArrowLeft"
        size="large"
        @click="$router.go(-1)"
        >上一頁</el-button>
    </template>
    <template #subtitle v-if="$route.name != 'Account_Add'">
      <sub class="sub-title sub-createDate">{{ createdate }}</sub>
      <sub class="sub-title sub-number">{{ $route.query.id }}</sub>
    </template>
    <template #btnsRight>
      <el-button
        :icon="EditPen"
        size="large"
        type="primary"
        @click="handleClick"
        v-show="userStore.permission!='檢視者' && isAccessEdit"
        >編輯</el-button
      >
    </template>
  </main-header>
  <el-scrollbar class="main-scrollbar">
    <div class="section-main-card card-fullsize card-account card-input-format">
      <div class="card-info">
          <div class="item-group">
              <label class="input-title">姓名</label>
              <span class="input-value">{{ username }}</span>
          </div>
          <div class="item-group">
              <label class="input-title">帳號</label>
              <span class="input-value">{{ account }}</span>
          </div>
          <div class="item-group">
              <label class="input-title">E-mail</label>
              <span class="input-value">{{ email }}</span>
          </div>
          <div class="item-group">
            <label class="input-title">權限</label>
            <span class="input-value">{{ permission }}</span>
          </div>
      </div>
    </div>
    <div class="section-main-card card-fullsize card-account card-input-format">
        <div class="card-info">
            <div class="item-group">
                <label class="input-title" >資料狀態</label>
                <span class="input-value">{{ datastate }}</span>
            </div>
        </div>
    </div>
    <div class="section-main-card card-fullsize card-account card-input-format" v-if="userStore.permission == '管理者'">
        <div class="card-info">
            <div class="item-group">
                <label class="input-title">密碼</label>
                <span class="input-value">{{ pwd }}</span>
            </div>
        </div>
    </div>
  </el-scrollbar>
</template>
<script setup lang="ts">
import { ref, reactive, getCurrentInstance } from 'vue'
import { ElButton, ElScrollbar } from "element-plus";
import { EditPen, ArrowLeft } from '@element-plus/icons-vue';
import MainHeader from "@/components/MainHeader.vue";
import { useUserStore } from "@/stores/user";

const app = getCurrentInstance();
const _global = app?.appContext.config.globalProperties
const $commonLib = app?.appContext.config.globalProperties.$CommonLib;
const $WebAPI = app?.appContext.config.globalProperties.$WebAPI;
const _$route = app?.appContext.config.globalProperties.$route;
const userStore = useUserStore();

const createdate = ref('')
const username = ref('')
const account = ref('')
const email = ref('')
const permission = ref('')
const datastate = ref('')
const pwd = ref('')
const isAccessEdit = ref(false)

const handleClick = () => {
    
    if (userStore.permission == '編輯者') {
        _global?.$router.push({ name: 'Account_Edit', query: { id: _$route?.query.id }})
    }
    if (userStore.permission == '管理者') {
        _global?.$router.push({ name: 'Account_Edit_Manager', query: { id: _$route?.query.id }})
    }
}

const ids = _$route?.query.id ? [parseInt(_$route?.query.id.toString())] : null

$WebAPI.GetAccountList(
    userStore.token,
    null,
    null,
    null,
    ids,
    (res: any) => {
      console.log(res);
      let _resData = res.data || "error";
      if (_resData == "error") return console.error(`API res ${_resData}`);

      let _res = _resData.result;

      if (_res.errCode != 0) return console.error(_res.errMsg);

      const _data = _res.result[0]
      createdate.value = _data.createDate
      username.value = _data.userName
      account.value = _data.account
      email.value = _data.email
      permission.value = _data.permission
      datastate.value = _data.state
      pwd.value = _data.pwd

      if ((userStore.permission == "編輯者" && _data.permission != "管理者") || userStore.permission == "管理者") {
        isAccessEdit.value = true
      }
      if (_data.id == userStore.userID) {
        userStore.login(_data.account, userStore.token, _data.userName, _data.email, _data.id, _data.permission, _data.state)
      }
    }
  )
</script>
