<template>
  <!-- 頁面頂部標題列，右側提供「新增資料」按鈕 -->
  <main-header>
    <template #btnsRight>
      <!-- 點擊後跳轉至新增合作夥伴頁面 -->
      <el-button
        :icon="Plus"
        type="primary"
        size="large"
        @click="$commonLib.GuideToPage('Collaborator_Add')"
        >新增資料</el-button
      >
    </template>
  </main-header>
  <el-scrollbar class="main-scrollbar">
    <!-- 搜尋條件卡片：提供資料狀態篩選、日期區間、關鍵字搜尋 -->
    <!-- searchParams 為雙向綁定，變動時 watch 會自動重新呼叫 API -->
    <card-search-param
      v-model:search-params="searchParams"
      search-mode="Collaborator"
      :defaultParams="defaultParams"
    />
    <!-- 資料表格：顯示合作夥伴清單，支援查看與刪除操作 -->
    <card-table
      :column-info-list="columnInfoList"
      :tb-data-list="tbDataList"
      tb-name="Collaborator"
    />
  </el-scrollbar>
</template>
<script setup lang="ts">
/**
 * 頁面用途：合作夥伴 資料列表頁
 * - 進入頁面時依 URL query 參數自動篩選並取得資料列表
 * - 搜尋條件變更時（watch searchParams）重新呼叫 API 更新列表
 * 資料流：URL query → WebAPI_GetDataList → GetCollaboratorList API → tbDataList
 */
import { ref, reactive, watch, getCurrentInstance } from "vue";
import { ElButton, ElScrollbar } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import MainHeader from "@/components/MainHeader.vue";
import CardSearchParam from "@/components/CardSearchParam.vue";
import CardTable from "@/components/CardTable.vue";
import type { ColumnInfo, TbDataInfo_Collaborator } from "@/interface/MTable";
import dataTest from "@/data/TestDataList/Collaborator.json";
import { useUserStore } from "@/stores/user";
import { useRoute } from "vue-router";

// 取得全域工具
const app = getCurrentInstance();
const $commonLib = app?.appContext.config.globalProperties.$CommonLib;
const $WebAPI = app?.appContext.config.globalProperties.$WebAPI;
const userStore = useUserStore();
const _route = useRoute()

// 從 URL query 取得預設篩選條件，傳入搜尋元件作為初始值
const defaultParams = ref(_route.query)
const searchParams = ref();  // 搜尋元件回傳的篩選條件，watch 此值觸發重新查詢

// 表格欄位定義
const columnInfoList = reactive<Array<ColumnInfo>>([
  { prop: "title", label: "名稱" },
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
// 表格資料來源（響應式陣列，由 API 回傳後更新）
const tbDataList = reactive<Array<TbDataInfo_Collaborator>>([]);

/**
 * WebAPI_GetDataList：呼叫後端 API 取得合作夥伴列表
 * @param _state         資料狀態篩選（啟用/停用）
 * @param _updateDateStart 異動日期起始
 * @param _updateDateEnd   異動日期結束
 * @param _searchName    關鍵字搜尋（名稱）
 * 成功後將 API 資料映射為表格所需格式並更新 tbDataList
 */
function WebAPI_GetDataList(
  _state?: string,
  _updateDateStart?: string,
  _updateDateEnd?: string,
  _searchName?: string
) {
  $WebAPI.GetCollaboratorList(
    userStore.token,
    _state,
    _updateDateStart,
    _updateDateEnd,
    _searchName,
    null,
    (res: any) => {
      console.log(res);
      let _resData = res.data || "error";
      if (_resData == "error") return console.error(`API res ${_resData}`);

      let _res = _resData.result;

      if (_res.errCode != 0) return console.error(_res.errMsg);

      // 將 API 回傳陣列映射為表格欄位對應格式
      let list: Array<TbDataInfo_Collaborator> = _res.result.map(
        (item: any, i: number) => {
          return {
            id: item.id,
            title: item.title,
            state_data: item.state,
            user_create: item.createUserName,
            date_create: item.createDate,
            user_update: item.updateUserName || "-",
            date_update: item.updateDate || "-",
          };
        }
      );

      // 以新資料取代舊陣列（保持響應式參考不變）
      tbDataList.splice(0, tbDataList.length, ...list);
    }
  );
}

// 頁面初始化：依 URL query 參數執行初次查詢
// update 欄位格式為 "日期起TO日期迄"，需拆分後傳入
WebAPI_GetDataList(_route.query.dataState?.toString(),
                    _route.query.update?.toString().split("TO")[0],
                    _route.query.update?.toString().split("TO")[1],
                    _route.query.word?.toString());

// 監聽搜尋條件變更，自動重新查詢
watch(searchParams, (newVal, oldVal) => {
  console.log(newVal);

  let state = newVal.radioSelect.dataState || ""
  let updateDate = newVal.datepicker.update || [];
  let searchName = newVal.searchInput.word;

  WebAPI_GetDataList(
    state != "" ? state : undefined,
    updateDate.length >= 2 ? updateDate[0] : undefined,
    updateDate.length >= 2 ? updateDate[1] : undefined,
    searchName != "" ? searchName : undefined
  );
});
</script>
