<template>
  <main-header>
    <template #btnsRight>
      <el-button
        :icon="Plus"
        type="primary"
        size="large"
        @click="$commonLib.GuideToPage('Account_Add')"
        v-show="userStore.permission=='管理者'"
        >新增資料</el-button
      >
    </template>
  </main-header>
  <el-scrollbar class="main-scrollbar">
    <card-search-param
      v-model:search-params="searchParams"
      search-mode="Account"
      :defaultParams="defaultParams"
    />
    <card-table
      :column-info-list="columnInfoList"
      :tb-data-list="tbDataList"
      tb-name="Account"
    />
  </el-scrollbar>
</template>
<script setup lang="ts">
import { ref, reactive, watch, getCurrentInstance } from "vue";
import { ElButton, ElScrollbar } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import MainHeader from "@/components/MainHeader.vue";
import CardSearchParam from "@/components/CardSearchParam.vue";
import CardTable from "@/components/CardTable.vue";
import type { ColumnInfo, TbDataInfo_Account } from "@/interface/MTable";
import dataTest from "@/data/TestDataList/Account.json";
import { useUserStore } from "@/stores/user";
import { useRoute } from "vue-router";

const app = getCurrentInstance();
const $commonLib = app?.appContext.config.globalProperties.$CommonLib;
const $WebAPI = app?.appContext.config.globalProperties.$WebAPI;
const userStore = useUserStore();
const _route = useRoute();
console.log(_route.query)

const defaultParams = ref(_route.query)
const searchParams = ref();
const columnInfoList = reactive<Array<ColumnInfo>>([
  { prop: "account", label: "帳號" },
  { prop: "user_name", label: "姓名" },
  { prop: "user_email", label: "E-mail" },
  { prop: "permission", label: "權限" },
  { prop: "state_data", label: "資料狀態", opts: { type: "state_data" } },
  { prop: "user_create", label: "建立人員" },
  { prop: "date_create", label: "建立日期" },
  { prop: "user_update", label: "異動人員" },
  { prop: "date_update", label: "異動日期" },
  {
    prop: "operate",
    label: "操作",
    opts: { type: "url", info: [{ label: "查看" }] },
  },
]);
const tbDataList = reactive<Array<TbDataInfo_Account>>([]);

function WebAPI_GetDataList(
  _permission?: string,
  _state?: string,
  _account?: string
) {
  $WebAPI.GetAccountList(
    userStore.token,
    _permission,
    _state,
    _account,
    null,
    (res: any) => {
      console.log(res);
      let _resData = res.data || "error";
      if (_resData == "error") return console.error(`API res ${_resData}`);

      let _res = _resData.result;

      if (_res.errCode != 0) return console.error(_res.errMsg);

      let list: Array<TbDataInfo_Account> = _res.result.map(
        (item: any, i: number) => {
          return {
            id: item.id,
            account: item.account,
            user_name: item.userName,
            user_email: item.email,
            permission: item.permission,
            state_data: item.state,
            user_create: item.createUserName || "-",
            date_create: item.createDate || "-",
            user_update: item.updateUserName || "-",
            date_update: item.updateDate || "-",
          };
        }
      );

      tbDataList.splice(0, tbDataList.length, ...list);
    }
  );
}

WebAPI_GetDataList(_route.query.permission?.toString(),
                  _route.query.dataState?.toString(),
                  _route.query.account?.toString());

watch(searchParams, (newVal, oldVal) => {
  console.log(newVal);

  let permission = newVal.radioSelect.permission || "";
  let state = newVal.radioSelect.dataState || "";
  let account = newVal.searchInput.account;

  WebAPI_GetDataList(
    permission != "" ? permission : undefined,
    state != "" ? state : undefined,
    account != "" ? account : undefined
  );
});
</script>
