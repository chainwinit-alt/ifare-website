<template>
    <main-header>
      <template #btnsRight>
          <el-button :icon="Close" color="white" size="large" @click="$router.go(-1)">取消</el-button>
          <el-button :icon="Check" type="primary" size="large" @click="SaveAction">儲存</el-button>
      </template>
    </main-header>
    <el-scrollbar class="main-scrollbar">
        <div class="section-main-card card-fullsize card-personal" name="edit-mode">
        <div class="card-info">
            <div class="item-group">
                <label class="item-title personal-title required">姓名</label>
                <el-input class="p-input" v-model="personal_name" type="text" size="large" placeholder="請輸入姓名"/>
            </div>
            <div class="item-group">
                <label class="item-title personal-title">帳號</label>
                <span class="item-value personal-value">{{ userStore.act }}</span>
            </div>
            <div class="item-group">
                <label class="item-title personal-title required">E-mail</label>
                <el-input class="p-input" v-model="personal_email" type="email" size="large" placeholder="請輸入E-mail"/>
            </div>
            <div class="item-group">
                <label class="item-title personal-title">權限</label>
                <span class="item-value personal-value">{{ userStore.permission }}</span>
            </div>
        </div>
        </div>
        <div class="section-main-card card-fullsize card-personal">
        <div class="card-info">
            <div class="item-group">
                <label class="item-title personal-title">資料狀態</label>
                <span class="item-value personal-value">{{ userStore.state }}</span>
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
  
  const app = getCurrentInstance();
  const $commonLib = app?.appContext.config.globalProperties.$CommonLib;
  const $WebAPI = app?.appContext.config.globalProperties.$WebAPI;
  const $Message = app?.appContext.config.globalProperties.$message;
  const userStore = useUserStore();
  const _router = useRouter();
  
  const personal_name = ref(userStore.userName)
  const personal_email = ref(userStore.email)

  function SaveAction() {
    const _selfName = personal_name.value
    const _selfEmail = personal_email.value

    if (!_selfName) {
      return $Message({ message: `【姓名】不可為空`, type: "warning" })
    }
    if (!_selfEmail) {
      return $Message({ message: `【E-mail】不可為空`, type: "warning" })
    }

    $WebAPI.UpdatePersonalInfo(userStore.token, userStore.userID, _selfName, _selfEmail,(res: any) => {
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
        _router.back();
      }
    );
  }
  
  </script>
  