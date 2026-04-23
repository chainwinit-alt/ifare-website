<template class="Test">
  <el-container class="section-app">
    <AppAside v-if="$route.name != 'Login'" :route="$route"></AppAside>
    <el-container class="section-container is-vertical">
      <AppHeader v-if="$route.name != 'Login'" :route="$route"></AppHeader>
      <el-main
        :class="{ 'section-main': true, 'main-Login': $route.name == 'Login' }"
      >
        <logo class="ic-login-bg" />
        <template v-if="$route.name != 'Login'">
          <div class="part-main">
            <RouterView />
          </div>
        </template>
        <template v-else>
          <RouterView />
        </template>
      </el-main>
    </el-container>
  </el-container>
</template>

<style lang="scss" scoped>
.section-app {
  width: 100%;
  height: 100%;
}
.section-container{
  height: 100vh;
}
.section-main {
  background-color: #f2f3f5;
  padding: 0 $padding-LR-header 16px;

  &.main-Login {
    padding: 0;
  }
}
.part-main {
  position: relative;
  height: calc(100% - 96px);
  &::before {
    content: "";
    display: block;
    width: 100%;
    height: $height-main-header;
  }
}
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
import { RouterLink, RouterView } from "vue-router";
import { ElContainer, ElMain, ElScrollbar } from "element-plus";
import AppAside from "./components/AppAside.vue";
import AppHeader from "./components/AppHeader.vue";
import logo from "@/components/icons/IconLogo.vue";
</script>
