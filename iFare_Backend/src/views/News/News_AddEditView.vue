<template>
  <main-header>
    <template #subtitle v-if="$route.name == 'News_Edit'">
      <sub class="sub-title sub-createDate">{{ createdate }}</sub>
      <sub class="sub-title sub-number">{{$route.query.id}}</sub>
    </template>
    <template #btnsRight>
      <el-button
        :icon="Close"
        size="large"
        @click="$router.go(-1)"
        >取消</el-button
      >
      <el-button
        :icon="Check"
        size="large"
        type="primary"
        @click="SaveAction"
        >儲存</el-button
      >
    </template>
  </main-header>
  <el-scrollbar class="main-scrollbar">
    <div class="section-main-card card-fullsize card-news card-input-format">
      <div class="card-info">
        <div class="item-group">
          <label class="item-title required" style="min-width: 50px;">標題</label>
          <el-input
            class="p-input full-width"
            v-model="input_title"
            type="text"
            size="large"
            placeholder="請輸入標題"
          />
        </div>
        <div class="item-group full-width html-editor">
          <html-editor v-model:editorValue="editorValue"/>
        </div>
      </div>
    </div>
    <div class="section-main-card card-fullsize card-news card-input-format">
      <div class="card-info">
        <div class="item-group-list">
          <div class="item-group">
            <label class="item-title">上架日期</label>
            <el-date-picker
              v-model="datepicker_release"
              type="datetime"
              format="YYYY/MM/DD HH:mm"
              size="large"
            />
          </div>
          <div class="item-group">
            <label class="item-title">下架日期</label>
            <el-date-picker
              v-model="datepicker_discontinued"
              type="datetime"
              format="YYYY/MM/DD HH:mm"
              size="large"
            />
          </div>
        </div>
        <div class="item-group">
          <label class="item-title required">資料狀態</label>
          <el-switch
            v-model="switch_state"
            size="large"
            active-text="啟用"
            inactive-text="停用"
          />
        </div>
      </div>
    </div>
  </el-scrollbar>
</template>
<script setup lang="ts">
import MainHeader from "@/components/MainHeader.vue";
import { ref, reactive, watch, getCurrentInstance } from "vue";
import {
  ElButton,
  ElScrollbar,
  ElInput,
  ElSwitch,
  ElDatePicker,
} from "element-plus";
import { Close, Check } from "@element-plus/icons-vue";
import HtmlEditor from '@/components/CompHtmlEditor.vue'
import { useUserStore } from "@/stores/user";
import { useRouter } from "vue-router";

const app = getCurrentInstance();
const $commonLib = app?.appContext.config.globalProperties.$CommonLib;
const $WebAPI = app?.appContext.config.globalProperties.$WebAPI;
const _$route = app?.appContext.config.globalProperties.$route;
const _router = useRouter();
const userStore = useUserStore();
const $Message = app?.appContext.config.globalProperties.$message;

const routeNameType = _$route?.name?.toString().toLocaleLowerCase() || "";
const ids = _$route?.query.id ? [parseInt(_$route?.query.id.toString())] : null
const createdate = ref("")

const switch_state = ref(true);

const input_title = ref("");

const datepicker_release = ref();
const datepicker_discontinued = ref();

const editorValue = ref()

if (routeNameType.indexOf("edit") >= 0) {
  $WebAPI.GetNewsList(userStore.token, null, null, null, null, null, ids, (res:any) => {
    let _resData = res.data || "error";
    if (_resData == "error") return console.error(`API res ${_resData}`);

    let _res = _resData.result;
    if (_res.errCode != 0) return console.error(_res.errMsg);
    if (_res.result.length <= 0) return console.error("No Datas.")
    createdate.value = _res.result[0].createDate
    input_title.value = _res.result[0].title
    //@ts-ignore
    editorValue.value = decodeURIComponent(_res.result[0].detail).replaceAll("https://drive.google.com/uc?export=download&", "https://drive.google.com/thumbnail?sz=w800&")
    datepicker_release.value = _res.result[0].releaseTime
    datepicker_discontinued.value = _res.result[0].discontinuedTime
    switch_state.value = _res.result[0].state == "啟用"
  })
}

function SaveAction() {
  console.log(datepicker_release.value)
  const _title = input_title.value
  const _detail = encodeURIComponent(editorValue.value.replaceAll("https://drive.google.com/uc?export=download&", "https://drive.google.com/thumbnail?sz=w800&"))
  const _releaseTime = datepicker_release.value.toLocaleString('sv')
  const _discontinuedTime = datepicker_discontinued.value.toLocaleString('sv')
  const _state = switch_state.value

  if (!_title) {
    return $Message({ message: `【標題】不可為空`, type: "warning" })
  }

  if (routeNameType.indexOf("add") >= 0) {
    console.log("[Add] Save action");
    $WebAPI.InsertNews(userStore.token, _title, _detail, _releaseTime, _discontinuedTime, _state,(res: any) => {
        let _resData = res.data || "error";
        if (_resData == "error") {
          $Message({ message: `API res ${_resData}`, type: "error" })
          return console.error(`API res ${_resData}`);
        }

        let _res = _resData.result;
        if (_res.errCode != 0) {
          $Message({ message: _res.errMsg, type: "error" })
          return console.error(_res.errMsg);
        }

        $Message({ message: '新增成功', type: "success" })
        $commonLib.GuideToPage('News_DataList')
      }
    );
  }

  if (routeNameType.indexOf("edit") >= 0) {
    console.log("[Edit] Save action");
    const _id = ids? ids[0] : 0
    if (_id == 0) return false
    $WebAPI.UpdateNews(userStore.token, _id, _title, _detail, _releaseTime, _discontinuedTime, _state,(res: any) => {
        let _resData = res.data || "error";
        if (_resData == "error") {
          $Message({ message: `API res ${_resData}`, type: "error" })
          return console.error(`API res ${_resData}`);
        }

        let _res = _resData.result;
        if (_res.errCode != 0) {
          $Message({ message: _res.errMsg, type: "error" })
          return console.error(_res.errMsg);
        }

        $Message({ message: '編輯成功', type: "success" })
        // $commonLib.GuideToPage('News_DataList')
        _router.back();
      }
    );
  }
}
</script>
