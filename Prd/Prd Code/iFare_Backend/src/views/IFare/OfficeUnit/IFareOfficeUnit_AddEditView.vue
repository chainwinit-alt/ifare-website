<template>
  <main-header>
    <template #subtitle v-if="$route.name == 'IFare_OfficeUnit_Edit'">
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
      class="section-main-card card-fullsize card-ifare-officeunit card-input-format"
    >
      <div class="card-info">
        <div class="item-group">
          <label class="input-title">名稱</label>
          <el-input
            class="c-input-format"
            v-model="input_title"
            type="text"
            size="large"
            placeholder="請輸入名稱"
          />
        </div>
      </div>
    </div>
    <template v-for="(item, i) in officeList">
      <div
        class="section-main-card card-fullsize card-ifare-officeunit card-input-format"
        name="addEdit-mode"
      >
        <div class="card-info">
          <div class="section-delete">
            <el-button text @click="handleClick_DeleteOfficeDomicile(i)">刪除區塊</el-button>
          </div>
          <div class="item-group">
            <label class="item-title required">地區</label>
            <el-select v-model="item.CodeDomicileID" class="p-select" size="large">
              <el-option 
                v-for="item in domicileList"
                :key="item.value"
                :label="item.label"
                :value="item.value"/>
            </el-select>
          </div>
          <template v-for="(itemUnit, j) in item.unitDetailList">
            <div class="item-group-list">
              <div class="item-group">
                <label class="item-title">單位</label>
                <el-input
                  class="p-input"
                  type="text"
                  size="large"
                  placeholder="請輸入名稱"
                  v-model="itemUnit.unitName"
                />
              </div>
              <div class="item-group">
                <label class="item-title">電話</label>
                <el-input
                  class="p-input"
                  type="tel"
                  size="large"
                  placeholder="請輸入電話"
                  v-model="itemUnit.tel"
                />
              </div>
              <div class="item-group full-width">
                <label class="item-title">地址</label>
                <el-input
                  class="p-input full-width"
                  type="text"
                  size="large"
                  placeholder="請輸入地址"
                  v-model="itemUnit.address"
                />
              </div>
              <div class="item-group">
                <el-button
                  class="btn-add-del"
                  plain
                  size="large"
                  :type="j == item.unitDetailList.length - 1 ? 'primary' : ''"
                  @click="
                    handleClick_AddOfficeUnit(
                      i,
                      j,
                      j == item.unitDetailList.length - 1
                    )
                  "
                  >{{
                    j == item.unitDetailList.length - 1 ? "新增" : "刪除"
                  }}</el-button
                >
              </div>
            </div>
          </template>
        </div>
      </div>
    </template>
    <el-button
      class="section-main-btn"
      :icon="Plus"
      type="primary"
      size="large"
      @click="handleClick_AddArea"
      >新增地區</el-button
    >
    <div
      class="section-main-card card-fullsize card-ifare-officeunit card-input-format"
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
import {
  ElButton,
  ElScrollbar,
  ElSwitch,
  ElInput,
  ElSelect,
  ElOption
} from "element-plus";
import { Close, Check, Plus } from "@element-plus/icons-vue";
import type { OfficeUnit, OfficeUnitDetail } from "@/interface/IFareOfficeUnit";
import MainHeader from "@/components/MainHeader.vue";
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
const switch_state = ref(true);

const domicileList = reactive<Array<SelectOption>>([])

const officeList = reactive<Array<OfficeUnit>>([]);

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
      if (_resData == "error") return console.error(`API res ${_resData}`);

      let _res = _resData.result;

      if (_res.errCode != 0) return console.error(_res.errMsg);

      _res.result.forEach((code:any, i:number) => {
        domicileList.push({
          value: code.id,
          label: code.labelName
        })
      })

      callback()
    }
  );
}

GetCodeDomicileList(() => {
  if (routeNameType.indexOf("edit") >= 0) {
    GetOfficeUnitData()
  }
})

function GetOfficeUnitData(){
  $WebAPI.GetFareOfficeUnitList(
    userStore.token,
    null,
    null,
    null,
    null,
    null,
    false,
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
      switch_state.value = _data.state == "啟用"
      
      _data.officeList.forEach((_item:any, i:number) => {

        const unitDetailList = reactive<Array<OfficeUnitDetail>>([])
        _item.unitList.forEach((_itemUnit:any, j:number) => {
          unitDetailList.push({
            unitName: _itemUnit.unitName,
            tel: _itemUnit.tel,
            address: _itemUnit.address,
          })
        })

        officeList.push({
          area: _item.codeDomicile_LabelName,
          CodeDomicileID: _item.codeDomicile_ID,
          unitDetailList: unitDetailList
        })
      })
    }
  );
}

const handleClick_AddArea = () => {
  officeList.push({
    area: "",
    CodeDomicileID: 1,
    unitDetailList: reactive<Array<OfficeUnitDetail>>([
      {
        unitName: "",
        tel: "",
        address: "",
      },
    ]),
  });
};

const handleClick_AddOfficeUnit = (
  officeUnitList_index: number,
  office_index: number,
  isAddMode: boolean
) => {
  //   console.log(index);
  if (isAddMode) {
    return officeList[officeUnitList_index].unitDetailList.push({
      unitName: "",
      tel: "",
      address: "",
    });
  }

  officeList[officeUnitList_index].unitDetailList.splice(office_index, 1);
};

const handleClick_DeleteOfficeDomicile = (
  officeUnitList_index: number
) => {
  //   console.log(index);
  officeList.splice(officeUnitList_index, 1);
};

function SaveAction() {
  console.log(officeList)
  // console.log(datepicker_release.value)
  const _title = input_title.value
  const _state = switch_state.value

  if (routeNameType.indexOf("add") >= 0) {
    console.log("[Add] Save action");
    $WebAPI.InsertFareOfficeUnit(userStore.token, _title, officeList, _state,(res: any) => {
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
        $commonLib.GuideToPage('IFare_OfficeUnit_DataList')
      }
    );
  }

  if (routeNameType.indexOf("edit") >= 0) {
    console.log("[Edit] Save action");
    const _id = ids? ids[0] : 0
    if (_id == 0) return false
    $WebAPI.UpdateFareOfficeUnit(userStore.token, _id, _title, officeList, _state,(res: any) => {
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
        // $commonLib.GuideToPage('IFare_OfficeUnit_DataList')
        _router.back();
      }
    );
  }
}
</script>
