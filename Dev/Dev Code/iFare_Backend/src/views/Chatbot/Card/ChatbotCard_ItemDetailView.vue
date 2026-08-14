<template>
  <main-header>
    <template #btnsLeft>
      <el-button :icon="ArrowLeft" size="large" @click="$router.go(-1)"
        >上一頁</el-button
      >
    </template>
    <template #subtitle>
      <sub class="sub-title sub-createDate">{{ createdate }}</sub>
      <sub class="sub-title sub-number">{{ $route.query.id }}</sub>
    </template>
    <template #btnsRight>
      <el-button :icon="EditPen" size="large" type="primary" @click="handleClick"
        >編輯</el-button
      >
    </template>
  </main-header>
  <el-scrollbar class="main-scrollbar">
    <div class="section-main-card card-fullsize card-input-format">
      <div class="card-info">
        <div class="item-group">
          <label class="input-title">主題</label>
          <h3 class="input-value">{{ title }}</h3>
        </div>
        <div class="item-group">
          <label class="input-title">卡片代號</label>
          <span class="input-value">{{ cardKey }}</span>
        </div>
        <div class="item-group">
          <label class="input-title">可能的問法</label>
          <span class="input-value pre-line">{{ keywords }}</span>
        </div>
        <div class="item-group">
          <label class="input-title">芒寶的回答</label>
          <span class="input-value pre-line">{{ answer }}</span>
        </div>
      </div>
    </div>
    <div class="section-main-card card-fullsize card-input-format">
      <div class="card-info">
        <div class="item-group">
          <label class="input-title">附帶的站內連結</label>
          <span class="input-value">{{ linkLabels || "－" }}</span>
        </div>
        <div class="item-group">
          <label class="input-title">比對權重</label>
          <span class="input-value">{{ priority }}</span>
        </div>
        <div class="item-group">
          <label class="input-title">排序</label>
          <span class="input-value">{{ sort }}</span>
        </div>
        <div class="item-group">
          <label class="input-title">資料狀態</label>
          <el-text class="input-value" :type="datastate == '停用' ? 'danger' : ''">{{
            datastate
          }}</el-text>
        </div>
      </div>
    </div>
  </el-scrollbar>
</template>
<script setup lang="ts">
import { ref, computed, getCurrentInstance } from "vue";
import { ElButton, ElScrollbar, ElText } from "element-plus";
import { ArrowLeft, EditPen } from "@element-plus/icons-vue";
import MainHeader from "@/components/MainHeader.vue";
import { useUserStore } from "@/stores/user";

const app = getCurrentInstance();
const _global = app?.appContext.config.globalProperties;
const $WebAPI = app?.appContext.config.globalProperties.$WebAPI;
const _$route = app?.appContext.config.globalProperties.$route;
const userStore = useUserStore();

const LINK_LABELS: Record<string, string> = {
  home: "回到首頁",
  about: "關於長穩",
  news: "最新消息",
  articles: "福利專欄",
  collaborator: "公益夥伴",
  ifare: "i-Fare 福利政策",
};

const createdate = ref("");
const title = ref("");
const cardKey = ref("");
const keywords = ref("");
const answer = ref("");
const linkKeys = ref("");
const priority = ref(1);
const sort = ref(0);
const datastate = ref("");

const linkLabels = computed(() =>
  linkKeys.value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item)
    .map((item) => LINK_LABELS[item] || item)
    .join("、")
);

const handleClick = () => {
  _global?.$router.push({
    name: "Chatbot_Card_Edit",
    query: { id: _$route?.query.id },
  });
};

const ids = _$route?.query.id ? [parseInt(_$route?.query.id.toString())] : null;

$WebAPI.GetChatbotCardList(
  userStore.token,
  null,
  null,
  null,
  null,
  ids,
  (res: any) => {
    let _resData = res.data || "error";
    if (_resData == "error") return console.error(`API res ${_resData}`);

    let _res = _resData.result;

    if (_res.errCode != 0) return console.error(_res.errMsg);
    const _data = _res.result[0];
    createdate.value = _data.createDate;
    title.value = _data.title;
    cardKey.value = _data.cardKey;
    keywords.value = _data.keywords;
    answer.value = _data.answer;
    linkKeys.value = _data.linkKeys || "";
    priority.value = _data.priority;
    sort.value = _data.sort;
    datastate.value = _data.state;
  }
);
</script>
