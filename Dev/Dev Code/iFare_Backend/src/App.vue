<template class="Test">
  <!-- 最外層容器，撐滿整個視窗 -->
  <el-container class="section-app">
    <!-- 側邊欄：登入頁面不顯示，傳入目前路由資訊供選單高亮使用 -->
    <AppAside v-if="$route.name != 'Login'" :route="$route"></AppAside>

    <!-- 右側主要區域（垂直排列：頁首 + 主內容） -->
    <el-container class="section-container is-vertical">
      <!-- 頁首導航列：登入頁面不顯示 -->
      <AppHeader v-if="$route.name != 'Login'" :route="$route"></AppHeader>

      <!-- 主內容區：登入頁面套用 main-Login 樣式（無內距），一般頁面套用 section-main -->
      <el-main
        :class="{ 'section-main': true, 'main-Login': $route.name == 'Login' }"
      >
        <!-- 品牌 Logo 背景裝飾圖（固定定位於右下角，半透明） -->
        <logo class="ic-login-bg" />

        <!-- 一般功能頁面：包裹在 part-main 容器中，留出頁首高度的上方空白 -->
        <template v-if="$route.name != 'Login'">
          <div class="part-main">
            <RouterView />
          </div>
        </template>

        <!-- 登入頁面：直接渲染，不加額外容器 -->
        <template v-else>
          <RouterView />
        </template>
      </el-main>
    </el-container>
  </el-container>
</template>

<style lang="scss" scoped>
/* 最外層容器：撐滿寬高 */
.section-app {
  width: 100%;
  height: 100%;
}
/* 右側縱向容器：佔滿視窗高度 */
.section-container{
  height: 100vh;
}
/* 一般功能頁面主內容區樣式 */
.section-main {
  background-color: #f2f3f5;
  padding: 0 $padding-LR-header 16px;

  /* 登入頁面無內距，讓登入表單可完整撐滿 */
  &.main-Login {
    padding: 0;
  }
}
/* 功能頁面內容包裹容器：使用 ::before 偽元素撐出固定頁首的佔位高度 */
.part-main {
  position: relative;
  height: calc(100% - 96px);
  &::before {
    content: "";
    display: block;
    width: 100%;
    height: $height-main-header; /* 對應固定定位頁首的高度，避免內容被遮蔽 */
  }
}
/* 品牌 Logo 背景裝飾：固定於右下角，半透明，不影響操作 */
.ic-login-bg {
  position: fixed;
  bottom: calc(-50vw / 2);
  right: -20px;
  width: 50vw;
  height: auto;
  opacity: 0.4;
}
</style>

<script setup lang="ts">
/**
 * App.vue
 * iFare 後台管理系統根元件
 * 定義整體版面結構：側邊欄（AppAside）、頁首（AppHeader）、主內容（RouterView）
 * 登入頁面會隱藏側邊欄與頁首，呈現全頁登入畫面
 */
import { RouterLink, RouterView } from "vue-router";
import { ElContainer, ElMain, ElScrollbar } from "element-plus";
// 側邊欄選單元件
import AppAside from "./components/AppAside.vue";
// 頁首導航列元件
import AppHeader from "./components/AppHeader.vue";
// 品牌 Logo SVG 元件（用作背景裝飾）
import logo from "@/components/icons/IconLogo.vue";
</script>
