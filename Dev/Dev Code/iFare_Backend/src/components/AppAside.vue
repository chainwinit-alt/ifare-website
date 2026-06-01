<template>
  <!-- 側邊欄容器，使用 Element Plus 的 el-aside 元件，套用線性漸層背景樣式 -->
  <el-aside
    class="section-aside"
    :class="{ 'is-collapsed': collapsed }"
    :width="asideWidth"
  >
    <!-- 使用滾動條包裝，避免選單項目過多時超出視窗 -->
    <el-scrollbar>
      <!-- Logo 區塊，顯示系統品牌標題 -->
      <div class="part-home-logo">
        <logoTitle />
      </div>
      <!-- 主選單：啟用路由模式，根據 activeDefault 設定預設選取項目 -->
      <el-menu
        background-color="transparent"
        text-color="#ffffff"
        active-text-color="#ffffff"
        router
        :default-active="activeDefault"
      >
        <!-- 遍歷選單清單，若有 url 直接顯示為一般選單項目，否則顯示為子選單群組 -->
        <template v-for="(item, i) in menuList" :key="item.title">
          <!-- 一般選單項目（無子選單） -->
          <el-menu-item
            :index="item.indexKey"
            v-if="item.url"
            :route="item.url"
          >
            <span>{{ item.title }}</span>
          </el-menu-item>
          <!-- 含子選單的群組項目 -->
          <el-sub-menu :index="item.indexKey" v-else>
            <template #title>{{ item.title }}</template>
            <!-- 子選單項目列表 -->
            <el-menu-item
              v-for="(subItem, j) in item.subList"
              :index="subItem.indexKey"
              :route="subItem.url"
            >
              {{ subItem.title }}
            </el-menu-item>
          </el-sub-menu>
        </template>
      </el-menu>
    </el-scrollbar>
  </el-aside>
</template>

<style lang="scss" scoped>
.section-aside {
  @include linearBgColor;
  height: 100vh;
  transition: width 0.25s ease;
  overflow: hidden;
}

.part-home-logo {
  display: flex;
  justify-content: center;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  margin: 0px 20px 8px;
  padding: 12px 16px;
}

.el-menu {
  border-right: none;
}

.el-menu-item.is-active {
  background-color: var(--el-menu-hover-bg-color);
}
</style>

<script setup lang="ts">
/**
 * AppAside - 後台側邊導覽選單元件
 *
 * 功能說明：
 * - 根據登入使用者的權限等級（檢視者 / 編輯者 / 管理者），動態過濾可顯示的選單項目
 * - 監聽路由變化，自動更新選單的選取狀態
 *
 * Props：
 * - route：當前路由物件，用於同步選單高亮狀態
 */
import { ref, reactive, watch, computed } from "vue";
import {
  ElScrollbar,
  ElAside,
  ElMenu,
  ElSubMenu,
  ElMenuItem,
  ElDivider,
} from "element-plus";
import logoTitle from "../components/icons/IconLogoTitle.vue";
import type { AsideMenu } from "@/interface/AppAside";
import data_AsideMenu from "@/data/AsideMenu.json";
import { useUserStore } from "@/stores/user";

// 接收父層傳入的路由資訊 + sidebar 收合狀態
const props = defineProps(["route", "collapsed"]);
const userStore = useUserStore();

// 收合 = 寬度 0；展開 = 300px（el-aside 預設）
const asideWidth = computed(() => (props.collapsed ? "0px" : "300px"));

// 深複製原始選單設定，避免直接修改原始資料
let _asideMenu = JSON.parse(JSON.stringify(data_AsideMenu))

// 若使用者為「檢視者」，僅保留 permission 為 "All" 的選單項目
if (userStore.permission == "檢視者") {
  _asideMenu = _asideMenu
                .map((p:any) => {
                  if (p.permission == "All") {
                    if (p.subList != null) {
                      // 子選單同樣只保留 "All" 項目
                      p.subList = p.subList.filter((p2:any) => { return p2.permission == "All" })
                    }
                    return p
                  }
                })
                .filter((p:any) => { return p != null})
}

// 若使用者為「編輯者」，保留 "All" 及 "Editor" 權限的選單項目
if (userStore.permission == "編輯者") {
  _asideMenu = _asideMenu
                .map((p:any) => {
                  if (p.permission == "All" || p.permission == "Editor") {
                    if (p.subList != null) {
                      // 子選單保留 "All" 或 "Editor" 項目
                      p.subList = p.subList.filter((p2:any) => { return p.permission == "All" || p2.permission == "Editor" })
                    }
                    return p
                  }
                })
                .filter((p:any) => { return p != null})
}

// 響應式選單清單
const menuList = reactive<Array<AsideMenu>>(_asideMenu);

// 2026-05-25 #29 — 從 route.matched 找有 indexKey 的 ancestor,確保編輯/詳情頁返回後側邊欄正確高亮
//
// 原本只取 props.route.meta.indexKey,但 Vue Router 子路由不會繼承 parent meta,
// 子頁(News_Edit / News_Detail 等)的 meta.indexKey 是 undefined → 高亮失效。
// 改成由內到外掃 matched 陣列,撿第一個有設定的 indexKey 用。
//
// 同時改用 computed 派生,免去 watch + 預設空字串造成的初始 flash。
function resolveIndexKey(route: any): string {
  if (!route) return '';
  // 先看當前 route.meta(對應到 matched 的 leaf)
  if (route.meta?.indexKey) return route.meta.indexKey;
  // 再從 matched chain 由內到外撿
  const matched = route.matched ?? [];
  for (let i = matched.length - 1; i >= 0; i--) {
    const key = matched[i]?.meta?.indexKey;
    if (key) return key as string;
  }
  return '';
}

const activeDefault = computed(() => resolveIndexKey(props.route));

//{ "indexKey": "ImgManager", "title": "圖片管理", "url": {"name": "ImgManager"}, "permission": "Editor" },
</script>
