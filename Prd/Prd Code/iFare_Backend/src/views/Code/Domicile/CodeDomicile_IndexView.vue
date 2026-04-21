<template>
  <!-- ========================================================
    頁面用途：戶籍代碼模組【入口容器頁】
    說明：此頁面作為 Domicile 子路由的容器，
          透過 <RouterView /> 動態渲染子路由對應的頁面
          （如 DataListView、AddEditView 等）
  ======================================================== -->
  <RouterView />
</template>
<script setup lang="ts">
/**
 * 頁面：戶籍代碼模組 Index（路由容器）
 * 模組：Code > Domicile
 * 此頁面無任何業務邏輯，僅作為 Vue Router 的子路由掛載點
 */
import { RouterView} from 'vue-router';
</script>
