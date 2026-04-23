<template>
  <!-- ========================================================
    頁面用途：戶籍代碼【新增 / 編輯】表單頁
    路由名稱：Code_Domicile_Add（新增）、Code_Domicile_Edit（編輯）
    功能說明：
      - 新增模式：填寫名稱與啟用狀態後，呼叫 InsertCodeDomicile API 建立新資料
      - 編輯模式：從 URL query.id 讀取對應資料，修改後呼叫 UpdateCodeDomicile API 更新
  ======================================================== -->

  <!-- 頂部標題列，包含副標題與操作按鈕 -->
  <main-header>
    <!-- 編輯模式下才顯示副標題（建立日期 + 資料ID） -->
    <template #subtitle v-if="$route.name != 'Code_Domicile_Add'">
      <sub class="sub-title sub-createDate">{{ createdate }}</sub>
      <sub class="sub-title sub-number">{{ $route.query.id }}</sub>
    </template>
    <!-- 右側按鈕列：取消（返回上一頁）、儲存（觸發 SaveAction） -->
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

  <!-- 主要內容區（可捲動） -->
  <el-scrollbar class="main-scrollbar">
    <!-- 卡片區塊：名稱輸入 -->
    <div
      class="section-main-card card-fullsize card-code-domicile card-input-format"
    >
      <div class="card-info">
        <div class="item-group">
          <label class="input-title">名稱</label>
          <!-- 雙向綁定 input_name，用於送出時取值 -->
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

    <!-- 卡片區塊：資料狀態切換（啟用 / 停用） -->
    <div
      class="section-main-card card-fullsize card-code-domicile card-input-format"
    >
      <div class="card-info">
        <div class="item-group">
          <label class="input-title required">資料狀態</label>
          <!-- 雙向綁定 switch_state；true = 啟用，false = 停用 -->
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
/**
 * 頁面：戶籍代碼 新增 / 編輯
 * 模組：Code > Domicile
 */
import { ref, reactive, getCurrentInstance } from "vue";
import { ElButton, ElSwitch, ElInput, ElScrollbar } from "element-plus";
import { Close, Check } from "@element-plus/icons-vue";
import MainHeader from "@/components/MainHeader.vue";
import { useUserStore } from "@/stores/user";
import { useRouter } from "vue-router";

// 取得全域掛載的工具函式與 API 物件
const app = getCurrentInstance();
const $commonLib = app?.appContext.config.globalProperties.$CommonLib; // 共用工具函式庫（頁面導向等）
const $WebAPI = app?.appContext.config.globalProperties.$WebAPI;        // Web API 呼叫封裝
const _$route = app?.appContext.config.globalProperties.$route;         // 當前路由資訊
const _router = useRouter();                                            // Vue Router 實例
const userStore = useUserStore();                                       // Pinia 使用者狀態（含 token）
const $Message = app?.appContext.config.globalProperties.$message;      // Element Plus 訊息提示

// 判斷目前路由為「新增」或「編輯」模式（轉小寫後比對）
const routeNameType = _$route?.name?.toString().toLocaleLowerCase() || "";
// 編輯模式下取得 URL query 中的 id，轉為數字陣列供 API 使用
const ids = _$route?.query.id ? [parseInt(_$route?.query.id.toString())] : null

// 表單欄位響應式變數
const createdate = ref("")    // 建立日期（僅顯示，編輯模式由 API 回傳）
const input_name = ref("");   // 名稱輸入欄
const switch_state = ref(true); // 資料狀態：預設啟用

// 編輯模式：頁面載入時呼叫 GetCodeDomicile API 取得既有資料填入表單
if (routeNameType.indexOf("edit") >= 0) {
  // API 說明：GetCodeDomicile(token, 建立日起, 建立日迄, 異動日起, 異動日迄, 名稱關鍵字, 是否只取啟用, ids陣列, callback)
  $WebAPI.GetCodeDomicile(userStore.token, null, null, null, null, null, false, ids, (res:any) => {
    let _resData = res.data || "error";
    if (_resData == "error") return console.error(`API res ${_resData}`);

    let _res = _resData.result;
    if (_res.errCode != 0) return console.error(_res.errMsg);
    if (_res.result.length <= 0) return console.error("No Datas.")

    // 將 API 回傳資料填入表單
    createdate.value = _res.result[0].createDate
    input_name.value = _res.result[0].labelName
    switch_state.value = _res.result[0].state == "啟用" // 轉換為布林值
  })
}

/**
 * SaveAction — 儲存按鈕點擊處理
 * 根據目前路由模式（add / edit）分別呼叫新增或更新 API
 */
function SaveAction() {
  const _labelName = input_name.value   // 取得表單名稱欄位值
  const _isEnabled = switch_state.value // 取得資料狀態布林值

  // ── 新增模式 ──
  if (routeNameType.indexOf("add") >= 0) {
    console.log("[Add] Save action");
    // API 說明：InsertCodeDomicile(token, 名稱, 是否啟用, callback)
    $WebAPI.InsertCodeDomicile(userStore.token, _labelName, _isEnabled,(res: any) => {
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

        // 新增成功後顯示提示並導向列表頁
        $Message({ message: '新增成功', type: "success" })
        $commonLib.GuideToPage('Code_Domicile_DataList')
      }
    );
  }

  // ── 編輯模式 ──
  if (routeNameType.indexOf("edit") >= 0) {
    console.log("[Edit] Save action");
    const _id = ids? ids[0] : 0
    if (_id == 0) return false // id 無效則中止
    // API 說明：UpdateCodeDomicile(token, id, 名稱, 是否啟用, callback)
    $WebAPI.UpdateCodeDomicile(userStore.token, _id, _labelName, _isEnabled,(res: any) => {
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

        // 編輯成功後顯示提示並返回上一頁
        $Message({ message: '編輯成功', type: "success" })
        // $commonLib.GuideToPage('Code_Domicile_DataList')
        _router.back()
      }
    );
  }
}
</script>
