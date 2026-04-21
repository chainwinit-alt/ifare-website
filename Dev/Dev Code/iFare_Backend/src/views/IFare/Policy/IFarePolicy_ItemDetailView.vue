<template>
  <main-header>
    <template #btnsLeft>
      <el-button :icon="ArrowLeft" size="large" @click="$router.go(-1)"
        >上一頁</el-button
      >
    </template>
    <template #subtitle v-if="$route.name != 'IFare_Policy_Add'">
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
      class="section-main-card card-fullsize card-ifare-policy card-input-format"
    >
      <div class="card-info">
        <div class="item-group-list">
          <div class="item-group">
            <label class="input-title">政策類別</label>
            <span class="input-value">{{ codePolicyName }}</span>
          </div>
          <div class="item-group">
            <label class="input-title">地區</label>
            <span class="input-value">{{ codeDomicileName }}</span>
          </div>
        </div>
        <div class="item-group-list">
          <div class="item-group">
            <label class="input-title">受助人</label>
            <div class="input-value tag-list" v-if="codeRecipients.findIndex(p => p.label == '不限') < 0">
              <el-tag
                v-for="tag in codeRecipients"
                :key="tag.label"
                :type="tag.type"
                class="m-tag"
                effect="plain"
                round
              >
                {{ tag.label }}
              </el-tag>
            </div>
            <span class="input-value" v-else>不限</span>
          </div>
          <div class="item-group">
            <label class="input-title">經濟條件</label>
            <div class="input-value tag-list" v-if="codeIncomes.findIndex(p => p.label == '不限') < 0">
              <el-tag
                v-for="tag in codeIncomes"
                :key="tag.label"
                :type="tag.type"
                class="m-tag"
                effect="plain"
                round
              >
                {{ tag.label }}
              </el-tag>
            </div>
            <span class="input-value" v-else>不限</span>
          </div>
          <div class="item-group">
            <label class="input-title">特殊身分</label>
            <div class="input-value tag-list" v-if="codeIdentities.findIndex(p => p.label == '不限') < 0">
              <el-tag
                v-for="tag in codeIdentities"
                :key="tag.label"
                :type="tag.type"
                class="m-tag"
                effect="plain"
                round
              >
                {{ tag.label }}
              </el-tag>
            </div>
            <span class="input-value" v-else>不限</span>
          </div>
        </div>
        <div class="item-group-list">
          <div class="item-group">
            <label class="input-title">主管機關</label>
            <span class="input-value">{{ competentAuthority }}</span>
          </div>
          <div class="item-group">
            <label class="input-title">關鍵字</label>
            <div class="input-value tag-list" v-if="codeKeywords.findIndex(p => p.label == '不限') < 0">
              <el-tag
                v-for="tag in codeKeywords"
                :key="tag.label"
                :type="tag.type"
                class="m-tag"
                effect="plain"
                round
              >
                {{ tag.label }}
              </el-tag>
            </div>
            <span class="input-value" v-else>不限</span>
          </div>
        </div>
      </div>
    </div>
    <div
      class="section-main-card card-fullsize card-ifare-policy card-input-format"
    >
      <div class="card-info">
        <h2 class="info-item info-title">{{ title }}</h2>
        <div class="info-item info-qual">
          <div class="info-content info-pre-line">{{ detail_qual }}</div>
        </div>
        <div class="info-item info-welfare">
          <div class="info-content raw-html" v-html="detail_welfare"></div>
        </div>
        <div class="info-item info-evidence">
          <div class="info-content info-pre-line">{{ detail_evidence }}</div>
        </div>
        <div class="info-item info-officeunit">
          <div class="info-content">{{ detail_officeUnit }}</div>
        </div>
      </div>
    </div>
    <div
      class="section-main-card card-fullsize card-ifare-policy card-input-format"
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
    <div class="section-main-card card-fullsize card-ifare-policy card-input-format">
        <div class="card-info">
            <div class="item-group">
                <label class="input-title" >備註</label>
                <span class="input-value">{{ remark }}</span>
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
import type { TagObj } from "@/interface/Component";
import { useUserStore } from "@/stores/user";

const app = getCurrentInstance();
const _global = app?.appContext.config.globalProperties
const $commonLib = app?.appContext.config.globalProperties.$CommonLib;
const $WebAPI = app?.appContext.config.globalProperties.$WebAPI;
const _$route = app?.appContext.config.globalProperties.$route;
const userStore = useUserStore();

const createdate = ref('')
const title = ref('')
const detail_welfare = ref('')
const detail_qual = ref('')
const detail_evidence = ref('')
const detail_officeUnit = ref('')
const codePolicyName = ref('')
const codeDomicileName = ref('')
const codeKeywords = reactive<Array<TagObj>>([])
const codeIncomes = reactive<Array<TagObj>>([])
const codeIdentities = reactive<Array<TagObj>>([])
const codeRecipients = reactive<Array<TagObj>>([])
const competentAuthority = ref('')
const releaseTime = ref('')
const discontinuedTime = ref('')
const datastate = ref('')
const remark = ref('')

const ids = _$route?.query.id ? [parseInt(_$route?.query.id.toString())] : null

const keywordList = reactive<Array<TagObj>>([
  { type: "", label: "失業" },
  { type: "", label: "就業" },
  { type: "", label: "特殊待遇" },
]);

const handleClick = () => {
  _global?.$router.push({ name: "IFare_Policy_Edit", query: { id: _$route?.query.id } });
};

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

      createdate.value = _data.createDate
      title.value = _data.title
      try{
        //@ts-ignore
        detail_welfare.value = decodeURIComponent(_data.welfareInfo).replaceAll("https://drive.google.com/uc?export=download&", "https://drive.google.com/thumbnail?sz=w800&")
        detail_qual.value = decodeURIComponent(_data.qualification)
        detail_evidence.value = decodeURIComponent(_data.evidence)
      } catch(e){
        detail_welfare.value = _data.welfareInfo
        detail_qual.value = _data.qualification
        detail_evidence.value = _data.evidence
      }
      detail_officeUnit.value = _data.iFareOfficeUnit + (_data.iFareOfficeUnitID == 1 ? 
                                `${_data.officeUnitInfo ? ' ,'+_data.officeUnitInfo : ''}${_data.officeUnitTel ? ' ,'+_data.officeUnitTel : ''}` 
                                : '')
      releaseTime.value = _data.releaseTime ? _data.releaseTime.replace('T', ' ') : '-'
      discontinuedTime.value = _data.discontinuedTime ? _data.discontinuedTime.replace('T', ' ') : '-'
      datastate.value = _data.state
      codePolicyName.value = _data.codePolicy_LabelName
      codeDomicileName.value = _data.codeDomicile_LabelName
      codeIdentities.push(..._data.codeIdentityList.map((code:any, i:number) => {
        return { type: "", label: code.labelName == '全選' ? '不限' : code.labelName }
      }))
      codeIncomes.push(..._data.codeIncomeList.map((code:any, i:number) => {
        return { type: "", label: code.labelName == '全選' ? '不限' : code.labelName }
      }))
      codeRecipients.push(..._data.codeRecipientList.map((code:any, i:number) => {
        return { type: "", label: code.labelName == '全選' ? '不限' : code.labelName }
      }))
      codeKeywords.push(..._data.codeKeywordList.map((code:any, i:number) => {
        return { type: "", label: code.labelName == '全選' ? '不限' : code.labelName }
      }))
      competentAuthority.value = _data.competentAuthority
      remark.value = _data.remark
    }
  );
</script>
