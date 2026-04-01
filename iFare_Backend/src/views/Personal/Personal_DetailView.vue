<template>
  <main-header>
    <template #btnsRight>
      <el-button
        :icon="Lock"
        color="white"
        size="large"
        @click="$commonLib.GuideToPage('Personal_ChangePwd')"
        >變更密碼</el-button
      >
      <el-button
        :icon="EditPen"
        type="primary"
        size="large"
        @click="$commonLib.GuideToPage('Personal_Edit')"
        >編輯</el-button
      >
    </template>
  </main-header>
  <el-scrollbar class="main-scrollbar">
    <div class="section-main-card card-fullsize card-personal">
      <div class="card-info">
        <div class="item-group">
          <label class="personal-title">姓名</label>
          <span class="personal-value">{{ userStore.userName }}</span>
        </div>
        <div class="item-group">
          <label class="personal-title">帳號</label>
          <span class="personal-value">{{ userStore.act }}</span>
        </div>
        <div class="item-group">
          <label class="personal-title">E-mail</label>
          <span class="personal-value">{{ userStore.email }}</span>
        </div>
        <div class="item-group">
          <label class="personal-title">權限</label>
          <span class="personal-value">{{ userStore.permission }}</span>
        </div>
      </div>
    </div>
    <div class="section-main-card card-fullsize card-personal">
      <div class="card-info">
        <div class="item-group">
          <label class="personal-title">資料狀態</label>
          <span class="personal-value">{{ userStore.state }}</span>
        </div>
      </div>
    </div>
  </el-scrollbar>
</template>
<script setup lang="ts">
import { getCurrentInstance } from "vue";
import { ElButton, ElScrollbar } from "element-plus";
import { Lock, EditPen } from "@element-plus/icons-vue";
import MainHeader from "@/components/MainHeader.vue";
import { useUserStore } from "@/stores/user";

const app = getCurrentInstance();
const $commonLib = app?.appContext.config.globalProperties.$CommonLib;
const $WebAPI = app?.appContext.config.globalProperties.$WebAPI;
const userStore = useUserStore();

$WebAPI.GetPersonalInfo(
    userStore.token,
    (res: any) => {
      console.log(res);
      let _resData = res.data || "error";
      if (_resData == "error") return console.error(`API res ${_resData}`);

      let _res = _resData.result;

      if (_res.errCode != 0) return console.error(_res.errMsg);

      const _data = _res.result
      userStore.login(_data.account, userStore.token, _data.userName, _data.email, _data.id, _data.permission, _data.state)
    }
  )
</script>
