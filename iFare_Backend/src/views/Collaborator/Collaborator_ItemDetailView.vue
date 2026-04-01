<template>
  <main-header>
    <template #btnsLeft>
      <el-button :icon="ArrowLeft" size="large" @click="$router.go(-1)"
        >上一頁</el-button
      >
    </template>
    <template #subtitle v-if="$route.name != 'Collaborator_Add'">
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
      class="section-main-card card-fullsize card-collaborator card-input-format"
    >
      <div class="card-info">
        <div class="item-group">
          <div class="input-title">
            <el-image :src="imgPath"/>
          </div>
          <h3 class="input-value">{{ title }}</h3>
        </div>
        <div class="item-group">
          <label class="input-title">服務項目</label>
          <span class="input-value">{{serviceItem}}</span>
        </div>
        <div class="item-group">
          <label class="input-title">電話</label>
          <span class="input-value">{{ tel }}</span>
        </div>
        <div class="item-group">
          <label class="input-title">連結</label>
          <el-link :href="url.indexOf('http') < 0 ? `https://${url}` : url" target="_blank">{{ url }}</el-link>
        </div>
      </div>
    </div>
    <div
      class="section-main-card card-fullsize card-collaborator card-input-format"
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
import { ElButton, ElScrollbar, ElText, ElLink, ElImage } from "element-plus";
import { ArrowLeft, EditPen } from "@element-plus/icons-vue";
import MainHeader from "@/components/MainHeader.vue";
import _image from "@/assets/img/image.png"
import { useUserStore } from "@/stores/user";

const app = getCurrentInstance();
const _global = app?.appContext.config.globalProperties
const $commonLib = app?.appContext.config.globalProperties.$CommonLib;
const $WebAPI = app?.appContext.config.globalProperties.$WebAPI;
const _$route = app?.appContext.config.globalProperties.$route;
const userStore = useUserStore();

const createdate = ref('')
const title = ref('')
const serviceItem = ref('')
const imgPath = ref('')
const tel = ref('')
const url = ref('')
const datastate = ref('')

const ids = _$route?.query.id ? [parseInt(_$route?.query.id.toString())] : null

const handleClick = () => {
  _global?.$router.push({ name: "Collaborator_Edit", query: { id: _$route?.query.id } });
};

$WebAPI.GetCollaboratorList(
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
      let _data = _res.result[0]
      createdate.value = _data.createDate
      imgPath.value = _data.imageFile
      title.value = _data.title
      serviceItem.value = _data.serviceItem
      tel.value = _data.tel
      url.value = _data.url
      datastate.value = _data.state
    }
  );
</script>
