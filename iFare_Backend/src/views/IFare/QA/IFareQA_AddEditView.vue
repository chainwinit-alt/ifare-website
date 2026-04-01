<template>
  <main-header>
    <template #subtitle v-if="$route.name == 'IFare_QA_Edit'">
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
      class="section-main-card card-fullsize card-ifare-qa card-input-format"
    >
      <div class="card-info">
        <div class="item-group textarea">
          <label class="input-title required">問題</label>
          <el-input v-model="input_qa"
                    rows="5"
                    maxlength="35"
                    show-word-limit
                    type="textarea"
                    resize="none"
                    placeholder="輸入內容" />
        </div>
        <div class="item-group textarea">
          <label class="input-title required">答案</label>
          <el-input v-model="input_answer"
                    rows="5"
                    maxlength="1000"
                    show-word-limit
                    type="textarea"
                    resize="none"
                    placeholder="輸入內容" />
        </div>
      </div>
    </div>
    <div
      class="section-main-card card-fullsize card-ifare-qa card-input-format"
    >
      <div class="card-info">
        <div class="item-group">
          <label class="input-title required">資料狀態</label>
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
import { ElButton, ElScrollbar, ElSwitch, ElInput } from "element-plus";
import { Close, Check } from "@element-plus/icons-vue";
import MainHeader from "@/components/MainHeader.vue";
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

const input_qa = ref('')
const input_answer = ref('')

const switch_state = ref(true);

if (routeNameType.indexOf("edit") >= 0) {
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
      input_qa.value = _data.question
      input_answer.value = _data.answer
      switch_state.value = _data.state == "啟用"
    }
  );
}

function SaveAction() {
  const _qa = input_qa.value
  const _answer = input_answer.value
  const _state = switch_state.value

  if (!_qa) {
    return $Message({ message: `【問題】不可為空`, type: "warning" })
  }
  if (!_answer) {
    return $Message({ message: `【答案】不可為空`, type: "warning" })
  }

  if (routeNameType.indexOf("add") >= 0) {
    console.log("[Add] Save action");
    $WebAPI.InsertFareQA(userStore.token, _qa, _answer, _state,(res: any) => {
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
        $commonLib.GuideToPage('IFare_QA_DataList')
      }
    );
  }

  if (routeNameType.indexOf("edit") >= 0) {
    console.log("[Edit] Save action");
    const _id = ids? ids[0] : 0
    if (_id == 0) return false
    $WebAPI.UpdateFareQA(userStore.token, _id, _qa, _answer, _state,(res: any) => {
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
        // $commonLib.GuideToPage('IFare_QA_DataList')
        _router.back();
      }
    );
  }
}

</script>
