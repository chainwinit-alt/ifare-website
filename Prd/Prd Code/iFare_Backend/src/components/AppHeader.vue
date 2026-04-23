<template>
  <el-header class="section-header">
    <div class="section-part part-left">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item
          v-for="route in pageRouters"
          :to="{ name: route.url }"
        >
          {{ route.page }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>
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

const props = defineProps(["route"]);
const app = getCurrentInstance();
const $commonLib = app?.appContext.config.globalProperties.$CommonLib;
const userStore = useUserStore()

console.log($commonLib.CopyArrayObj(props));

const route = $commonLib.CopyArrayObj(props.route);
const initPageRoute = {
  page: "首頁",
  url: "Home",
};
const pageRouters = reactive<Array<PageRoute>>([{ ...initPageRoute }]);
console.log($commonLib.CopyArrayObj(pageRouters));
const actName = ref(userStore.userName);

userStore.$subscribe(() => {
  actName.value = userStore.userName
})

function refreshRouteInfo(_route: any) {
  if (!_route) return;
  console.log(_route);

  $commonLib.ResetObjRef(pageRouters, _route.name != "Home" ? initPageRoute : {});

  if (_route.meta.title_parent && _route.name != _route.meta.urlName_parent) {
    pageRouters.push({
      page: `${_route.meta.title_parent}`,
      url: `${_route.meta.urlName_parent}`,
      url_parent: `${_route.meta.urlName_parent}`,
    });
  }
  if (_route.name != "Home" && _route.name) {
    pageRouters.push({
      page: `${_route.meta.title}`,
      url: `${String(_route.name)}`,
    });
  }

  console.log(pageRouters);
}

function logout(){
  userStore.logout()
  $commonLib.GuideToPage('Login')
}

onMounted(async () => {
  refreshRouteInfo(route);
});

watch(props, async (newProps, oldProps) => {
  console.log("new:", newProps);
  console.log("old:", oldProps);

  refreshRouteInfo(newProps.route);
});
</script>
