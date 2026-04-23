<template>
  <main-header>
    <template #btnsLeft>
      <el-button :icon="ArrowLeft" size="large" @click="$router.go(-1)"
        >上一頁</el-button
      >
    </template>
    <template #subtitle v-if="$route.name != 'IFare_QA_Add'">
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
    <div
      class="section-main-card card-fullsize card-ifare-qa card-input-format"
    >
      <div class="card-info">
        <div class="item-group">
          <label class="input-title">問題</label>
          <h3 class="input-value">{{ question }}</h3>
        </div>
        <div class="item-group">
          <label class="input-title">答案</label>
          <span class="input-value pre-line">{{ answer }}</span>
        </div>
      </div>
    </div>
    <div
      class="section-main-card card-fullsize card-ifare-qa card-input-format"
    >
      <div class="card-info">
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
import { ElButton, ElScrollbar, ElText } from "element-plus";
import { ArrowLeft, EditPen } from "@element-plus/icons-vue";
import MainHeader from "@/components/MainHeader.vue";
import { useUserStore } from "@/stores/user";

const app = getCurrentInstance();
const _global = app?.appContext.config.globalProperties
const $commonLib = app?.appContext.config.globalProperties.$CommonLib;
const $WebAPI = app?.appContext.config.globalProperties.$WebAPI;
const _$route = app?.appContext.config.globalProperties.$route;
const userStore = useUserStore();

const createdate = ref('')
const question = ref('')
const answer = ref('')
const datastate = ref('')

const handleClick = () => {
  _global?.$router.push({ name: "IFare_QA_Edit", query: { id: _$route?.query.id }});
};

const ids = _$route?.query.id ? [parseInt(_$route?.query.id.toString())] : null

$WebAPI.GetFareQAList(
    userStore.token,
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
      question.value = _data.question
      answer.value = _data.answer
      datastate.value = _data.state
    }
  );
</script>
