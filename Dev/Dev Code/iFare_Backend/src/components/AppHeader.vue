<template>
  <!-- 頂部標題列容器 -->
  <el-header class="section-header">
    <!-- 左側：麵包屑導覽列，顯示目前所在的頁面路徑 -->
    <div class="section-part part-left">
      <el-breadcrumb separator="/">
        <!-- 依照 pageRouters 陣列動態產生麵包屑項目 -->
        <el-breadcrumb-item
          v-for="route in pageRouters"
          :to="{ name: route.url }"
        >
          {{ route.page }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    <!-- 右側：顯示登入帳號名稱及登出按鈕 -->
    <div class="section-part part-right">
      <div class="user-group">
        <el-icon><User /></el-icon>
        <span>{{ actName }}</span>
      </div>
      <el-button @click="logout">登出</el-button>
    </div>
  </el-header>
</template>

<style lang="scss" scoped>
.section-header {
    padding: 0 $padding-LR-header;
    background: #ffffff;
}
.user-group {
  display: inline-flex;
  align-items: center;
  margin: 0 32px;
  & > * {
    margin: 0 4px;
  }
}
</style>

<script setup lang="ts">
/**
 * AppHeader - 後台頂部導覽列元件
 *
 * 功能說明：
 * - 顯示麵包屑導覽，根據當前路由的 meta 資訊自動組成路徑層級
 * - 顯示目前登入使用者的帳號名稱
 * - 提供登出功能，清除 store 並導向登入頁
 *
 * Props：
 * - route：當前路由物件，用於產生麵包屑導覽
 */
import { ref, reactive, onMounted, watch, getCurrentInstance } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  ElHeader,
  ElIcon,
  ElButton,
  ElBreadcrumb,
  ElBreadcrumbItem,
} from "element-plus";
import type { PageRoute } from "@/interface/AppHeader";
import { useUserStore } from "@/stores/user";

// 接收父層傳入的路由資訊
const props = defineProps(["route"]);
// 取得全域注入的共用工具庫
const app = getCurrentInstance();
const $commonLib = app?.appContext.config.globalProperties.$CommonLib;
const userStore = useUserStore()

console.log($commonLib.CopyArrayObj(props));

// 深複製路由物件，避免直接操作 reactive 原始資料
const route = $commonLib.CopyArrayObj(props.route);

// 麵包屑的首頁預設項目
const initPageRoute = {
  page: "首頁",
  url: "Home",
};

// 麵包屑路徑陣列，初始為首頁
const pageRouters = reactive<Array<PageRoute>>([{ ...initPageRoute }]);
console.log($commonLib.CopyArrayObj(pageRouters));

// 顯示於右側的登入使用者名稱
const actName = ref(userStore.userName);

// 訂閱 userStore 的變化，動態同步使用者名稱（例如登入後更新）
userStore.$subscribe(() => {
  actName.value = userStore.userName
})

/**
 * refreshRouteInfo - 根據路由資訊重新建構麵包屑路徑
 * @param _route - 當前路由物件（含 name、meta 等資訊）
 */
function refreshRouteInfo(_route: any) {
  if (!_route) return;
  console.log(_route);

  // 若為首頁則清空麵包屑，否則重設為首頁項目
  $commonLib.ResetObjRef(pageRouters, _route.name != "Home" ? initPageRoute : {});

  // 若有父層標題且當前頁不是父層頁面，則加入父層麵包屑
  if (_route.meta.title_parent && _route.name != _route.meta.urlName_parent) {
    pageRouters.push({
      page: `${_route.meta.title_parent}`,
      url: `${_route.meta.urlName_parent}`,
      url_parent: `${_route.meta.urlName_parent}`,
    });
  }
  // 加入當前頁面的麵包屑項目（首頁不重複加入）
  if (_route.name != "Home" && _route.name) {
    pageRouters.push({
      page: `${_route.meta.title}`,
      url: `${String(_route.name)}`,
    });
  }

  console.log(pageRouters);
}

/**
 * logout - 登出操作
 * 清除 userStore 中的使用者狀態，並導向登入頁面
 */
function logout(){
  userStore.logout()
  $commonLib.GuideToPage('Login')
}

// 元件掛載後，依據初始路由建立麵包屑
onMounted(async () => {
  refreshRouteInfo(route);
});

// 監聽 route prop 變化，當路由切換時重新建構麵包屑
watch(props, async (newProps, oldProps) => {
  console.log("new:", newProps);
  console.log("old:", oldProps);

  refreshRouteInfo(newProps.route);
});
</script>
