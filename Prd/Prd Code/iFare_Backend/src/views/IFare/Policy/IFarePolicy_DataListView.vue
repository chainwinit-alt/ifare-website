<template>
  <main-header>
    <template #btnsRight>
      <el-button
        :icon="Plus"
        type="primary"
        size="large"
        @click="$commonLib.GuideToPage('IFare_Policy_Add')"
        v-if="userStore.permission != '檢視者'"
        >新增資料</el-button
      >
    </template>
  </main-header>
  <el-scrollbar class="main-scrollbar">
    <card-search-param
      v-model:search-params="searchParams"
      search-mode="IFare_Policy"
      :defaultParams="defaultParams"
    />
    <card-table
      :column-info-list="columnInfoList"
      :tb-data-list="tbDataList"
      tb-name="IFare_Policy"
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
import type { ColumnInfo, TbDataInfo_IFarePolicy } from "@/interface/MTable";
import dataTest from "@/data/TestDataList/IFarePolicy.json";
import { useUserStore } from "@/stores/user";
import { useRoute } from "vue-router";

const app = getCurrentInstance();
const $commonLib = app?.appContext.config.globalProperties.$CommonLib;
const $WebAPI = app?.appContext.config.globalProperties.$WebAPI;
const userStore = useUserStore();
const _route = useRoute()

const defaultParams = ref(_route.query)
const searchParams = ref();
const columnInfoList = reactive<Array<ColumnInfo>>([
  { prop: "id", label: "編號" },
  { prop: "policy", label: "政策類別" },
  { prop: "title", label: "標題" },
  { prop: "domicile", label: "地區" },
  { prop: "keyword", label: "關鍵字" },
  { prop: "state_release", label: "上架狀態" },
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
const tbDataList = reactive<Array<TbDataInfo_IFarePolicy>>([]);

if (userStore.permission == '檢視者') {
  columnInfoList.splice(columnInfoList.findIndex(p => p.prop == "operate"), 1, {
    prop: "operate",
    label: "操作",
    opts: { type: "url", info: [{ label: "查看" }] },
  })
}

function WebAPI_GetDataList(
  _createDateStart?: string,
  _createDateEnd?: string,
  _updateDateStart?: string,
  _updateDateEnd?: string,
  _releaseDateStart?: string,
  _releaseDateEnd?: string,
  _discontinuedDateStart?: string,
  _discontinuedDateEnd?: string,
  _codeDomicile?: number,
  _codePolicy?: number,
  _codeKeywords?: Array<number>,
  _state?: string,
  _ids?: Array<number>,
  _state_release?: string
) {
  $WebAPI.GetFarePolicyList(
    userStore.token,
    _createDateStart,
    _createDateEnd,
    _updateDateStart,
    _updateDateEnd,
    _releaseDateStart,
    _releaseDateEnd,
    _discontinuedDateStart,
    _discontinuedDateEnd,
    _codeDomicile,
    _codePolicy,
    _codeKeywords,
    _state,
    _ids,
    _state_release,
    (res: any) => {
      console.log(res);
      let _resData = res.data || "error";
      if (_resData == "error") return console.error(`API res ${_resData}`);

      let _res = _resData.result;

      if (_res.errCode != 0) return console.error(_res.errMsg);

      let list: Array<TbDataInfo_IFarePolicy> = _res.result.map(
        (item: any, i: number) => {
          return {
            id: item.id,
            policy: item.codePolicy_LabelName,
            title: item.title,
            domicile: item.codeDomicile_LabelName,
            keyword: item.codeKeywordList
              .map((item: any, i: number) => {
                return item.labelName;
              })
              .toString(),
            state_release: item.state_Release,
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

WebAPI_GetDataList( undefined,
                    undefined,
                    undefined,
                    undefined,
                    _route.query.release?.toString().split("TO")[0],
                    _route.query.release?.toString().split("TO")[1],
                    _route.query.discontinued?.toString().split("TO")[0],
                    _route.query.discontinued?.toString().split("TO")[1],
                    _route.query.domicile ? parseInt(_route.query.domicile?.toString()) : undefined,
                    _route.query.policy ? parseInt(_route.query.policy?.toString()) : undefined,
                    _route.query.keyword ? _route.query.keyword?.toString().indexOf(',') >= 0 ? _route.query.keyword?.toString().split(',').map((_k) => { return parseInt(_k)}) : [parseInt(_route.query.keyword?.toString())] : undefined,
                    _route.query.dataState?.toString(),
                    _route.query.num ? [parseInt(_route.query.num?.toString())]: undefined,
                    _route.query.releaseState?.toString())

watch(searchParams, (newVal, oldVal) => {
  console.log(newVal);

  let state = newVal.radioSelect.dataState || "";
  let createDate = newVal.datepicker.create || [];
  let updateDate = newVal.datepicker.update || [];
  let releaseDate = newVal.datepicker.release || [];
  let discontinuedDate = newVal.datepicker.discontinued || [];
  let _codeDomicile = newVal.itemSelect.domicile
  let _codeKeywords = newVal.itemSelect.keyword
  let _codePolicy = newVal.itemSelect.policy
  let state_release = newVal.radioSelect.releaseState || "";
  let _ids = newVal.searchInput.num != "" ? [newVal.searchInput.num] : [];

  WebAPI_GetDataList(
    createDate.length >= 2 ? createDate[0] : undefined,
    createDate.length >= 2 ? createDate[1] : undefined,
    updateDate.length >= 2 ? updateDate[0] : undefined,
    updateDate.length >= 2 ? updateDate[1] : undefined,
    releaseDate.length >= 2 ? releaseDate[0] : undefined,
    releaseDate.length >= 2 ? releaseDate[1] : undefined,
    discontinuedDate.length >= 2 ? discontinuedDate[0] : undefined,
    discontinuedDate.length >= 2 ? discontinuedDate[1] : undefined,
    _codeDomicile != "" ? _codeDomicile : undefined,
    _codePolicy != "" ? _codePolicy : undefined,
    _codeKeywords.length >= 0 ? _codeKeywords : undefined,
    state != "" ? state : undefined,
    _ids.length >= 0 ? _ids : undefined,
    state_release != "" ? state_release : undefined
  );
});
</script>
