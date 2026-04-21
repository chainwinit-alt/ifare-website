<template>
  <main-header>
    <template #btnsLeft>
      <el-button :icon="ArrowLeft" size="large" @click="$router.go(-1)"
        >上一頁</el-button
      >
    </template>
    <template #subtitle v-if="$route.name != 'Articles_Lazy_Add'">
      <sub class="sub-title sub-createDate">{{ createdate }}</sub>
      <sub class="sub-title sub-number">{{ $route.query.id }}</sub>
    </template>
    <template #btnsRight>
      <el-button
        :icon="EditPen"
        size="large"
        type="primary"
        @click="handleClick"
        v-if="userStore.permission != '檢視者'"
        >編輯</el-button
      >
    </template>
  </main-header>
  <el-scrollbar class="main-scrollbar">
    <div
      class="section-main-card card-fullsize card-articles-lazy card-input-format"
    >
      <div class="card-info">
        <div class="item-group-list divider">
          <div class="item-group">
            <label class="input-title">政策類別</label>
            <span class="input-value">{{ codePolicyName }}</span>
          </div>
          <div class="item-group">
            <label class="input-title">關鍵字</label>
            <div class="input-value tag-list">
              <el-tag v-for="tag in codeKeywords"
                      :key="tag.label"
                      :type="tag.type"
                      class="m-tag"
                      effect="plain"
                      round>
                      {{ tag.label }}
                    </el-tag>
            </div>
          </div>
        </div>
        <h3 class="card-item-title">{{ title }}</h3>
        <el-upload class="card-upload show-only"
                  v-model:file-list="imgList"
                  list-type="picture"
                  disabled></el-upload>
      </div>
    </div>
    <div
      class="section-main-card card-fullsize card-articles-lazy card-input-format"
    >
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
import type { UploadProps, UploadUserFile } from "element-plus";
import { EditPen, ArrowLeft } from "@element-plus/icons-vue";
import MainHeader from "@/components/MainHeader.vue";
import type { TagObj } from '@/interface/Component'
import { useUserStore } from "@/stores/user";

const app = getCurrentInstance();
const _global = app?.appContext.config.globalProperties
const $commonLib = app?.appContext.config.globalProperties.$CommonLib;
const $WebAPI = app?.appContext.config.globalProperties.$WebAPI;
const _$route = app?.appContext.config.globalProperties.$route;
const userStore = useUserStore();

const createdate = ref('')
const title = ref('')
const releaseTime = ref('')
const discontinuedTime = ref('')
const datastate = ref('')
const codePolicyName = ref('')
const codeKeywords = reactive<Array<TagObj>>([])

const ids = _$route?.query.id ? [parseInt(_$route?.query.id.toString())] : null

const state = ref("停用");
const keywordList = reactive<Array<TagObj>>([
  { type: '', label: '失業'},
  { type: '', label: '就業'},
  { type: '', label: '特殊待遇'}
]);

const imgList = ref<UploadUserFile[]>([])

const handleClick = () => {
  _global?.$router.push({ name: "Articles_Lazy_Edit", query: { id: _$route?.query.id } });
};

$WebAPI.GetArticlesLazyList(
    userStore.token,
    null,
    null,
    null,
    null,
    null,
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
      codePolicyName.value = _data.codePolicy_LabelName
      codeKeywords.push(..._data.codeKeywordList.map((code:any, i:number) => {
        return { type: "", label: code.labelName == '全選' ? '不限' : code.labelName }
      }))
      imgList.value = _data.imageList.map((_img:any, i:number) => {
        return {
          name: _img.imageName,
          url: _img.imagePath
        }
      })
      releaseTime.value = _data.releaseTime ? _data.releaseTime.replace('T', ' ') : '-'
      discontinuedTime.value = _data.discontinuedTime ? _data.discontinuedTime.replace('T', ' ') : '-'
      datastate.value = _data.state
    }
  );

</script>
