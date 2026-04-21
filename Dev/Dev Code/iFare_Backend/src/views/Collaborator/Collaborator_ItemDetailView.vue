<template>
  <!-- 頁面頂部標題列 -->
  <main-header>
    <!-- 左側返回按鈕 -->
    <template #btnsLeft>
      <el-button :icon="ArrowLeft" size="large" @click="$router.go(-1)"
        >上一頁</el-button
      >
    </template>
    <!-- 顯示建立日期與資料 ID（非新增模式才顯示） -->
    <template #subtitle v-if="$route.name != 'Collaborator_Add'">
      <sub class="sub-title sub-createDate">{{ createdate }}</sub>
      <sub class="sub-title sub-number">{{ $route.query.id }}</sub>
    </template>
    <!-- 右側編輯按鈕：跳轉至編輯頁並帶入當前 ID -->
    <template #btnsRight>
      <el-button
        :icon="EditPen"
        size="large"
        type="primary"
        @click="handleClick"
        >編輯</el-button
      >
    </template>
  </main-header>
  <el-scrollbar class="main-scrollbar">
    <!-- 合作夥伴基本資料卡片：圖片、名稱、服務項目、電話、連結 -->
    <div
      class="section-main-card card-fullsize card-collaborator card-input-format"
    >
      <div class="card-info">
        <div class="item-group">
          <!-- 合作夥伴 Logo 圖片 -->
          <div class="input-title">
            <el-image :src="imgPath"/>
          </div>
          <h3 class="input-value">{{ title }}</h3>
        </div>
        <div class="item-group">
          <label class="input-title">服務項目</label>
          <span class="input-value">{{serviceItem}}</span>
        </div>
        <div class="item-group">
          <label class="input-title">電話</label>
          <span class="input-value">{{ tel }}</span>
        </div>
        <div class="item-group">
          <label class="input-title">連結</label>
          <!-- 若 URL 不含 http 則自動補上 https:// 前綴，確保連結可正常開啟 -->
          <el-link :href="url.indexOf('http') < 0 ? `https://${url}` : url" target="_blank">{{ url }}</el-link>
        </div>
      </div>
    </div>
    <!-- 資料狀態卡片：顯示啟用或停用，停用時以紅色警示文字呈現 -->
    <div
      class="section-main-card card-fullsize card-collaborator card-input-format"
    >
      <div class="card-info">
        <div class="item-group">
          <label class="input-title">資料狀態</label>
          <el-text
            class="input-value"
            :type="datastate == '停用' ? 'danger' : ''"
            >{{ datastate }}</el-text
          >
        </div>
      </div>
    </div>
  </el-scrollbar>
</template>
<script setup lang="ts">
/**
 * 頁面用途：合作夥伴 資料詳情頁
 * - 透過 URL query.id 取得指定合作夥伴的詳細資料並顯示
 * - 右上角「編輯」按鈕可跳轉至編輯頁（Collaborator_Edit）
 * 資料流：query.id → GetCollaboratorList API → 各 ref 欄位
 */
import { ref, reactive, getCurrentInstance } from "vue";
import { ElButton, ElScrollbar, ElText, ElLink, ElImage } from "element-plus";
import { ArrowLeft, EditPen } from "@element-plus/icons-vue";
import MainHeader from "@/components/MainHeader.vue";
import _image from "@/assets/img/image.png"
import { useUserStore } from "@/stores/user";

// 取得全域工具
const app = getCurrentInstance();
const _global = app?.appContext.config.globalProperties
const $commonLib = app?.appContext.config.globalProperties.$CommonLib;
const $WebAPI = app?.appContext.config.globalProperties.$WebAPI;
const _$route = app?.appContext.config.globalProperties.$route;
const userStore = useUserStore();

// 頁面顯示用的資料 ref
const createdate = ref('')    // 建立日期
const title = ref('')         // 合作夥伴名稱
const serviceItem = ref('')   // 服務項目
const imgPath = ref('')       // 圖片路徑
const tel = ref('')           // 電話
const url = ref('')           // 官網連結
const datastate = ref('')     // 資料狀態（啟用/停用）

// 從 URL query.id 取得資料 ID，包成陣列供 API 查詢使用
const ids = _$route?.query.id ? [parseInt(_$route?.query.id.toString())] : null

/**
 * handleClick：跳轉至編輯頁，並帶入當前資料 ID
 */
const handleClick = () => {
  _global?.$router.push({ name: "Collaborator_Edit", query: { id: _$route?.query.id } });
};

// 頁面初始化：呼叫 API 取得合作夥伴詳細資料
$WebAPI.GetCollaboratorList(
    userStore.token,
    null,
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
      let _data = _res.result[0]
      // 將 API 資料填入各顯示欄位
      createdate.value = _data.createDate
      imgPath.value = _data.imageFile
      title.value = _data.title
      serviceItem.value = _data.serviceItem
      tel.value = _data.tel
      url.value = _data.url
      datastate.value = _data.state
    }
  );
</script>
