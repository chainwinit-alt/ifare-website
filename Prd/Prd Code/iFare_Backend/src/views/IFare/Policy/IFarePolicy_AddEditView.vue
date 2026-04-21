<template>
  <main-header>
    <template #subtitle v-if="$route.name == 'IFare_Policy_Edit'">
      <sub class="sub-title sub-createDate">{{ createdate }}</sub>
      <sub class="sub-title sub-number">{{$route.query.id}}</sub>
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
      class="section-main-card card-fullsize card-ifare-policy card-input-format"
    >
      <div class="card-info">
        <div class="item-group-list">
          <div class="item-group">
            <label class="item-title required">政策類別</label>
            <el-select v-model="codePolicyID" class="p-select" size="large">
              <el-option 
                v-for="item in codePoliceList"
                :key="item.value"
                :label="item.label"
                :value="item.value"/>
            </el-select>
          </div>
          <div class="item-group">
            <label class="item-title required">地區</label>
            <el-select v-model="codeDomicileID" class="p-select" size="large">
              <el-option 
                v-for="item in codeDomicileList"
                :key="item.value"
                :label="item.label"
                :value="item.value"/>
            </el-select>
          </div>
        </div>
        <div class="item-group-list">
          <div class="item-group">
            <label class="item-title required">受助者</label>
            <el-select 
              v-model="codeRecipientIDs" 
              class="p-select" 
              size="large"
              :multiple="true"
              collapse-tags
              collapse-tags-tooltip
              filterable
              clearable>
              <el-option 
                v-for="item in codeRecipientList"
                :key="item.value"
                :label="item.label"
                :value="item.value"/>
            </el-select>
          </div>
          <div class="item-group">
            <label class="item-title required">經濟條件</label>
            <el-select 
              v-model="codeIncomeIDs" 
              class="p-select" 
              size="large"
              :multiple="true"
              collapse-tags
              collapse-tags-tooltip
              filterable
              clearable>
              <el-option 
                v-for="item in codeIncomeList"
                :key="item.value"
                :label="item.label"
                :value="item.value"/>
            </el-select>
          </div>
          <div class="item-group">
            <label class="item-title required">特殊身分</label>
            <el-select 
              v-model="codeIdentityIDs" 
              class="p-select" 
              size="large"
              :multiple="true"
              collapse-tags
              collapse-tags-tooltip
              filterable
              clearable>
              <el-option 
                v-for="item in codeIdentityList"
                :key="item.value"
                :label="item.label"
                :value="item.value"/>
            </el-select>
          </div>
        </div>
        <div class="item-group-list">
          <div class="item-group">
            <label class="item-title">主管機關</label>
            <el-input
                  v-model="input_competentAuthority"
                  class="p-input"
                  type="text"
                  size="large"
                  placeholder="請輸入內容"
                />
          </div>
          <div class="item-group">
            <label class="item-title required">關鍵字</label>
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
      </div>
    </div>
    <div
      class="section-main-card card-fullsize card-ifare-policy card-input-format"
    >
      <div class="card-info">
        <div class="item-group full-width">
          <label class="item-title required">標題</label>
          <el-input
            class="p-input full-width"
            v-model="input_title"
            type="text"
            size="large"
            placeholder="請輸入標題"
          />
        </div>
        <div class="item-group textarea">
          <label class="input-title required">申請資格</label>
          <el-input
            v-model="input_qualification"
            rows="8"
            show-word-limit
            type="textarea"
            placeholder="輸入內容"
          />
        </div>
        <div class="item-group full-width html-editor">
          <label class="input-title required">福利內容</label>
          <html-editor v-model:editorValue="editorValue" editorType="ifare" />
        </div>
        <div class="item-group textarea">
          <label class="input-title required">應備證件資料</label>
          <el-input
            v-model="input_evidence"
            rows="8"
            show-word-limit
            type="textarea"
            placeholder="輸入內容"
          />
        </div>
        <div class="item-group">
          <label class="item-title required">洽辦單位</label>
          <el-select v-model="fareOfficeUnitID" class="p-select" size="large">
              <el-option 
                v-for="item in fareOfficeUnitList"
                :key="item.value"
                :label="item.label"
                :value="item.value"/>
            </el-select>
          <el-input
            class="p-input"
            v-model="input_officeInfo"
            type="text"
            size="large"
            placeholder="請輸入內容"
            v-show="fareOfficeUnitID==1"
          />
          <el-input
            class="p-input"
            v-model="input_officeTel"
            type="text"
            size="large"
            placeholder="請輸入電話"
            v-show="fareOfficeUnitID==1"
          />
        </div>
      </div>
    </div>
    <div
      class="section-main-card card-fullsize card-ifare-policy card-input-format"
    >
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
    <div
      class="section-main-card card-fullsize card-ifare-policy card-input-format"
    >
      <div class="card-info">
        <div class="item-group textarea">
          <label class="input-title">備註</label>
          <el-input
            v-model="input_remark"
            rows="5"
            maxlength="100"
            show-word-limit
            type="textarea"
            resize="none"
            placeholder="輸入內容"
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
import HtmlEditor from "@/components/CompHtmlEditor.vue";
import { useUserStore } from "@/stores/user";
import type { SelectOption } from "@/interface/SelectOptions";
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

const input_title = ref("");
const editorValue = ref();
const input_evidence = ref('');
const input_qualification = ref('');
const input_competentAuthority = ref('');

const input_officeTel = ref('')
const input_officeInfo = ref('')

const switch_state = ref(true);

const datepicker_release = ref();
const datepicker_discontinued = ref();

const input_remark = ref("");

// el-select
const codePoliceList = reactive<Array<SelectOption>>([])
const codeDomicileList = reactive<Array<SelectOption>>([])
const codeRecipientList = reactive<Array<SelectOption>>([])
const codeIncomeList = reactive<Array<SelectOption>>([])
const codeIdentityList = reactive<Array<SelectOption>>([])
const codeKeywordList = reactive<Array<SelectOption>>([])
const fareOfficeUnitList = reactive<Array<SelectOption>>([])

// el-select v-model
const codePolicyID = ref()
const codeDomicileID = ref()
const codeRecipientIDs = ref()
const codeIncomeIDs = ref()
const codeIdentityIDs = ref()
const codeKeywordIDs = ref()
const fareOfficeUnitID = ref()

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
function GetCodeDomicileList(callback:any){
  $WebAPI.GetCodeDomicile(
    userStore.token,
    null,
    null,
    null,
    null,
    null,
    true,
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
        codeDomicileList.push({
          value: code.id,
          label: code.labelName
        })
      })

      callback('success')
    }
  );
}
function GetCodeRecipientList(callback:any){
  $WebAPI.GetCodeRecipient(
    userStore.token,
    null,
    null,
    null,
    null,
    null,
    true,
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
        codeRecipientList.push({
          value: code.id,
          label: code.labelName
        })
      })

      callback('success')
    }
  );
}
function GetCodeIncomeList(callback:any){
  $WebAPI.GetCodeIncome(
    userStore.token,
    null,
    null,
    null,
    null,
    null,
    true,
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
        codeIncomeList.push({
          value: code.id,
          label: code.labelName
        })
      })

      callback('success')
    }
  );
}
function GetCodeIdentityList(callback:any){
  $WebAPI.GetCodeIdentity(
    userStore.token,
    null,
    null,
    null,
    null,
    null,
    true,
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
        codeIdentityList.push({
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
function GetFareOfficeUnitList(callback:any){
  $WebAPI.GetFareOfficeUnitList(
    userStore.token,
    null,
    null,
    null,
    null,
    null,
    true,
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
        fareOfficeUnitList.push({
          value: code.id,
          label: code.title
        })
      })

      callback('success')
    }
  );
}

function GetIFarePolicyData(){
  $WebAPI.GetFarePolicyList(
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
    null,
    ids,
    null,
    (res: any) => {
      console.log(res);
      let _resData = res.data || "error";
      if (_resData == "error") return console.error(`API res ${_resData}`);

      let _res = _resData.result;

      if (_res.errCode != 0) return console.error(_res.errMsg);
      const _data = _res.result[0]
      input_competentAuthority.value = _data.competentAuthority
      codePolicyID.value = _data.codePolicy_ID
      codeDomicileID.value = _data.codeDomicile_ID
      codeRecipientIDs.value = _data.codeRecipientList.map((_code:any, i:number) => {
        return _code.id
      })
      codeIncomeIDs.value = _data.codeIncomeList.map((_code:any, i:number) => {
        return _code.id
      })
      codeIdentityIDs.value = _data.codeIdentityList.map((_code:any, i:number) => {
        return _code.id
      })
      codeKeywordIDs.value = _data.codeKeywordList.map((_code:any, i:number) => {
        return _code.id
      })
      createdate.value = _data.createDate
      input_title.value = _data.title
      input_qualification.value = _data.qualification
      try{
        //@ts-ignore
        editorValue.value = decodeURIComponent(_data.welfareInfo).replaceAll("https://drive.google.com/uc?export=download&", "https://drive.google.com/thumbnail?sz=w800&")
      } catch(e){
        editorValue.value = _data.welfareInfo
      }
      input_evidence.value = _data.evidence
      datepicker_release.value = _data.releaseTime
      datepicker_discontinued.value = _data.discontinuedTime
      switch_state.value = _data.state == "啟用"
      input_remark.value = _data.remark
      input_officeInfo.value = _data.officeUnitInfo
      input_officeTel.value = _data.officeUnitTel
      fareOfficeUnitID.value = _data.iFareOfficeUnitID
    }
  );
}

const promise_codePolicy = new Promise((resolve, reject) => {
  GetCodePoliceList((resMsg:string) => {
    resMsg == 'success' ? resolve(`getCodePolicy_${resMsg}`) : reject(`getCodePolicy_${resMsg}`)
  })
})
const promise_codeDomicile = new Promise((resolve, reject) => {
  GetCodeDomicileList((resMsg:string) => {
    resMsg == 'success' ? resolve(`getCodeDomiciled_${resMsg}`) : reject(`getCodeDomiciled_${resMsg}`)
  })
})
const promise_codeRecipient = new Promise((resolve, reject) => {
  GetCodeRecipientList((resMsg:string) => {
    resMsg == 'success' ? resolve(`getCodeRecipient_${resMsg}`) : reject(`getCodeRecipient_${resMsg}`)
  })
})
const promise_codeIncome = new Promise((resolve, reject) => {
  GetCodeIncomeList((resMsg:string) => {
    resMsg == 'success' ? resolve(`getCodeIncome_${resMsg}`) : reject(`getCodeIncome_${resMsg}`)
  })
})
const promise_codeIdentity = new Promise((resolve, reject) => {
  GetCodeIdentityList((resMsg:string) => {
    resMsg == 'success' ? resolve(`getCodeIdentity_${resMsg}`) : reject(`getCodeIdentity_${resMsg}`)
  })
})
const promise_codeKeyword = new Promise((resolve, reject) => {
  GetCodeKeywordList((resMsg:string) => {
    resMsg == 'success' ? resolve(`getCodeKeyword_${resMsg}`) : reject(`getCodeKeyword_${resMsg}`)
  })
})
const promise_fareOfficeUnit = new Promise((resolve, reject) => {
  GetFareOfficeUnitList((resMsg:string) => {
    resMsg == 'success' ? resolve(`getFareOfficeUnit${resMsg}`) : reject(`getFareOfficeUnit${resMsg}`)
  })
})

Promise.all([promise_codePolicy, promise_codeDomicile, promise_codeRecipient, promise_codeIncome, promise_codeIdentity, promise_codeKeyword, promise_fareOfficeUnit])
        .then(res => {
          console.log(res)
          if (res.includes('error')) return false;

          if (routeNameType.indexOf("edit") >= 0) {
            GetIFarePolicyData()
          }
        })


function SaveAction() {
  console.log(datepicker_release.value)
  const _title = input_title.value
  const _state = switch_state.value
  const _competentAuthority = input_competentAuthority.value

  const _codePolicyID = codePolicyID.value
  const _codeDomicileID = codeDomicileID.value
  const _codeRecipientIDs = codeRecipientIDs.value
  const _codeIncomeIDs = codeIncomeIDs.value
  const _codeIdentityIDs = codeIdentityIDs.value
  const _codeKeywordIDs = codeKeywordIDs.value

  const _qualification = input_qualification.value
  const _welfareInfo = encodeURIComponent(editorValue.value.replaceAll("https://drive.google.com/uc?export=download&", "https://drive.google.com/thumbnail?sz=w800&"))
  const _evidence = input_evidence.value
  const _releaseTime = datepicker_release.value.toLocaleString('sv')
  const _discontinued = datepicker_discontinued.value.toLocaleString('sv')
  const _remark = input_remark.value
  const _ifareOfficeUnitID = fareOfficeUnitID.value
  //_ifareOfficeUnitID == 1 => '其他'
  const _officeInfo = _ifareOfficeUnitID == 1 ? input_officeInfo.value : null
  const _officeTel = _ifareOfficeUnitID == 1 ? input_officeTel.value : null

  if (!_codePolicyID) {
    return $Message({ message: `【政策類別】不可為空`, type: "warning" })
  }
  if (!_codeDomicileID) {
    return $Message({ message: `【地區】不可為空`, type: "warning" })
  }
  if (_codeRecipientIDs.length <= 0) {
    return $Message({ message: `【受助者】不可為空`, type: "warning" })
  }
  if (_codeIncomeIDs.length <= 0) {
    return $Message({ message: `【經濟條件】不可為空`, type: "warning" })
  }
  if (_codeIdentityIDs.length <= 0) {
    return $Message({ message: `【特殊身分】不可為空`, type: "warning" })
  }
  if (_codeKeywordIDs.length <= 0) {
    return $Message({ message: `【關鍵字】不可為空`, type: "warning" })
  }
  if (!_title) {
    return $Message({ message: `【標題】不可為空`, type: "warning" })
  }
  if (!_qualification) {
    return $Message({ message: `【申請資格】不可為空`, type: "warning" })
  }
  if (!_welfareInfo) {
    return $Message({ message: `【福利內容】不可為空`, type: "warning" })
  }
  if (!_evidence) {
    return $Message({ message: `【應備證件資料】不可為空`, type: "warning" })
  }
  if (!_ifareOfficeUnitID) {
    return $Message({ message: `【洽辦單位】不可為空`, type: "warning" })
  }

  if (routeNameType.indexOf("add") >= 0) {
    console.log("[Add] Save action");
    $WebAPI.InsertFarePolicy(userStore.token, _title, _qualification, _welfareInfo, _evidence, _ifareOfficeUnitID, _officeInfo, _officeTel,
      _codePolicyID, _codeDomicileID, _codeIdentityIDs, _codeIncomeIDs, _codeRecipientIDs, _codeKeywordIDs, _competentAuthority,
      _releaseTime, _discontinued, _remark, _state,(res: any) => {
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
        $commonLib.GuideToPage('IFare_Policy_DataList')
      }
    );
  }

  if (routeNameType.indexOf("edit") >= 0) {
    console.log("[Edit] Save action");
    const _id = ids? ids[0] : 0
    if (_id == 0) return false
    $WebAPI.UpdateFarePolicy(userStore.token, _id, _title, _qualification, _welfareInfo, _evidence, _ifareOfficeUnitID, _officeInfo, _officeTel,
      _codePolicyID, _codeDomicileID, _codeIdentityIDs, _codeIncomeIDs, _codeRecipientIDs, _codeKeywordIDs, _competentAuthority,
      _releaseTime, _discontinued, _remark, _state,(res: any) => {
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
        // $commonLib.GuideToPage('IFare_Policy_DataList')
        _router.back();
      }
    );
  }
}
</script>
