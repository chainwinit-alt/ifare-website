<template>
  <main-header>
    <template #btnsRight>
      <el-button
        :icon="Plus"
        type="primary"
        size="large"
        @click="$commonLib.GuideToPage('News_Add')"
        >新增資料</el-button
      >
    </template>
  </main-header>
  <el-scrollbar class="main-scrollbar">
    <card-search-param
      v-model:search-params="searchParams"
      search-mode="News"
      :defaultParams="defaultParams"
    />
    <card-table
      :column-info-list="columnInfoList"
      :tb-data-list="tbDataList"
      tb-name="News"
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
import type { ColumnInfo, TbDataInfo_News } from "@/interface/MTable";
import dataTest from "@/data/TestDataList/News.json";
import { useUserStore } from "@/stores/user";
import { useRoute } from "vue-router";

const app = getCurrentInstance();
const $commonLib = app?.appContext.config.globalProperties.$CommonLib;
const $WebAPI = app?.appContext.config.globalProperties.$WebAPI;
const userStore = useUserStore();
const _route = useRoute();

const defaultParams = ref(_route.query)
const searchParams = ref();
const columnInfoList = reactive<Array<ColumnInfo>>([
  { prop: "title", label: "標題" },
  { prop: "date_release", label: "上架日期" },
  { prop: "date_discontinued", label: "下架日期" },
  { prop: "state_data", label: "資料狀態", opts: { type: "state_data" } },
  { prop: "user_create", label: "建立人員" },
  { prop: "date_create", label: "建立日期" },
  { prop: "user_update", label: "異動人員" },
  { prop: "date_update", label: "異動日期" },
  {
    prop: "operate",
    label: "操作",
    opts: { type: "url", info: [{ label: "查看" }, { label: "刪除" }] },
  },
]);
const tbDataList = reactive<Array<TbDataInfo_News>>([]);

function WebAPI_GetDataList(
  _createDateStart?: string,
  _createDateEnd?: string,
  _updateDateStart?: string,
  _updateDateEnd?: string,
  _state?: string,
) {
  $WebAPI.GetNewsList(
    userStore.token,
    _createDateStart,
    _createDateEnd,
    _updateDateStart,
    _updateDateEnd,
    _state,
    null,
    (res: any) => {
      console.log(res);
      let _resData = res.data || "error";
      if (_resData == "error") return console.error(`API res ${_resData}`);

      let _res = _resData.result;

      if (_res.errCode != 0) return console.error(_res.errMsg);

      let list: Array<TbDataInfo_News> = _res.result.map(
        (item: any, i: number) => {
          return {
            id: item.id,
            title: item.title,
            date_release: item.releaseTime ? item.releaseTime.split('T')[0] : "-",
            date_discontinued: item.discontinuedTime ? item.discontinuedTime.split('T')[0] : "-",
            state_data: item.state,
            user_create: item.createUserName,
            date_create: item.createDate,
            user_update: item.updateUserName || "-",
            date_update: item.updateDate || "-",
          };
        }
      );

      tbDataList.splice(0, tbDataList.length, ...list);
    }
  );
}

WebAPI_GetDataList( _route.query.create?.toString().split("TO")[0],
                    _route.query.create?.toString().split("TO")[1],
                    _route.query.update?.toString().split("TO")[0],
                    _route.query.update?.toString().split("TO")[1],
                    _route.query.dataState?.toString());

watch(searchParams, (newVal, oldVal) => {
  console.log(newVal);

  let state = newVal.radioSelect.dataState || "";
  let createDate = newVal.datepicker.create || [];
  let updateDate = newVal.datepicker.update || [];

  WebAPI_GetDataList(
    createDate.length >= 2 ? createDate[0] : undefined,
    createDate.length >= 2 ? createDate[1] : undefined,
    updateDate.length >= 2 ? updateDate[0] : undefined,
    updateDate.length >= 2 ? updateDate[1] : undefined,
    state != "" ? state : undefined,
  );
});
</script>
