<template>
  <!--
    網站頁首元件（AppHeader）
    包含：
    - 桌機版導覽列（Logo、主選單、i-Fare 按鈕、漢堡選單按鈕）
    - 行動版側拉選單（mobile-menu）

    name 屬性依路由切換樣式主題：
      - "index"：首頁深色主題
      - "indexIFare"：i-Fare 頁主題
      - "other"：其他頁面淺色主題
  -->
  <header
    class="app-header"
    :name="
      ($route.name != 'index' && !$route.name?.toString().includes('ifare'))
        ? 'other'
        : $route.name == 'index' || $route.name?.toString().includes('contact')
        ? $route.name
        : 'indexIFare'
    "
  >
    <div class="row">
      <!-- Logo 區塊：點擊返回首頁 -->
      <div class="part part-icon">
        <NuxtLink class="no-userselect" to="/">
          <!-- Logo 圖示：依路由切換白色/深色版本 -->
          <i
            class="ic-logo app-icon"
            :name="
              ($route.name != 'index' &&
                !$route.name?.toString().includes('ifare')) ||
              $route.name?.toString().includes('contact')
                ? 'other'
                : 'indexIFare'
            "
          ></i>
          <!-- Logo 文字標題 -->
          <h4
            class="ic-logo-title app-icon-title"
            :name="
              ($route.name != 'index' &&
                !$route.name?.toString().includes('ifare')) ||
              $route.name?.toString().includes('contact')
                ? 'other'
                : 'indexIFare'
            "
          ></h4>
        </NuxtLink>
      </div>

      <!-- 桌機版主導覽選單 -->
      <nav class="part part-nav">
        <ul
          class="list-unstyled"
          :name="
            ($route.name != 'index' &&
              !$route.name?.toString().includes('ifare')) ||
            $route.name?.toString().includes('contact')
              ? 'other'
              : 'indexIFare'
          "
        >
          <!-- 各導覽項目：active class 標示當前所在頁面 -->
          <li :class="{ active: $route.name == 'about' }">
            <NuxtLink to="/about">關於長穩</NuxtLink>
          </li>
          <li :class="{ active: $route.name == 'news' }">
            <NuxtLink to="/news">最新消息</NuxtLink>
          </li>
          <li :class="{ active: $route.name == 'articles' }">
            <NuxtLink to="/articles">福利專欄</NuxtLink>
          </li>
          <li :class="{ active: $route.name == 'collaborator' }">
            <NuxtLink to="/collaborator">公益夥伴</NuxtLink>
          </li>
          <!-- i-Fare 特殊樣式按鈕 -->
          <li>
            <NuxtLink
              to="/ifare"
              class="btn btn-empty-oval transition-general btn-ifare"
              >i-Fare</NuxtLink
            >
          </li>
        </ul>
      </nav>

      <!-- 行動版漢堡選單按鈕：點擊切換 isShowMenu 狀態 -->
      <div class="part part-menu">
        <button
          class="btn btn-icon btn-menu no-userselect"
          @click="MenuToggle"
          :name="
            ($route.name != 'index' &&
              !$route.name?.toString().includes('ifare')) ||
            $route.name?.toString().includes('contact')
              ? 'other'
              : 'indexIFare'
          "
        >
          <i class="ic-menu"></i>
        </button>
      </div>
    </div>
  </header>

  <!-- 行動版側拉選單：active class 控制顯示/隱藏動畫 -->
  <div class="mobile-menu" :class="{ active: isShowMenu }">
    <ul class="list-unstyled menu-list">
      <!-- 行動版導覽連結：點擊後自動關閉選單 -->
      <li :class="{ active: $route.name == 'about'}">
        <NuxtLink class="mobileNav-link" to="/about" @click="MenuToggle"
          >關於長穩</NuxtLink
        >
      </li>
      <li :class="{ active: $route.name == 'news'}">
        <NuxtLink class="mobileNav-link" to="/news" @click="MenuToggle"
          >最新消息</NuxtLink
        >
      </li>
      <li :class="{ active: $route.name == 'articles'}">
        <NuxtLink class="mobileNav-link" to="/articles" @click="MenuToggle"
          >福利專欄</NuxtLink
        >
      </li>
      <li :class="{ active: $route.name == 'ifare'}">
        <NuxtLink class="mobileNav-link" to="/ifare" @click="MenuToggle"
          >i-Fare</NuxtLink
        >
      </li>
      <li :class="{ active: $route.name == 'collaborator'}">
        <NuxtLink class="mobileNav-link" to="/collaborator" @click="MenuToggle"
          >公益夥伴</NuxtLink
        >
      </li>
    </ul>

    <!-- 行動選單底部：Logo 首頁連結、Facebook、LINE 社群連結 -->
    <section class="section-menu-share">
      <div class="group-share">
        <NuxtLink class="btn btn-icon" to="/" @click="MenuToggle">
          <i class="ic-mobile-menu-logo"></i>
        </NuxtLink>
        <a class="btn btn-icon" href="https://www.facebook.com/ccfIfare">
          <i class="ic-mobile-share-facebook"></i>
        </a>
        <a class="btn btn-icon" href="https://lin.ee/eHw9VpL">
          <i class="ic-mobile-share-line"></i>
        </a>
      </div>
    </section>

    <!-- 行動選單右上角關閉按鈕 -->
    <section class="section-right-top">
      <button class="btn btn-icon btn-close" @click="MenuToggle">
        <i class="ic-close"></i>
      </button>
    </section>
  </div>
</template>

<script setup lang="ts">
// 行動選單的開/關狀態
const isShowMenu = ref(false);

// 定義向父層（default.vue）發出的事件，通知選單開關狀態
const emits = defineEmits(["isOpened"]);

/**
 * 切換行動選單的顯示/隱藏狀態
 * 同時向父元件發送 isOpened 事件，以便控制 body overflow
 */
function MenuToggle() {
  isShowMenu.value = !isShowMenu.value;
  emits("isOpened", isShowMenu.value)
}
</script>
