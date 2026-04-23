<template>
  <el-aside class="section-aside">
    <el-scrollbar>
      <div class="part-home-logo">
        <logoTitle />
      </div>
      <el-menu
        background-color="transparent"
        text-color="#ffffff"
        active-text-color="#ffffff"
        router
        :default-active="activeDefault"
      >
        <template v-for="(item, i) in menuList" :key="item.title">
          <el-menu-item
            :index="item.indexKey"
            v-if="item.url"
            :route="item.url"
          >
            <span>{{ item.title }}</span>
          </el-menu-item>
          <el-sub-menu :index="item.indexKey" v-else>
            <template #title>{{ item.title }}</template>
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
import { ref, reactive, watch } from "vue";
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

const props = defineProps(["route"]);
const userStore = useUserStore();
let _asideMenu = JSON.parse(JSON.stringify(data_AsideMenu))

if (userStore.permission == "檢視者") {

  _asideMenu = _asideMenu
                .map((p:any) => {
                  if (p.permission == "All") {
                    if (p.subList != null) {
                      p.subList = p.subList.filter((p2:any) => { return p2.permission == "All" })
                    }
                    return p
                  }
                })
                .filter((p:any) => { return p != null})
}

if (userStore.permission == "編輯者") {
  _asideMenu = _asideMenu
                .map((p:any) => {
                  if (p.permission == "All" || p.permission == "Editor") {
                    if (p.subList != null) {
                      p.subList = p.subList.filter((p2:any) => { return p.permission == "All" || p2.permission == "Editor" })
                    }
                    return p
                  }
                })
                .filter((p:any) => { return p != null})
}

const menuList = reactive<Array<AsideMenu>>(_asideMenu);
const activeDefault = ref('')

watch(props, async (newProps, oldProps) => {
  console.log("new:", newProps);
  console.log("old:", oldProps);
  activeDefault.value = newProps.route.meta.indexKey
});

//{ "indexKey": "ImgManager", "title": "圖片管理", "url": {"name": "ImgManager"}, "permission": "Editor" },
</script>
