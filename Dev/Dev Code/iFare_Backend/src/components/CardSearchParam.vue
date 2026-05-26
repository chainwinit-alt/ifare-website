<template>
  <!-- 搜尋條件卡片容器，name 屬性標記目前的搜尋模式 -->
  <div class="section-main-card card-fullsize card-search">
    <div class="card-info" :name="props.searchMode">
      <div class="search-toolbar">
        <div class="search-toolbar__summary">
          <span class="search-toolbar__label">目前已套用</span>
          <strong class="search-toolbar__count">{{ activeFilterCount }}</strong>
          <span class="search-toolbar__label">個條件</span>
        </div>
        <div class="search-toolbar__actions">
          <!-- 我的搜尋下拉：點選快速套用 / 刪除 -->
          <el-dropdown
            v-if="savedSearches.length > 0"
            trigger="click"
            class="search-toolbar__saved"
            :max-height="280"
          >
            <button type="button" class="search-toolbar__chip">
              <el-icon><Star /></el-icon>
              <span>我的搜尋（{{ savedSearches.length }}）</span>
              <el-icon class="search-toolbar__chip-arrow"><ArrowDown /></el-icon>
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="item in savedSearches"
                  :key="item.name"
                  @click="applySavedSearch(item)"
                >
                  <div class="saved-search-row">
                    <span class="saved-search-row__name">{{ item.name }}</span>
                    <button
                      type="button"
                      class="saved-search-row__delete"
                      aria-label="刪除此搜尋"
                      @click.stop="deleteSavedSearch(item.name, $event)"
                    >
                      <el-icon><Delete /></el-icon>
                    </button>
                  </div>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <!-- 儲存目前條件：必須有 active filter 才可按 -->
          <button
            type="button"
            class="search-toolbar__chip search-toolbar__chip--primary"
            :disabled="!hasActiveFilters"
            aria-label="儲存此搜尋條件"
            @click="saveCurrentSearch"
          >
            <el-icon><Star /></el-icon>
            <span>儲存此搜尋</span>
          </button>
          <button
            type="button"
            class="search-toolbar__reset"
            :disabled="!hasActiveFilters"
            aria-label="清除所有搜尋條件"
            @click="resetSearchParams"
          >
            清除全部
          </button>
        </div>
      </div>
      <!-- 權限篩選（radioSelect_permission）：顯示條件視 searchMode 而定 -->
      <comp-radio-select
        v-model:radio-value="radioValue_permission"
        radio-type="permission"
        v-if="checkCompToShow('radioSelect_permission')"
      />
      <!-- 資料狀態篩選（放置於前段，部分模式使用） -->
      <comp-radio-select
        v-model:radio-value="radioValue_dataState"
        radio-type="dataState"
        v-if="checkCompToShow('radioSelect_dataState_before')"
      />
      <!-- 建立日期範圍選擇器 -->
      <comp-date-range-picker
        v-model:date-value="datepicker_create"
        date-title="建立日期範圍"
        date-type="createDate"
        v-if="checkCompToShow('daterangepicker_createDate')"
      />
      <!-- 異動日期範圍選擇器 -->
      <comp-date-range-picker
        v-model:date-value="datepicker_update"
        date-title="異動日期範圍"
        date-type="updateDate"
        v-if="checkCompToShow('daterangepicker_updateDate')"
      />
      <!-- 上傳日期範圍選擇器（圖片管理使用） -->
      <comp-date-range-picker
        v-model:date-value="datepicker_upload"
        date-title="上傳日期範圍"
        date-type="updateDate"
        v-if="checkCompToShow('daterangepicker_uploadDate')"
      />
      <!-- 上架日期範圍選擇器 -->
      <comp-date-range-picker
        v-model:date-value="datepicker_release"
        date-title="上架日期"
        date-type="releaseDate"
        v-if="checkCompToShow('daterangepicker_releaseDate')"
      />
      <!-- 下架日期範圍選擇器 -->
      <comp-date-range-picker
        v-model:date-value="datepicker_discontinued"
        date-title="下架日期"
        date-type="discontinuedDate"
        v-if="checkCompToShow('daterangepicker_discontinuedDate')"
      />
      <!-- 地區下拉選單 -->
      <comp-item-select
        v-model:select-value="selectValue_domicile"
        select-type="domicile"
        v-if="checkCompToShow('itemSelect_domicile')"
      />
      <!-- 政策類別下拉選單 -->
      <comp-item-select
        v-model:select-value="selectValue_policy"
        select-type="policy"
        v-if="checkCompToShow('itemSelect_policy')"
      />
      <!-- 關鍵字下拉選單（多選，最多3項） -->
      <comp-item-select
        v-model:select-value="selectValue_keyword"
        select-type="keyword"
        v-if="checkCompToShow('itemSelect_keyword')"
      />
      <!-- 圖片類別下拉選單 -->
      <comp-item-select
        v-model:select-value="selectValue_imgManagerType"
        select-type="imgManagerType"
        v-if="checkCompToShow('itemSelect_imgManagerType')"
      />
      <!-- 編號搜尋輸入框 -->
      <comp-text-input
        v-model:input-value="inputValue_num"
        input-name="searchNum"
        input-title="搜尋編號"
        input-placeholder="輸入編號"
        v-if="checkCompToShow('searchInput_num')"
      />
      <!-- 名稱關鍵字搜尋輸入框 -->
      <comp-text-input
        v-model:input-value="inputValue_searchWord"
        input-name="searchWord"
        input-title="名稱"
        input-placeholder="請輸入名稱"
        v-if="checkCompToShow('searchInput_word')"
      />
      <!-- 帳號搜尋輸入框 -->
      <comp-text-input
        v-model:input-value="inputValue_searchAccount"
        input-name="searchAccount"
        input-title="帳號"
        input-placeholder="請輸入帳號"
        v-if="checkCompToShow('searchInput_account')"
      />
      <!-- 上架狀態篩選 -->
      <comp-radio-select
        v-model:radio-value="radioValue_releaseState"
        radio-type="releaseState"
        v-if="checkCompToShow('radioSelect_releaseState')"
      />
      <!-- 資料狀態篩選（放置於後段） -->
      <comp-radio-select
        v-model:radio-value="radioValue_dataState"
        radio-type="dataState"
        v-if="checkCompToShow('radioSelect_dataState')"
      />
      <!-- 資料狀態篩選（政策專用） -->
      <comp-radio-select
        v-model:radio-value="radioValue_dataState"
        radio-type="policyState"
        v-if="checkCompToShow('radioSelect_dataState_policy')"
      />

      <!-- 查詢按鈕：點擊後觸發 SetSearchParams，將條件更新至 URL query 並通知父元件 -->
      <el-button
        class="btn-search"
        type="primary"
        plain
        :icon="Search"
        size="large"
        @click="SetSearchParams"
        >查詢</el-button
      >
      <el-button
        class="btn-search btn-search-reset"
        plain
        size="large"
        :icon="RefreshLeft"
        :disabled="!hasActiveFilters"
        @click="resetSearchParams"
      >清除條件</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * CardSearchParam - 搜尋條件卡片元件
 *
 * 功能說明：
 * - 依照 searchMode prop 動態顯示不同的搜尋條件欄位
 * - 支援多種搜尋模式：News、Articles_Welfare、Articles_Lazy、IFare_Policy、
 *   IFare_QA、IFare_OfficeUnit、Code_*、Collaborator、Account、ImgManager
 * - 查詢時將條件序列化後更新 URL query string，並透過 emit 通知父元件
 *
 * Props：
 * - searchMode：決定顯示哪些搜尋欄位的模式字串
 * - defaultParams：由 URL query 解析出的預設搜尋值，用於頁面重整後恢復狀態
 *
 * Emits：
 * - update:searchParams：傳出包含所有搜尋條件的物件給父元件
 */
import { computed, onMounted, reactive, ref, watch } from "vue";
import { ArrowDown, Delete, RefreshLeft, Search, Star } from "@element-plus/icons-vue";
import {
  ElButton,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElIcon,
  ElMessageBox,
} from "element-plus";
import CompDateRangePicker from "@/components/CompDateRangePicker.vue";
import CompRadioSelect from "./CompRadioSelect.vue";
import CompItemSelect from "./CompItemSelect.vue";
import CompTextInput from "./CompTextInput.vue";
import { useFeedback } from "@/composables/useFeedback";
import { useRouter } from "vue-router";

const _router = useRouter()
const { success: showSuccess } = useFeedback();
const props = defineProps(["searchMode", "defaultParams"]);
const emits = defineEmits(["update:searchParams"]);
const ALL_OPTION_LABEL = "不限";
const SAVED_SEARCH_STORAGE_PREFIX = "ifare-backend:saved-search:";
const SAVED_SEARCH_MAX = 10;

/* ========== 型別定義 ========== */

type QueryValue = string | number | null | undefined;

/** 日期範圍條件物件 */
interface mdatepicker {
  create?: any;
  update?: any;
  upload?: any;
  release?: any;
  discontinued?: any;
}

/** 單選篩選條件物件 */
interface mradioSelect {
  dataState?: string;
  permission?: string;
  releaseState?: string;
}

/** 下拉選單條件物件 */
interface mitemSelect {
  domicile?: QueryValue;
  policy?: QueryValue;
  keyword?: QueryValue[] | null;
  imgManagerType?: QueryValue;
}

/** 文字輸入搜尋條件物件 */
interface msearchInput {
  num?: string,
  word?: string;
  account?: string;
}

/** 整合所有搜尋條件的主物件 */
interface SearchParams {
  datepicker?: mdatepicker;
  radioSelect?: mradioSelect;
  itemSelect?: mitemSelect;
  searchInput?: msearchInput;
}

/* ========== 各搜尋欄位的雙向綁定 ref，初始值從 URL query 的 defaultParams 讀取 ========== */

// 日期範圍：以 "MM/DD/YYYYTOMM/DD/YYYY" 格式儲存，讀取時以 "TO" 分割
const datepicker_create = ref(props.defaultParams && props.defaultParams.create ? props.defaultParams.create.split('TO') : []);
const datepicker_update = ref(props.defaultParams && props.defaultParams.update ? props.defaultParams.update.split('TO') : []);
const datepicker_upload = ref(props.defaultParams && props.defaultParams.upload ? props.defaultParams.upload.split('TO') : []);
const datepicker_release = ref(props.defaultParams && props.defaultParams.release ? props.defaultParams.release.split('TO') : []);
const datepicker_discontinued = ref(props.defaultParams && props.defaultParams.discontinued ? props.defaultParams.discontinued.split('TO') : []);

// 單選篩選條件，預設為「不限」
const radioValue_dataState = ref(props.defaultParams && props.defaultParams.dataState ? props.defaultParams.dataState : ALL_OPTION_LABEL);
const radioValue_permission = ref(props.defaultParams && props.defaultParams.permission ? props.defaultParams.permission : ALL_OPTION_LABEL);
const radioValue_releaseState = ref(props.defaultParams && props.defaultParams.releaseState ? props.defaultParams.releaseState : ALL_OPTION_LABEL);

// 下拉選單條件，預設為 null（未選擇）
const selectValue_domicile = ref(props.defaultParams && props.defaultParams.domicile ? props.defaultParams.domicile : null);
const selectValue_policy = ref(props.defaultParams && props.defaultParams.policy ? props.defaultParams.policy : null);
// 關鍵字支援多選，若有多個值以逗號分隔後轉為陣列
const selectValue_keyword = ref(props.defaultParams && props.defaultParams.keyword ? props.defaultParams.keyword.indexOf(",") >= 0 ? props.defaultParams.keyword.split(',') : [props.defaultParams.keyword] : null);
const selectValue_imgManagerType = ref(props.defaultParams && props.defaultParams.imgManagerType ? props.defaultParams.imgManagerType : null);

// 文字搜尋條件
const inputValue_num = ref(props.defaultParams && props.defaultParams.num ? props.defaultParams.num : "")
const inputValue_searchWord = ref(props.defaultParams && props.defaultParams.word ? props.defaultParams.word : "");
const inputValue_searchAccount = ref(props.defaultParams && props.defaultParams.account ? props.defaultParams.account : "");

/* ========== 儲存搜尋條件（localStorage，依 searchMode 分區） ========== */

interface SavedSearchParams {
  datepicker: {
    create: any[];
    update: any[];
    upload: any[];
    release: any[];
    discontinued: any[];
  };
  radioSelect: {
    dataState: string;
    permission: string;
    releaseState: string;
  };
  itemSelect: {
    domicile: any;
    policy: any;
    keyword: any[] | null;
    imgManagerType: any;
  };
  searchInput: {
    num: string;
    word: string;
    account: string;
  };
}

interface SavedSearch {
  name: string;
  savedAt: number;
  params: SavedSearchParams;
}

const savedSearchKey = computed(() => `${SAVED_SEARCH_STORAGE_PREFIX}${props.searchMode}`);
const savedSearches = ref<SavedSearch[]>([]);

function loadSavedSearches() {
  try {
    const raw = window.localStorage.getItem(savedSearchKey.value);
    if (!raw) {
      savedSearches.value = [];
      return;
    }
    const parsed = JSON.parse(raw);
    savedSearches.value = Array.isArray(parsed) ? parsed : [];
  } catch {
    savedSearches.value = [];
  }
}

function persistSavedSearches() {
  try {
    window.localStorage.setItem(savedSearchKey.value, JSON.stringify(savedSearches.value));
  } catch {
    // localStorage 不可用時忽略（無痕模式 / quota 用盡）
  }
}

function snapshotCurrentParams(): SavedSearchParams {
  return {
    datepicker: {
      create: Array.isArray(datepicker_create.value) ? [...datepicker_create.value] : [],
      update: Array.isArray(datepicker_update.value) ? [...datepicker_update.value] : [],
      upload: Array.isArray(datepicker_upload.value) ? [...datepicker_upload.value] : [],
      release: Array.isArray(datepicker_release.value) ? [...datepicker_release.value] : [],
      discontinued: Array.isArray(datepicker_discontinued.value) ? [...datepicker_discontinued.value] : [],
    },
    radioSelect: {
      dataState: radioValue_dataState.value,
      permission: radioValue_permission.value,
      releaseState: radioValue_releaseState.value,
    },
    itemSelect: {
      domicile: selectValue_domicile.value,
      policy: selectValue_policy.value,
      keyword: Array.isArray(selectValue_keyword.value) ? [...selectValue_keyword.value] : null,
      imgManagerType: selectValue_imgManagerType.value,
    },
    searchInput: {
      num: inputValue_num.value,
      word: inputValue_searchWord.value,
      account: inputValue_searchAccount.value,
    },
  };
}

function applyParamsSnapshot(s: SavedSearchParams) {
  datepicker_create.value = s.datepicker?.create || [];
  datepicker_update.value = s.datepicker?.update || [];
  datepicker_upload.value = s.datepicker?.upload || [];
  datepicker_release.value = s.datepicker?.release || [];
  datepicker_discontinued.value = s.datepicker?.discontinued || [];

  radioValue_dataState.value = s.radioSelect?.dataState ?? ALL_OPTION_LABEL;
  radioValue_permission.value = s.radioSelect?.permission ?? ALL_OPTION_LABEL;
  radioValue_releaseState.value = s.radioSelect?.releaseState ?? ALL_OPTION_LABEL;

  selectValue_domicile.value = s.itemSelect?.domicile ?? null;
  selectValue_policy.value = s.itemSelect?.policy ?? null;
  selectValue_keyword.value = Array.isArray(s.itemSelect?.keyword) ? s.itemSelect!.keyword : null;
  selectValue_imgManagerType.value = s.itemSelect?.imgManagerType ?? null;

  inputValue_num.value = s.searchInput?.num ?? "";
  inputValue_searchWord.value = s.searchInput?.word ?? "";
  inputValue_searchAccount.value = s.searchInput?.account ?? "";
}

async function saveCurrentSearch() {
  if (!hasActiveFilters.value) return;
  try {
    const { value } = await ElMessageBox.prompt("為這組搜尋條件命名，下次可從「我的搜尋」直接套用。", "儲存搜尋條件", {
      confirmButtonText: "儲存",
      cancelButtonText: "取消",
      inputPattern: /\S+/,
      inputErrorMessage: "名稱不可空白",
      inputPlaceholder: "例如：本週新增的政策",
    });
    const name = String(value || "").trim();
    if (!name) return;

    const existingIndex = savedSearches.value.findIndex((s) => s.name === name);
    if (existingIndex >= 0) {
      try {
        await ElMessageBox.confirm(`已有名為「${name}」的搜尋，要覆蓋嗎？`, "名稱重複", {
          confirmButtonText: "覆蓋",
          cancelButtonText: "取消",
          type: "warning",
        });
      } catch {
        return;
      }
      savedSearches.value.splice(existingIndex, 1);
    }

    const next: SavedSearch = {
      name,
      savedAt: Date.now(),
      params: snapshotCurrentParams(),
    };
    savedSearches.value = [next, ...savedSearches.value].slice(0, SAVED_SEARCH_MAX);
    persistSavedSearches();
    showSuccess(`已儲存搜尋「${name}」`);
  } catch {
    // 使用者取消 prompt，不需處理
  }
}

function applySavedSearch(search: SavedSearch) {
  applyParamsSnapshot(search.params);
  SetSearchParams();
}

async function deleteSavedSearch(name: string, event?: Event) {
  event?.stopPropagation();
  try {
    await ElMessageBox.confirm(`要刪除「${name}」這組搜尋嗎？`, "刪除搜尋", {
      confirmButtonText: "刪除",
      cancelButtonText: "取消",
      type: "warning",
    });
  } catch {
    return;
  }
  savedSearches.value = savedSearches.value.filter((s) => s.name !== name);
  persistSavedSearches();
  showSuccess(`已刪除「${name}」`);
}

onMounted(() => {
  loadSavedSearches();
});

watch(savedSearchKey, () => {
  loadSavedSearches();
});

const activeFilterCount = computed(() => {
  let count = 0;

  const datepickers = [
    datepicker_create.value,
    datepicker_update.value,
    datepicker_upload.value,
    datepicker_release.value,
    datepicker_discontinued.value,
  ];
  count += datepickers.filter((items) => Array.isArray(items) && items.length === 2).length;

  const radioValues = [
    radioValue_dataState.value,
    radioValue_permission.value,
    radioValue_releaseState.value,
  ];
  count += radioValues.filter((value) => value && value !== ALL_OPTION_LABEL).length;

  const selectValues = [
    selectValue_domicile.value,
    selectValue_policy.value,
    selectValue_imgManagerType.value,
  ];
  count += selectValues.filter((value) => Boolean(value)).length;

  if (Array.isArray(selectValue_keyword.value) && selectValue_keyword.value.length > 0) {
    count += 1;
  }

  const inputValues = [
    inputValue_num.value,
    inputValue_searchWord.value,
    inputValue_searchAccount.value,
  ];
  count += inputValues.filter((value) => typeof value === "string" && value.trim().length > 0).length;

  return count;
});

const hasActiveFilters = computed(() => activeFilterCount.value > 0);

function getSelectValue(value: any): QueryValue {
  if (value && typeof value === "object" && "value" in value) {
    return value.value;
  }

  return value;
}

function getKeywordValues(value: any) {
  if (!value) return value;
  const list = Array.isArray(value) ? value : [value];
  return list.map((item) => getSelectValue(item)).filter((item) => item !== null && item !== undefined && `${item}`.trim() !== "");
}

function formatDateForQuery(value: Date | string) {
  if (typeof value === "string") return value;

  const dateFormatOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };

  return value.toLocaleDateString('en-US', dateFormatOptions);
}

function applyDateQuery(query: Record<string, string>, key: string, value: any) {
  if (!Array.isArray(value) || value.length !== 2 || !value[0] || !value[1]) return;

  query[key] = `${formatDateForQuery(value[0])}TO${formatDateForQuery(value[1])}`;
}

/**
 * checkCompToShow - 判斷指定搜尋元件是否應該顯示
 * @param _compName - 元件名稱識別字串
 * @returns boolean - true 表示顯示，false 表示隱藏
 *
 * 依據 searchMode 決定各模式下要顯示的搜尋條件組合
 */
function checkCompToShow(_compName: string) {
  // 最新消息：建立日期、異動日期、資料狀態
  if (props.searchMode == "News") {
    return (
      _compName == "daterangepicker_createDate" ||
      _compName == "daterangepicker_updateDate" ||
      _compName == "radioSelect_dataState"
    );
  }

  // 福利文章：建立/異動/上架/下架日期、政策、關鍵字、編號、資料狀態
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

  // 懶人包文章：建立/異動/上架/下架日期、關鍵字、資料狀態
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

  // 愛心福利政策：上架/下架日期、地區、政策、關鍵字、政策狀態、編號、上架狀態
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

  // 愛心 QA：建立日期、異動日期
  if (props.searchMode == "IFare_QA") {
    return (
      _compName == "daterangepicker_createDate" ||
      _compName == "daterangepicker_updateDate"
    );
  }

  // 辦事單位及代碼管理（Code_* 開頭）：建立/異動日期、名稱搜尋
  if (props.searchMode == "IFare_OfficeUnit" || props.searchMode.indexOf("Code_") == 0) {
    return (
      _compName == "daterangepicker_createDate" ||
      _compName == "daterangepicker_updateDate" ||
      _compName == "searchInput_word"
    );
  }

  // 合作夥伴：資料狀態（前段）、異動日期、名稱搜尋
  if (props.searchMode == "Collaborator") {
    return (
      _compName == "radioSelect_dataState_before" ||
      _compName == "daterangepicker_updateDate" ||
      _compName == "searchInput_word"
    );
  }

  // 帳號管理：權限、資料狀態（前段）、帳號搜尋
  if (props.searchMode == "Account") {
    return (
      _compName == "radioSelect_permission" ||
      _compName == "radioSelect_dataState_before" ||
      _compName == "searchInput_account"
    );
  }

  // 圖片管理：上傳日期、圖片類別、名稱搜尋
  if (props.searchMode == "ImgManager") {
    return (
      _compName == "daterangepicker_uploadDate" ||
      _compName == "itemSelect_imgManagerType" ||
      _compName == "searchInput_word"
    )
  }
  return false;
}

/**
 * SetSearchParams - 收集所有搜尋條件，更新 URL query 並發出 emit
 *
 * 處理流程：
 * 1. 將各欄位的 ref 值組合成 SearchParams 物件
 * 2. 將日期範圍格式化為 "MM/DD/YYYYTOMM/DD/YYYY" 字串
 * 3. 過濾掉預設值（「不限」、null 等），組成 URL query 物件
 * 4. 使用 router.replace 更新 URL（不產生歷史記錄）
 * 5. 透過 emit 將完整搜尋條件傳遞給父元件
 */
function resetSearchParams() {
  datepicker_create.value = [];
  datepicker_update.value = [];
  datepicker_upload.value = [];
  datepicker_release.value = [];
  datepicker_discontinued.value = [];

  radioValue_dataState.value = ALL_OPTION_LABEL;
  radioValue_permission.value = ALL_OPTION_LABEL;
  radioValue_releaseState.value = ALL_OPTION_LABEL;

  selectValue_domicile.value = null;
  selectValue_policy.value = null;
  selectValue_keyword.value = null;
  selectValue_imgManagerType.value = null;

  inputValue_num.value = "";
  inputValue_searchWord.value = "";
  inputValue_searchAccount.value = "";

  SetSearchParams();
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
      // 下拉選單取 value 屬性（SelectOption 結構）
      domicile: getSelectValue(selectValue_domicile.value) as string,
      policy: getSelectValue(selectValue_policy.value) as string,
      // 關鍵字為多選，取出每個選項的 value 並組成陣列
      keyword: getKeywordValues(selectValue_keyword.value),
      imgManagerType: getSelectValue(selectValue_imgManagerType.value) as string
    }),
    searchInput: reactive<msearchInput>({
      num: inputValue_num.value,
      word: inputValue_searchWord.value,
      account: inputValue_searchAccount.value
    }),
  });

  // 組合 URL query 物件，日期格式為 en-US（MM/DD/YYYY）
  let _query:any = {}

  applyDateQuery(_query, "create", searchParams.datepicker?.create);
  applyDateQuery(_query, "update", searchParams.datepicker?.update);
  applyDateQuery(_query, "upload", searchParams.datepicker?.upload);
  applyDateQuery(_query, "release", searchParams.datepicker?.release);
  applyDateQuery(_query, "discontinued", searchParams.datepicker?.discontinued);

  // 單選條件：若為「不限」則不加入 query
  if (searchParams.radioSelect?.dataState && searchParams.radioSelect?.dataState != ALL_OPTION_LABEL) _query.dataState = searchParams.radioSelect?.dataState
  if (searchParams.radioSelect?.permission && searchParams.radioSelect?.permission != ALL_OPTION_LABEL) _query.permission = searchParams.radioSelect?.permission
  if (searchParams.radioSelect?.releaseState && searchParams.radioSelect?.releaseState != ALL_OPTION_LABEL) _query.releaseState = searchParams.radioSelect?.releaseState

  // 下拉選單條件：有值才加入 query
  if (searchParams.itemSelect?.domicile) _query.domicile = searchParams.itemSelect?.domicile
  if (searchParams.itemSelect?.policy) _query.policy = searchParams.itemSelect?.policy
  // 關鍵字多選轉為逗號分隔字串
  if (searchParams.itemSelect?.keyword && searchParams.itemSelect?.keyword?.length > 0) _query.keyword = searchParams.itemSelect?.keyword.toString()
  if (searchParams.itemSelect?.imgManagerType) _query.imgManagerType = searchParams.itemSelect?.imgManagerType

  // 文字搜尋條件
  if (searchParams.searchInput?.num) _query.num = searchParams.searchInput?.num
  if (searchParams.searchInput?.word) _query.word = searchParams.searchInput?.word
  if (searchParams.searchInput?.account) _query.account = searchParams.searchInput?.account

  // 使用 replace 更新 URL query（不留歷史紀錄）
  _router.replace({ query: _query})

  // 通知父元件搜尋條件已更新
  emits("update:searchParams", searchParams);
}
</script>

<style lang="scss" scoped>
.search-toolbar {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.search-toolbar__summary {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  color: #606266;
}

.search-toolbar__actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.search-toolbar__label {
  font-size: 13px;
}

.search-toolbar__count {
  font-size: 22px;
  font-weight: 700;
  color: #303133;
}

.search-toolbar__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid rgba(48, 49, 51, 0.12);
  border-radius: 999px;
  background: #ffffff;
  color: #606266;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;

  &:hover:not(:disabled) {
    border-color: rgba(234, 85, 4, 0.32);
    color: #ea5504;
  }

  &:disabled {
    border-color: #ebeef5;
    background: #f5f7fa;
    color: #c0c4cc;
    cursor: not-allowed;
  }

  &.search-toolbar__chip--primary {
    border-color: rgba(234, 85, 4, 0.4);
    background: linear-gradient(135deg, #fff7f1, #ffffff);
    color: #ea5504;

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #ea5504, #f39a48);
      color: #ffffff;
    }
  }
}

.search-toolbar__chip-arrow {
  font-size: 12px;
}

.search-toolbar__reset {
  border: 0;
  background: transparent;
  color: #ea5504;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 8px;

  &:disabled {
    color: #c0c4cc;
    cursor: not-allowed;
  }
}

.saved-search-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-width: 220px;
  max-width: 320px;
}

.saved-search-row__name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.saved-search-row__delete {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #909399;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;

  &:hover {
    background: rgba(245, 108, 108, 0.12);
    color: #f56c6c;
  }
}

.btn-search-reset {
  margin-left: 4px;
}
</style>
