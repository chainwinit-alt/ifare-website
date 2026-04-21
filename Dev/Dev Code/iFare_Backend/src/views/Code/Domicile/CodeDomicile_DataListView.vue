<template>
  <!-- ========================================================
    頁面用途：戶籍代碼【資料列表】頁
    路由名稱：Code_Domicile_DataList
    功能說明：
      - 顯示戶籍代碼的資料列表，支援多條件搜尋（建立日期、異動日期、名稱關鍵字）
      - 點擊「新增資料」按鈕導向新增頁面
      - 列表每列提供「編輯」操作連結
  ======================================================== -->

  <!-- 頂部標題列，右側提供「新增資料」按鈕 -->
  <main-header>
    <template #btnsRight>
      <!-- 點擊後導向戶籍代碼新增頁（Code_Domicile_Add） -->
      <el-button
        :icon="Plus"
        type="primary"
        size="large"
        @click="$commonLib.GuideToPage('Code_Domicile_Add')"
        >新增資料</el-button
      >
    </template>
  </main-header>

  <!-- 主要內容區（可捲動） -->
  <el-scrollbar class="main-scrollbar">
    <!-- 搜尋條件卡片：提供建立日期、異動日期、名稱關鍵字篩選
         v-model:search-params 雙向同步搜尋參數，變更時由 watch 觸發 API 重新查詢 -->
    <card-search-param
      v-model:search-params="searchParams"
      search-mode="Code_Domicile"
      :defaultParams="defaultParams"
    />
    <!-- 資料表格：依 columnInfoList 定義欄位，資料來源為 tbDataList -->
    <card-table
      :column-info-list="columnInfoList"
      :tb-data-list="tbDataList"
      tb-name="Code_Domicile"
    />
  </el-scrollbar>
</template>

<script setup lang="ts">
/**
 * 頁面：戶籍代碼 資料列表
 * 模組：Code > Domicile
 * 資料流：
 *   1. 頁面載入時，從 URL query 取得預設篩選條件，呼叫 WebAPI_GetDataList 取得初始資料
 *   2. 使用者操作搜尋條件時，watch(searchParams) 偵測到變更，重新呼叫 WebAPI_GetDataList
 *   3. API 回傳結果映射為 TbDataInfo_CodeDomicile 格式後寫入 tbDataList，由 CardTable 渲染
 */
import { ref, reactive, watch, getCurrentInstance } from "vue";
import { ElButton, ElScrollbar } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import MainHeader from "@/components/MainHeader.vue";
import CardSearchParam from "@/components/CardSearchParam.vue";
import CardTable from "@/components/CardTable.vue";
import type { ColumnInfo, TbDataInfo_CodeDomicile } from "@/interface/MTable";
import dataTest from "@/data/TestDataList/Code_Domicile.json"; // 測試用假資料（開發期間使用）
import { useUserStore } from "@/stores/user";
import { useRoute } from "vue-router";

// 取得全域掛載的工具函式與 API 物件
const app = getCurrentInstance();
const $commonLib = app?.appContext.config.globalProperties.$CommonLib; // 共用工具函式庫
const $WebAPI = app?.appContext.config.globalProperties.$WebAPI;       // Web API 呼叫封裝
const userStore = useUserStore();                                      // Pinia 使用者狀態（含 token）
const _route = useRoute()                                              // 當前路由資訊

// 從 URL query 讀取預設搜尋參數（供 CardSearchParam 元件初始化使用）
const defaultParams = ref(_route.query)
// 搜尋條件參數（由 CardSearchParam 元件透過 v-model 更新）
const searchParams = ref();

// 表格欄位定義
const columnInfoList = reactive<Array<ColumnInfo>>([
  { prop: "title", label: "名稱" },
  { prop: "state_data", label: "資料狀態", opts: { type: "state_data" } }, // 顯示啟用/停用標籤
  { prop: "user_create", label: "建立人員" },
  { prop: "date_create", label: "建立日期" },
  { prop: "user_update", label: "異動人員" },
  { prop: "date_update", label: "異動日期" },
  {
    prop: "operate",
    label: "操作",
    opts: { type: "url", info: [{ label: "編輯" }] }, // 操作欄：提供編輯連結
  },
]);

// 表格資料列表（響應式陣列，API 回傳後更新）
const tbDataList = reactive<Array<TbDataInfo_CodeDomicile>>([]);

/**
 * WebAPI_GetDataList — 呼叫 GetCodeDomicile API 取得戶籍代碼清單
 * @param createDateStart 建立日期起
 * @param createDateEnd   建立日期迄
 * @param updateDateStart 異動日期起
 * @param updateDateEnd   異動日期迄
 * @param searchName      名稱關鍵字
 */
function WebAPI_GetDataList(
  createDateStart?: string,
  createDateEnd?: string,
  updateDateStart?: string,
  updateDateEnd?: string,
  searchName?: string
) {
  // API 說明：GetCodeDomicile(token, 建立日起, 建立日迄, 異動日起, 異動日迄, 名稱關鍵字, 是否只取啟用, ids陣列, callback)
  $WebAPI.GetCodeDomicile(
    userStore.token,
    createDateStart,
    createDateEnd,
    updateDateStart,
    updateDateEnd,
    searchName,
    false,  // false = 不限制只取啟用資料
    null,   // null = 不指定特定 id
    (res: any) => {
      console.log(res);
      let _resData = res.data || "error";
      if (_resData == "error") return console.error(`API res ${_resData}`);

      let _res = _resData.result;
      if (_res.errCode != 0) return console.error(_res.errMsg);

      // 將 API 回傳資料映射為表格所需格式
      let list: Array<TbDataInfo_CodeDomicile> = _res.result.map(
        (item: any, i: number) => {
          return {
            id: item.id,
            title: item.labelName,           // 顯示名稱
            state_data: item.state,          // 資料狀態（啟用/停用字串）
            user_create: item.createUserName, // 建立人員名稱
            date_create: item.createDate,     // 建立日期
            user_update: item.updateUserName || "-", // 異動人員（無資料顯示 "-"）
            date_update: item.updateDate || "-",     // 異動日期（無資料顯示 "-"）
          };
        }
      );

      // 更新表格資料（splice 確保響應式陣列完整替換）
      tbDataList.splice(0, tbDataList.length, ...list);
    }
  );
}

// 頁面初始載入：解析 URL query 中的日期範圍（格式：startDateTOendDate）與關鍵字
WebAPI_GetDataList(_route.query.create?.toString().split("TO")[0],  // 建立日起
                    _route.query.create?.toString().split("TO")[1], // 建立日迄
                    _route.query.update?.toString().split("TO")[0], // 異動日起
                    _route.query.update?.toString().split("TO")[1], // 異動日迄
                    _route.query.word?.toString());                  // 名稱關鍵字

// 監聽搜尋條件變更，重新呼叫 API 更新列表
watch(searchParams, (newVal, oldVal) => {
  console.log(newVal);

  let createDate = newVal.datepicker.create || []  // 建立日期範圍陣列 [start, end]
  let updateDate = newVal.datepicker.update || []  // 異動日期範圍陣列 [start, end]
  let searchName = newVal.searchInput.word         // 名稱關鍵字

  WebAPI_GetDataList(
    createDate.length >= 2 ? createDate[0] : undefined, // 需有起訖兩個值才傳入
    createDate.length >= 2 ? createDate[1] : undefined,
    updateDate.length >= 2 ? updateDate[0] : undefined,
    updateDate.length >= 2 ? updateDate[1] : undefined,
    searchName != '' ? searchName : undefined // 空字串轉為 undefined（不傳搜尋條件）
  )
});
</script>
