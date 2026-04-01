<template>
  <main-header>
    <template #subtitle v-if="$route.name == 'Articles_Welfare_Edit'">
      <sub class="sub-title sub-createDate">{{ createdate }}</sub>
      <sub class="sub-title sub-number">{{ $route.query.id }}</sub>
    </template>
    <template #btnsRight>
      <el-button
        :icon="Close"
        color="white"
        size="large"
        @click="$router.go(-1)"
        >取消</el-button
      >
      <el-button
        :icon="Check"
        type="primary"
        size="large"
        @click="SaveAction"
        >儲存</el-button
      >
    </template>
  </main-header>
  <el-scrollbar class="main-scrollbar">
    <div
      class="section-main-card card-fullsize card-articles-welfare card-input-format"
    >
      <div class="card-info">
        <div class="item-group-list">
          <div class="item-group">
            <label class="item-title required" style="min-width: 76px;">政策類別</label>
            <el-select v-model="codePolicyID" class="p-select" size="large">
              <el-option 
                v-for="item in codePoliceList"
                :key="item.value"
                :label="item.label"
                :value="item.value"/>
            </el-select>
          </div>
          <div class="item-group full-width">
            <label class="item-title required" style="min-width: 76px;">關鍵字</label>
            <el-select 
              v-model="codeKeywordIDs" 
              class="p-select" 
              size="large"
              :multiple="true"
              :multiple-limit="3"
              collapse-tags
              collapse-tags-tooltip
              filterable
              clearable>
              <el-option 
                v-for="item in codeKeywordList"
                :key="item.value"
                :label="item.label"
                :value="item.value"/>
            </el-select>
          </div>
        </div>
        <div class="item-group full-width">
          <label class="item-title required" style="min-width: 76px;">標題</label>
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
    <div class="section-main-card card-fullsize card-articles-welfare card-input-format">
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
import { ref, reactive, getCurrentInstance } from "vue";
import {
  ElInput,
  ElButton,
  ElSelect,
  ElSwitch,
  ElDatePicker,
  ElScrollbar,
  ElUpload,
} from "element-plus";
import type { UploadProps, UploadUserFile } from "element-plus";
import { Close, Check } from "@element-plus/icons-vue";
import MainHeader from "@/components/MainHeader.vue";
import HtmlEditor from '@/components/CompHtmlEditor.vue'
import { useUserStore } from "@/stores/user";
import type { SelectOption } from "@/interface/SelectOptions";
import { useRouter, useRoute } from "vue-router";

const app = getCurrentInstance();
const $commonLib = app?.appContext.config.globalProperties.$CommonLib;
const $WebAPI = app?.appContext.config.globalProperties.$WebAPI;
const _$route = app?.appContext.config.globalProperties.$route;
const _router = useRouter()
const _route = useRoute()
const userStore = useUserStore();
const $Message = app?.appContext.config.globalProperties.$message;

const routeNameType = _$route?.name?.toString().toLocaleLowerCase() || "";
const ids = _$route?.query.id ? [parseInt(_$route?.query.id.toString())] : null
const createdate = ref("")

const input_title = ref("");
const editorValue = ref();

const switch_state = ref(true);

const datepicker_release = ref();
const datepicker_discontinued = ref();

// el-select
const codePoliceList = reactive<Array<SelectOption>>([])
const codeKeywordList = reactive<Array<SelectOption>>([])

// el-select v-model
const codePolicyID = ref()
const codeKeywordIDs = ref()


function GetCodePoliceList(callback:any){
  $WebAPI.GetCodePolicy(
    userStore.token,
    null,
    null,
    null,
    null,
    null,
    null,
    false,
    (res: any) => {
      console.log(res);
      let _resData = res.data || "error";
      if (_resData == "error") {
        callback('error')
        return console.error(`API res ${_resData}`);
      }

      let _res = _resData.result;

      if (_res.errCode != 0) {
        callback('error')
        return console.error(_res.errMsg);
      }

      _res.result.forEach((code:any, i:number) => {
        codePoliceList.push({
          value: code.id,
          label: code.labelName
        })
      })

      callback('success')
    }
  );
}

function GetCodeKeywordList(callback:any){
  $WebAPI.GetCodeKeyword(
    userStore.token,
    null,
    null,
    null,
    null,
    null,
    null,
    (res: any) => {
      console.log(res);
      let _resData = res.data || "error";
      if (_resData == "error") {
        callback('error')
        return console.error(`API res ${_resData}`);
      }

      let _res = _resData.result;

      if (_res.errCode != 0) {
        callback('error')
        return console.error(_res.errMsg);
      }

      _res.result.forEach((code:any, i:number) => {
        codeKeywordList.push({
          value: code.id,
          label: code.labelName
        })
      })

      callback('success')
    }
  );
}

function GetArticlesWelfareData(){
  $WebAPI.GetArticlesWelfareList(
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
      input_title.value = _data.title
      try{
        //@ts-ignore
        editorValue.value = decodeURIComponent(_data.detail).replaceAll("https://drive.google.com/uc?export=download&", "https://drive.google.com/thumbnail?sz=w800&")
      } catch(e){
        editorValue.value = _data.detail
      }
      datepicker_release.value = _data.releaseTime ? _data.releaseTime.replace('T', ' ') : '-'
      datepicker_discontinued.value = _data.discontinuedTime ? _data.discontinuedTime.replace('T', ' ') : '-'
      switch_state.value = _data.state == "啟用"
      codePolicyID.value = _data.codePolicy_ID
      codeKeywordIDs.value = _data.codeKeywordList.map((_code:any, i:number) => {
        return _code.id
      })
    }
  );
}

const promise_codePolicy = new Promise((resolve, reject) => {
  GetCodePoliceList((resMsg:string) => {
    resMsg == 'success' ? resolve(`getCodePolicy_${resMsg}`) : reject(`getCodePolicy_${resMsg}`)
  })
})
const promise_codeKeyword = new Promise((resolve, reject) => {
  GetCodeKeywordList((resMsg:string) => {
    resMsg == 'success' ? resolve(`getCodeKeyword_${resMsg}`) : reject(`getCodeKeyword_${resMsg}`)
  })
})

Promise.all([promise_codePolicy, promise_codeKeyword])
        .then(res => {
          console.log(res)
          if (res.includes('error')) return false;

          if (routeNameType.indexOf("edit") >= 0) {
            GetArticlesWelfareData()
          }
        })


function SaveAction() {
  console.log(datepicker_release.value)
  const _title = input_title.value
  const _state = switch_state.value

  const _codePolicyID = codePolicyID.value
  const _codeKeywordIDs = codeKeywordIDs.value

  const _detail = encodeURIComponent(editorValue.value.replaceAll("https://drive.google.com/uc?export=download&", "https://drive.google.com/thumbnail?sz=w800&"))
  const _releaseTime = datepicker_release.value.toLocaleString('sv')
  const _discontinued = datepicker_discontinued.value.toLocaleString('sv')
  
  if (!_codePolicyID) {
    return $Message({ message: `【政策類別】不可為空`, type: "warning" })
  }
  if (_codeKeywordIDs.length <= 0) {
    return $Message({ message: `【關鍵字】不可為空`, type: "warning" })
  }
  if (!_title) {
    return $Message({ message: `【標題】不可為空`, type: "warning" })
  }

  if (routeNameType.indexOf("add") >= 0) {
    console.log("[Add] Save action");
    console.log(datepicker_release)
    console.log(datepicker_release.value)
    console.log(_releaseTime)
    $WebAPI.InsertArticlesWelfare(userStore.token, _title, _detail, _codePolicyID, _codeKeywordIDs, _releaseTime, _discontinued, _state,(res: any) => {
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
        $commonLib.GuideToPage('Articles_Welfare_DataList')
      }
    );
  }

  if (routeNameType.indexOf("edit") >= 0) {
    console.log("[Edit] Save action");
    const _id = ids? ids[0] : 0
    if (_id == 0) return false
    $WebAPI.UpdateArticlesWelfare(userStore.token, _id, _title, _detail, _codePolicyID, _codeKeywordIDs, _releaseTime, _discontinued, _state,(res: any) => {
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
        // $commonLib.GuideToPage('Articles_Welfare_DataList')
        _router.back()
      }
    );
  }
}
</script>
