<template>
  <main-header>
    <template #btnsLeft>
      <el-button :icon="ArrowLeft" size="large" @click="$router.go(-1)"
        >上一頁</el-button
      >
    </template>
    <template #subtitle v-if="$route.name != 'IFare_OfficeUnit_Add'">
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
      class="section-main-card card-fullsize card-ifare-officeunit card-input-format"
    >
      <div class="card-info">
        <div class="item-group">
          <label class="input-title">名稱</label>
          <h3 class="input-value">{{ title }}</h3>
        </div>
      </div>
    </div>
    <template v-for="item in officeList">
      <div
        class="section-main-card card-fullsize card-ifare-officeunit card-input-format"
      >
        <div class="card-info">
          <div class="item-group">
            <label class="input-title">地區</label>
            <h3 class="input-value">{{ item.area }}</h3>
          </div>
          <template v-for="office in item.unitDetailList">
            <div class="item-group-list">
              <div class="item-group">
                <label class="input-title">單位</label>
                <span class="input-value">{{ office.unitName }}</span>
              </div>
              <div class="item-group">
                <label class="input-title">電話</label>
                <span class="input-value">{{ office.tel }}</span>
              </div>
              <div class="item-group">
                <label class="input-title">地址</label>
                <span class="input-value">{{ office.address }}</span>
              </div>
            </div>
          </template>
        </div>
      </div>
    </template>
    <div
      class="section-main-card card-fullsize card-ifare-officeunit card-input-format"
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
import type { OfficeUnit, OfficeUnitDetail } from "@/interface/IFareOfficeUnit";
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

const officeList = reactive<Array<OfficeUnit>>([]);
const datastate = ref('')

const handleClick = () => {
  _global?.$router.push({ name: "IFare_OfficeUnit_Edit", query: { id: _$route?.query.id } });
};

const ids = _$route?.query.id ? [parseInt(_$route?.query.id.toString())] : null

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
      title.value = _data.title
      datastate.value = _data.state
      
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
</script>
