<template>
  <div class="section-main-card card-fullsize card-search">
    <div class="card-info" :name="props.searchMode">
      <comp-radio-select
        v-model:radio-value="radioValue_permission"
        radio-type="permission"
        v-if="checkCompToShow('radioSelect_permission')"
      />
      <comp-radio-select
        v-model:radio-value="radioValue_dataState"
        radio-type="dataState"
        v-if="checkCompToShow('radioSelect_dataState_before')"
      />
      <comp-date-range-picker
        v-model:date-value="datepicker_create"
        date-title="建立日期範圍"
        date-type="createDate"
        v-if="checkCompToShow('daterangepicker_createDate')"
      />
      <comp-date-range-picker
        v-model:date-value="datepicker_update"
        date-title="異動日期範圍"
        date-type="updateDate"
        v-if="checkCompToShow('daterangepicker_updateDate')"
      />
      <comp-date-range-picker
        v-model:date-value="datepicker_upload"
        date-title="上傳日期範圍"
        date-type="updateDate"
        v-if="checkCompToShow('daterangepicker_uploadDate')"
      />
      <comp-date-range-picker
        v-model:date-value="datepicker_release"
        date-title="上架日期"
        date-type="releaseDate"
        v-if="checkCompToShow('daterangepicker_releaseDate')"
      />
      <comp-date-range-picker
        v-model:date-value="datepicker_discontinued"
        date-title="下架日期"
        date-type="discontinuedDate"
        v-if="checkCompToShow('daterangepicker_discontinuedDate')"
      />
      <comp-item-select
        v-model:select-value="selectValue_domicile"
        select-type="domicile"
        v-if="checkCompToShow('itemSelect_domicile')"
      />
      <comp-item-select
        v-model:select-value="selectValue_policy"
        select-type="policy"
        v-if="checkCompToShow('itemSelect_policy')"
      />
      <comp-item-select
        v-model:select-value="selectValue_keyword"
        select-type="keyword"
        v-if="checkCompToShow('itemSelect_keyword')"
      />
      <comp-item-select
        v-model:select-value="selectValue_imgManagerType"
        select-type="imgManagerType"
        v-if="checkCompToShow('itemSelect_imgManagerType')"
      />
      <comp-text-input
        v-model:input-value="inputValue_num"
        input-name="searchNum"
        input-title="搜尋編號"
        input-placeholder="輸入編號"
        v-if="checkCompToShow('searchInput_num')"
      />
      <comp-text-input
        v-model:input-value="inputValue_searchWord"
        input-name="searchWord"
        input-title="名稱"
        input-placeholder="請輸入名稱"
        v-if="checkCompToShow('searchInput_word')"
      />
      <comp-text-input
        v-model:input-value="inputValue_searchAccount"
        input-name="searchAccount"
        input-title="帳號"
        input-placeholder="請輸入帳號"
        v-if="checkCompToShow('searchInput_account')"
      />
      <comp-radio-select
        v-model:radio-value="radioValue_releaseState"
        radio-type="releaseState"
        v-if="checkCompToShow('radioSelect_releaseState')"
      />
      <comp-radio-select
        v-model:radio-value="radioValue_dataState"
        radio-type="dataState"
        v-if="checkCompToShow('radioSelect_dataState')"
      />
      <comp-radio-select
        v-model:radio-value="radioValue_dataState"
        radio-type="policyState"
        v-if="checkCompToShow('radioSelect_dataState_policy')"
      />

      <el-button
        class="btn-search"
        type="primary"
        plain
        :icon="Search"
        size="large"
        @click="SetSearchParams"
        >查詢</el-button
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { Search } from "@element-plus/icons-vue";
import { ElButton } from "element-plus";
import CompDateRangePicker from "@/components/CompDateRangePicker.vue";
import CompRadioSelect from "./CompRadioSelect.vue";
import CompItemSelect from "./CompItemSelect.vue";
import CompTextInput from "./CompTextInput.vue";
import { reactive } from "vue";
import { useRouter } from "vue-router";

const _router = useRouter()
const props = defineProps(["searchMode", "defaultParams"]);
const emits = defineEmits(["update:searchParams"]);

interface mdatepicker {
  create?: any;
  update?: any;
  upload?: any;
  release?: any;
  discontinued?: any;
}

interface mradioSelect {
  dataState?: string;
  permission?: string;
  releaseState?: string;
}

interface mitemSelect {
  domicile?: string;
  policy?: string;
  keyword?: string;
  imgManagerType?: string;
}

interface msearchInput {
  num?: string,
  word?: string;
  account?: string;
}

interface SearchParams {
  datepicker?: mdatepicker;
  radioSelect?: mradioSelect;
  itemSelect?: mitemSelect;
  searchInput?: msearchInput;
}

// console.log(props)

const datepicker_create = ref(props.defaultParams && props.defaultParams.create ? props.defaultParams.create.split('TO') : []);
const datepicker_update = ref(props.defaultParams && props.defaultParams.update ? props.defaultParams.update.split('TO') : []);
const datepicker_upload = ref(props.defaultParams && props.defaultParams.upload ? props.defaultParams.upload.split('TO') : []);
const datepicker_release = ref(props.defaultParams && props.defaultParams.release ? props.defaultParams.release.split('TO') : []);
const datepicker_discontinued = ref(props.defaultParams && props.defaultParams.discontinued ? props.defaultParams.discontinued.split('TO') : []);
const radioValue_dataState = ref(props.defaultParams && props.defaultParams.dataState ? props.defaultParams.dataState : "不限");
const radioValue_permission = ref(props.defaultParams && props.defaultParams.permission ? props.defaultParams.permission : "不限");
const radioValue_releaseState = ref(props.defaultParams && props.defaultParams.releaseState ? props.defaultParams.releaseState : "不限");
const selectValue_domicile = ref(props.defaultParams && props.defaultParams.domicile ? props.defaultParams.domicile : null);
const selectValue_policy = ref(props.defaultParams && props.defaultParams.policy ? props.defaultParams.policy : null);
const selectValue_keyword = ref(props.defaultParams && props.defaultParams.keyword ? props.defaultParams.keyword.indexOf(",") >= 0 ? props.defaultParams.keyword.split(',') : [props.defaultParams.keyword] : null);
const selectValue_imgManagerType = ref(props.defaultParams && props.defaultParams.imgManagerType ? props.defaultParams.imgManagerType : null);
const inputValue_num = ref(props.defaultParams && props.defaultParams.num ? props.defaultParams.num : "")
const inputValue_searchWord = ref(props.defaultParams && props.defaultParams.word ? props.defaultParams.word : "");
const inputValue_searchAccount = ref(props.defaultParams && props.defaultParams.account ? props.defaultParams.account : "");

function checkCompToShow(_compName: string) {
  if (props.searchMode == "News") {
    return (
      _compName == "daterangepicker_createDate" ||
      _compName == "daterangepicker_updateDate" ||
      _compName == "radioSelect_dataState"
    );
  }

  if (props.searchMode == "Articles_Welfare") {
    return (
      _compName == "daterangepicker_createDate" ||
      _compName == "daterangepicker_updateDate" ||
      _compName == "daterangepicker_releaseDate" ||
      _compName == "daterangepicker_discontinuedDate" ||
      _compName == "itemSelect_policy" ||
      _compName == "itemSelect_keyword" ||
      _compName == "searchInput_num" ||
      _compName == "radioSelect_dataState"
    );
  }

  if (props.searchMode == "Articles_Lazy") {
    return (
      _compName == "daterangepicker_createDate" ||
      _compName == "daterangepicker_updateDate" ||
      _compName == "daterangepicker_releaseDate" ||
      _compName == "daterangepicker_discontinuedDate" ||
      _compName == "itemSelect_keyword" ||
      _compName == "radioSelect_dataState"
    );
  }

  if (props.searchMode == "IFare_Policy") {
    return (
      // _compName == "daterangepicker_createDate" ||
      // _compName == "daterangepicker_updateDate" ||
      _compName == "daterangepicker_releaseDate" ||
      _compName == "daterangepicker_discontinuedDate" ||
      _compName == "itemSelect_domicile" ||
      _compName == "itemSelect_policy" ||
      _compName == "itemSelect_keyword" ||
      _compName == "radioSelect_dataState_policy" ||
      _compName == "searchInput_num" ||
      _compName == "radioSelect_releaseState"
    );
  }

  if (props.searchMode == "IFare_QA") {
    return (
      _compName == "daterangepicker_createDate" ||
      _compName == "daterangepicker_updateDate"
    );
  }
  
  if (props.searchMode == "IFare_OfficeUnit" || props.searchMode.indexOf("Code_") == 0) {
    return (
      _compName == "daterangepicker_createDate" ||
      _compName == "daterangepicker_updateDate" ||
      _compName == "searchInput_word"
    );
  }

  if (props.searchMode == "Collaborator") {
    return (
      _compName == "radioSelect_dataState_before" ||
      _compName == "daterangepicker_updateDate" ||
      _compName == "searchInput_word"
    );
  }

  if (props.searchMode == "Account") {
    return (
      _compName == "radioSelect_permission" ||
      _compName == "radioSelect_dataState_before" ||
      _compName == "searchInput_account"
    );
  }

  if (props.searchMode == "ImgManager") {
    return (
      _compName == "daterangepicker_uploadDate" ||
      _compName == "itemSelect_imgManagerType" ||
      _compName == "searchInput_word"
    )
  }
  return false;
}

function SetSearchParams() {
  const searchParams = reactive<SearchParams>({
    datepicker: reactive<mdatepicker>({
      create: datepicker_create,
      update: datepicker_update,
      upload: datepicker_upload,
      release: datepicker_release,
      discontinued: datepicker_discontinued
    }),
    radioSelect: reactive<mradioSelect>({
      dataState: radioValue_dataState.value,
      permission: radioValue_permission.value,
      releaseState: radioValue_releaseState.value
    }),
    itemSelect: reactive<mitemSelect>({
      domicile: selectValue_domicile.value ? selectValue_domicile.value.value : selectValue_domicile.value,
      policy: selectValue_policy.value ? selectValue_policy.value.value : selectValue_policy.value,
      keyword: selectValue_keyword.value ? selectValue_keyword.value.map((item:any) => { return item.value}) : selectValue_keyword.value,
      imgManagerType: selectValue_imgManagerType.value ? selectValue_imgManagerType.value.value : selectValue_imgManagerType.value
    }),
    searchInput: reactive<msearchInput>({
      num: inputValue_num.value,
      word: inputValue_searchWord.value,
      account: inputValue_searchAccount.value
    }),
  });

  // console.log(searchParams)

  let _query:any = {}
  const _dFormat = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }
  // datepicker
  if (searchParams.datepicker?.create && searchParams.datepicker?.create.length == 2) {
    const _dList = searchParams.datepicker?.create
    const _dS = _dList[0].toLocaleDateString('en-US', _dFormat)
    const _dE = _dList[1].toLocaleDateString('en-US', _dFormat)
    _query.create = `${_dS}TO${_dE}`
  }
  if (searchParams.datepicker?.update && searchParams.datepicker?.update.length == 2) {
    const _dList = searchParams.datepicker?.update
    const _dS = _dList[0].toLocaleDateString('en-US', _dFormat)
    const _dE = _dList[1].toLocaleDateString('en-US', _dFormat)
    _query.update = `${_dS}TO${_dE}`
  }
  if (searchParams.datepicker?.release && searchParams.datepicker?.release.length == 2) {
    const _dList = searchParams.datepicker?.release
    const _dS = _dList[0].toLocaleDateString('en-US', _dFormat)
    const _dE = _dList[1].toLocaleDateString('en-US', _dFormat)
    _query.release = `${_dS}TO${_dE}`
  }
  if (searchParams.datepicker?.discontinued && searchParams.datepicker?.discontinued.length == 2) {
    const _dList = searchParams.datepicker?.discontinued
    const _dS = _dList[0].toLocaleDateString('en-US', _dFormat)
    const _dE = _dList[1].toLocaleDateString('en-US', _dFormat)
    _query.discontinued = `${_dS}TO${_dE}`
  }
  // radioSelect
  if (searchParams.radioSelect?.dataState && searchParams.radioSelect?.dataState != "不限") _query.dataState = searchParams.radioSelect?.dataState
  if (searchParams.radioSelect?.permission && searchParams.radioSelect?.permission != "不限") _query.permission = searchParams.radioSelect?.permission
  if (searchParams.radioSelect?.releaseState && searchParams.radioSelect?.releaseState != "不限") _query.releaseState = searchParams.radioSelect?.releaseState
  // itemSelect
  if (searchParams.itemSelect?.domicile) _query.domicile = searchParams.itemSelect?.domicile
  if (searchParams.itemSelect?.policy) _query.policy = searchParams.itemSelect?.policy
  if (searchParams.itemSelect?.keyword && searchParams.itemSelect?.keyword?.length > 0) _query.keyword = searchParams.itemSelect?.keyword.toString()
  // searchInput
  if (searchParams.searchInput?.num) _query.num = searchParams.searchInput?.num
  if (searchParams.searchInput?.word) _query.word = searchParams.searchInput?.word
  if (searchParams.searchInput?.account) _query.account = searchParams.searchInput?.account
  _router.replace({ query: _query})

  // console.log(_query)

  emits("update:searchParams", searchParams);
}
</script>
