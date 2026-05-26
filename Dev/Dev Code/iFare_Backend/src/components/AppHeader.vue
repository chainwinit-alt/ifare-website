<template>
  <!-- 頂部標題列容器 -->
  <el-header class="section-header">
    <!-- 左側：sidebar 收放按鈕 + 麵包屑導覽列 -->
    <div class="section-part part-left">
      <el-button
        class="btn-sidebar-toggle"
        :icon="collapsed ? Expand : Fold"
        circle
        plain
        :title="collapsed ? '展開選單' : '收合選單'"
        @click="emit('toggle-sidebar')"
      />
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
.btn-sidebar-toggle {
  margin-right: 12px;
  flex-shrink: 0;
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
import { Expand, Fold, User } from "@element-plus/icons-vue";
import type { PageRoute } from "@/interface/AppHeader";
import { useUserStore } from "@/stores/user";

// 接收父層傳入的路由資訊 + sidebar 收合狀態；對外發出 toggle-sidebar 事件
const props = defineProps(["route", "collapsed"]);
const emit = defineEmits(["toggle-sidebar"]);
// 取得全域注入的共用工具庫
const app = getCurrentInstance();
const $commonLib = app?.appContext.config.globalProperties.$CommonLib;
const userStore = useUserStore()


// 深複製路由物件，避免直接操作 reactive 原始資料
const route = $commonLib.CopyArrayObj(props.route);

// 麵包屑的首頁預設項目
const initPageRoute = {
  page: "首頁",
  url: "Home",
};

// 麵包屑路徑陣列，初始為首頁
const pageRouters = reactive<Array<PageRoute>>([{ ...initPageRoute }]);

// 顯示於右側的登入使用者名稱
const actName = ref(userStore.userName);

// 訂閱 userStore 的變化，動態同步使用者名稱（例如登入後更新）
userStore.$subscribe(() => {
  actName.value = userStore.userName
})

/**
 * refreshRouteInfo - 根據路由資訊重新建構麵包屑
 * @param _route - 當前路由物件（含 name、meta 等資訊）
 *
 * 2026-05-25 #30 — 多層子路由路徑修正
 * 原本只看 _route.meta.title_parent；但 Vue Router 子路由不繼承 parent meta,
 * 例如 News_Detail 的 meta 裡沒有 title_parent（只有 News_Index parent route 有）。
 * 改成從 _route.matched 由內到外掃,撿第一個有 title_parent 的祖先 meta,
 * 確保編輯/詳情等子頁能正確顯示中間層「XXX 維護」。
 */
function refreshRouteInfo(_route: any) {
  if (!_route) return;

  // 若為首頁則清空麵包屑，否則重設為首頁項目
  $commonLib.ResetObjRef(pageRouters, _route.name != "Home" ? initPageRoute : {});

  // 先看當前 route.meta；沒有就從 matched chain 由內到外找 parent meta
  let parentTitle: string | undefined = _route.meta?.title_parent;
  let parentUrl: string | undefined = _route.meta?.urlName_parent;
  if (!parentTitle) {
    const matched = _route.matched ?? [];
    for (let i = matched.length - 1; i >= 0; i--) {
      const m = matched[i];
      if (m?.meta?.title_parent) {
        parentTitle = m.meta.title_parent as string;
        parentUrl = m.meta.urlName_parent as string;
        break;
      }
    }
  }

  // 若有父層標題且當前頁不是父層頁面，則加入父層麵包屑
  if (parentTitle && _route.name != parentUrl) {
    pageRouters.push({
      page: parentTitle,
      url: parentUrl ?? '',
      url_parent: parentUrl ?? '',
    });
  }
  // 加入當前頁面的麵包屑項目（首頁不重複加入）
  if (_route.name != "Home" && _route.name) {
    pageRouters.push({
      page: `${_route.meta.title}`,
      url: `${String(_route.name)}`,
    });
  }
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

  refreshRouteInfo(newProps.route);
});
</script>
