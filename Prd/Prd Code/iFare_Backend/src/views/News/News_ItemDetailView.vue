<template>
  <main-header>
    <template #btnsLeft>
      <el-button :icon="ArrowLeft" size="large" @click="$router.go(-1)"
        >上一頁</el-button
      >
    </template>
    <template #subtitle v-if="$route.name != 'News_Add'">
      <sub class="sub-title sub-createDate">{{ createdate }}</sub>
      <sub class="sub-title sub-number">{{ $route.query.id }}</sub>
    </template>
    <template #btnsRight>
      <el-button
        :icon="EditPen"
        size="large"
        type="primary"
        @click="handleClick"
        >編輯</el-button
      >
    </template>
  </main-header>
  <el-scrollbar class="main-scrollbar">
    <div class="section-main-card card-fullsize card-news card-input-format">
      <div class="card-info">
        <h2 class="raw-html">{{ title }}</h2>
        <div class="raw-html" v-html="detail">
        </div>
      </div>
    </div>
    <div class="section-main-card card-fullsize card-news card-input-format">
      <div class="card-info">
        <div class="item-group-list">
          <div class="item-group">
            <label class="input-title">上架日期</label>
            <span class="input-value">{{ releaseTime }}</span>
          </div>
          <div class="item-group">
            <label class="input-title">下架日期</label>
            <span class="input-value">{{ discontinuedTime }}</span>
          </div>
        </div>
        <div class="item-group">
          <label class="input-title">資料狀態</label>
          <el-text
            class="input-value"
            :type="datastate == '停用' ? 'danger' : ''"
            >{{ datastate }}</el-text
          >
        </div>
      </div>
    </div>
  </el-scrollbar>
</template>
<script setup lang="ts">
import { ref, reactive, getCurrentInstance } from "vue";
import { ElButton, ElScrollbar, ElText, ElTag, ElUpload } from "element-plus";
import { EditPen, ArrowLeft } from "@element-plus/icons-vue";
import MainHeader from "@/components/MainHeader.vue";
import { useUserStore } from "@/stores/user";

const app = getCurrentInstance();
const _global = app?.appContext.config.globalProperties
const $commonLib = app?.appContext.config.globalProperties.$CommonLib;
const $WebAPI = app?.appContext.config.globalProperties.$WebAPI;
const _$route = app?.appContext.config.globalProperties.$route;
const userStore = useUserStore();

const createdate = ref('')
const title = ref('')
const detail = ref('')
const releaseTime = ref('')
const discontinuedTime = ref('')
const datastate = ref('')

const handleClick = () => {
  _global?.$router.push({ name: "News_Edit", query: { id: _$route?.query.id } });
};

const ids = _$route?.query.id ? [parseInt(_$route?.query.id.toString())] : null

$WebAPI.GetNewsList(
    userStore.token,
    null,
    null,
    null,
    null,
    null,
    ids,
    (res: any) => {
      console.log(res);
      let _resData = res.data || "error";
      if (_resData == "error") return console.error(`API res ${_resData}`);

      let _res = _resData.result;

      if (_res.errCode != 0) return console.error(_res.errMsg);

      const _data = _res.result[0]
      createdate.value = _data.createDate
      title.value = _data.title
      //@ts-ignore
      detail.value = decodeURIComponent(_data.detail).replaceAll("https://drive.google.com/uc?export=download&", "https://drive.google.com/thumbnail?sz=w800&")
      releaseTime.value = _data.releaseTime ? _data.releaseTime.replace('T', ' ') : '-'
      discontinuedTime.value = _data.discontinuedTime ? _data.discontinuedTime.replace('T', ' ') : '-'
      datastate.value = _data.state
    }
  )
</script>
