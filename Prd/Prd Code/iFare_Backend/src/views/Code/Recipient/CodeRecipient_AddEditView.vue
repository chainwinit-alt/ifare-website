<template>
  <main-header>
    <template #subtitle v-if="$route.name != 'Code_Recipient_Add'">
      <sub class="sub-title sub-createDate">{{ createdate }}</sub>
      <sub class="sub-title sub-number">{{ $route.query.id }}</sub>
    </template>
    <template #btnsRight>
      <el-button
        :icon="Close"
        size="large"
        @click="$router.go(-1)"
        >取消</el-button
      >
      <el-button :icon="Check" size="large" type="primary" @click="SaveAction"
        >儲存</el-button
      >
    </template>
  </main-header>
  <el-scrollbar class="main-scrollbar">
    <div
      class="section-main-card card-fullsize card-code-recipient card-input-format"
    >
      <div class="card-info">
        <div class="item-group">
          <label class="input-title">名稱</label>
          <el-input
            class="c-input-format"
            v-model="input_name"
            type="text"
            size="large"
            placeholder="請輸入名稱"
          />
        </div>
      </div>
    </div>
    <div
      class="section-main-card card-fullsize card-code-recipient card-input-format"
    >
      <div class="card-info">
        <div class="item-group">
          <label class="input-title required">資料狀態</label>
          <el-switch
            v-model="switch_state"
            size="large"
            active-text="啟用"
            inactive-text="停用"
          />
        </div>
      </div>
    </div>
  </el-scrollbar>
</template>
<script setup lang="ts">
import { ref, reactive, getCurrentInstance } from "vue";
import { ElButton, ElSwitch, ElInput, ElScrollbar } from "element-plus";
import { Close, Check } from "@element-plus/icons-vue";
import MainHeader from "@/components/MainHeader.vue";
import { useUserStore } from "@/stores/user";
import { useRouter } from 'vue-router'

const app = getCurrentInstance();
const $commonLib = app?.appContext.config.globalProperties.$CommonLib;
const $WebAPI = app?.appContext.config.globalProperties.$WebAPI;
const _$route = app?.appContext.config.globalProperties.$route;
const _router = useRouter();
const userStore = useUserStore();
const $Message = app?.appContext.config.globalProperties.$message;

const routeNameType = _$route?.name?.toString().toLocaleLowerCase() || "";
const ids = _$route?.query.id ? [parseInt(_$route?.query.id.toString())] : null;
const createdate = ref("");
const input_name = ref("");
const switch_state = ref(true);
if (routeNameType.indexOf("edit") >= 0) {
  $WebAPI.GetCodeRecipient(
    userStore.token,
    null,
    null,
    null,
    null,
    null,
    false,
    ids,
    (res: any) => {
      let _resData = res.data || "error";
      if (_resData == "error") return console.error(`API res ${_resData}`);

      let _res = _resData.result;
      if (_res.errCode != 0) return console.error(_res.errMsg);
      if (_res.result.length <= 0) return console.error("No Datas.");
      createdate.value = _res.result[0].createDate;
      input_name.value = _res.result[0].labelName;
      switch_state.value = _res.result[0].state == "啟用";
    }
  );
}

function SaveAction() {
  const _labelName = input_name.value;
  const _isEnabled = switch_state.value;

  if (routeNameType.indexOf("add") >= 0) {
    console.log("[Add] Save action");
    $WebAPI.InsertCodeRecipient(
      userStore.token,
      _labelName,
      _isEnabled,
      (res: any) => {
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
        $commonLib.GuideToPage("Code_Recipient_DataList");
      }
    );
  }

  if (routeNameType.indexOf("edit") >= 0) {
    console.log("[Edit] Save action");
    const _id = ids ? ids[0] : 0;
    if (_id == 0) return false;
    $WebAPI.UpdateCodeRecipient(
      userStore.token,
      _id,
      _labelName,
      _isEnabled,
      (res: any) => {
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
        // $commonLib.GuideToPage("Code_Recipient_DataList");
        _router.back();
      }
    );
  }
}
</script>
