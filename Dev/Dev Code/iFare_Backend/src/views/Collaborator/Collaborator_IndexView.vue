<template>
  <!-- 合作夥伴模組的根容器視圖 -->
  <!-- 作為巢狀路由的佔位元件，子路由（DataList、ItemDetail、Add、Edit）會渲染於此 -->
  <RouterView />
</template>
<script setup lang="ts">
/**
 * 頁面用途：合作夥伴模組 Index 路由容器
 * - 本檔案僅作為巢狀路由的父層容器，不含任何業務邏輯
 * - 子路由包含：列表頁、詳情頁、新增頁、編輯頁
 */
import { RouterView} from 'vue-router';
</script>
