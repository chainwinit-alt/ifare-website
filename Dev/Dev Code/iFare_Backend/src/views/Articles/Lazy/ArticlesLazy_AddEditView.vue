<template>
  <main-header>
    <template #subtitle v-if="$route.name == 'Articles_Lazy_Edit'">
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
        :loading="saving"
        :disabled="saving"
        @click="SaveAction"
        >儲存</el-button
      >
    </template>
  </main-header>
  <el-scrollbar class="main-scrollbar">
    <div
      class="section-main-card card-fullsize card-articles-lazy card-input-format"
    >
      <div class="card-info">
        <div class="item-group-list">
          <div class="item-group" :class="{ 'has-error': fieldErrors.policy }">
            <label class="item-title required">政策類別</label>
            <div class="field-stack">
              <el-select
                v-model="codePolicyID"
                class="p-select"
                size="large"
                placeholder="請選擇政策類別"
                @change="clearFieldError('policy')"
              >
                <el-option
                  v-for="item in codePoliceList"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
              <span v-if="fieldErrors.policy" class="field-error">{{ fieldErrors.policy }}</span>
              <span v-else class="input-hint">新增時會預設帶入第一個政策類別，仍可手動調整。</span>
            </div>
          </div>
          <div class="item-group full-width" :class="{ 'has-error': fieldErrors.keywords }">
            <label class="item-title required">關鍵字</label>
            <div class="field-stack">
              <el-select
                v-model="codeKeywordIDs"
                class="p-select"
                size="large"
                placeholder="請選擇 1-3 個關鍵字"
                :multiple="true"
                :multiple-limit="3"
                collapse-tags
                collapse-tags-tooltip
                filterable
                clearable
                @change="clearFieldError('keywords')"
              >
                <el-option
                  v-for="item in codeKeywordList"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
              <span v-if="fieldErrors.keywords" class="field-error">{{ fieldErrors.keywords }}</span>
              <span v-else class="input-hint">最多 3 個，會影響前台篩選與推薦。</span>
            </div>
          </div>
        </div>
        <div class="item-group full-width" :class="{ 'has-error': fieldErrors.title }">
          <label class="item-title required">標題</label>
          <div class="field-stack">
            <el-input
              class="p-input full-width"
              v-model="input_title"
              type="text"
              size="large"
              placeholder="例如：2026 長照補助懶人包"
              @input="clearFieldError('title')"
            />
            <span v-if="fieldErrors.title" class="field-error">{{ fieldErrors.title }}</span>
            <span v-else class="input-hint">建議包含年份或主題，方便列表辨識。</span>
          </div>
        </div>
        <div class="item-group">
          <label class="item-title"></label>
          <el-upload
            class="card-upload"
            action=""
            v-model:file-list="imgList"
            list-type="picture"
            accept=".jpg,.jpeg,.png"
            :limit="0"
            :auto-upload="false"
            :on-change="getImage"
            ref="upload"
          >
            <el-button type="primary">上傳圖片</el-button>
            <template #tip>
              <div class="el-upload__tip">格式：JPG / JPEG / PNG，單張 500KB 以下。</div>
            </template>
          </el-upload>
        </div>
      </div>
    </div>
    <div class="section-main-card card-fullsize card-articles-lazy">
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
import { computed, ref, reactive, onMounted, getCurrentInstance } from "vue";
import {
  ElInput,
  ElButton,
  ElMessageBox,
  ElSelect,
  ElSwitch,
  ElDatePicker,
  ElScrollbar,
  ElUpload,
} from "element-plus";
import type { UploadProps, UploadInstance, UploadUserFile } from "element-plus";
import { Close, Check } from "@element-plus/icons-vue";
import MainHeader from "@/components/MainHeader.vue";
import { useUserStore } from "@/stores/user";
import type { SelectOption } from "@/interface/SelectOptions";
import { useRouter } from "vue-router";
import { useDraftAutosave } from "@/composables/useDraftAutosave";

const app = getCurrentInstance();
const $commonLib = app?.appContext.config.globalProperties.$CommonLib;
const $Message = app?.appContext.config.globalProperties.$message;
const $WebAPI = app?.appContext.config.globalProperties.$WebAPI;
const _$route = app?.appContext.config.globalProperties.$route;
const _router = useRouter();
const userStore = useUserStore();

const routeNameType = _$route?.name?.toString().toLocaleLowerCase() || "";
const ids = _$route?.query.id ? [parseInt(_$route?.query.id.toString())] : null;
const createdate = ref("");

const input_title = ref("");

// el-select
const codePoliceList = reactive<Array<SelectOption>>([]);
const codeKeywordList = reactive<Array<SelectOption>>([]);

// el-select v-model
const codePolicyID = ref<string | undefined>(undefined);
const codeKeywordIDs = ref<Array<string>>([]);

const switch_state = ref(true);

const datepicker_release = ref<Date | undefined>(new Date());
const datepicker_discontinued = ref<Date | undefined>(undefined);

const upload = ref<UploadInstance>();
const imgList = ref<UploadUserFile[]>([]);
const saving = ref(false);
const fieldErrors = reactive<Record<string, string>>({});

const IMAGE_MAX_SIZE = 500 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpg", "image/jpeg", "image/png"];

// 2026-05-25 #56 — 自動儲存草稿 + 離開提醒(圖片不存草稿)
const DRAFT_KEY = computed(() =>
  `ifare:articles-lazy-draft:v1:${routeNameType.indexOf('add') >= 0 ? 'new' : ids?.[0] ?? 'new'}`
);
const draftData = computed(() => ({
  title: input_title.value,
  release: datepicker_release.value,
  discontinued: datepicker_discontinued.value,
  state: switch_state.value,
  policyId: codePolicyID.value,
  keywordIds: codeKeywordIDs.value,
}));
const draft = useDraftAutosave({ storageKey: DRAFT_KEY, data: draftData });

onMounted(async () => {
  if (!draft.hasDraft()) return;
  try {
    await ElMessageBox.confirm(
      '偵測到先前未儲存的草稿,要還原嗎?(圖片不會還原,需重新上傳)',
      '草稿提示',
      { type: 'info', confirmButtonText: '還原草稿', cancelButtonText: '不要,清掉' },
    );
    const d = draft.restore();
    if (d) {
      input_title.value = d.title ?? '';
      datepicker_release.value = d.release;
      datepicker_discontinued.value = d.discontinued;
      switch_state.value = d.state ?? true;
      codePolicyID.value = d.policyId;
      codeKeywordIDs.value = d.keywordIds ?? [];
    }
  } catch {
    draft.clearDraft();
  }
});

function clearFieldError(field: string) {
  if (fieldErrors[field]) {
    delete fieldErrors[field];
  }
}

function validateImageFile(file: any) {
  const raw = file.raw || file;
  if (!raw) return true;

  if (raw.size > IMAGE_MAX_SIZE) {
    $Message({ message: "圖片大小不可超過 500KB，請壓縮後再上傳。", type: "error" });
    return false;
  }

  if (!ACCEPTED_IMAGE_TYPES.includes(raw.type)) {
    $Message({ message: "檔案類型只限 JPG、JPEG、PNG。", type: "error" });
    return false;
  }

  return true;
}

function validateForm() {
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key]);

  if (!codePolicyID.value) fieldErrors.policy = "請選擇政策類別。";
  if (!codeKeywordIDs.value.length) fieldErrors.keywords = "請至少選擇 1 個關鍵字。";
  if (!input_title.value.trim()) fieldErrors.title = "請輸入懶人包標題。";

  if (Object.keys(fieldErrors).length > 0) {
    $Message({ message: "請先補齊必填欄位，再儲存。", type: "warning" });
    return false;
  }

  return true;
}

function formatDateTimeForApi(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("sv");
}

function buildImagePayload(img: any) {
  const dataUrl = typeof img.url === "string" ? img.url : "";
  const isDataUrl = dataUrl.includes("data:") && dataUrl.includes("base64");

  if (!img.raw && dataUrl && !isDataUrl) {
    return Promise.resolve({
      imagePath: dataUrl,
      imageName: img.name,
      imageExtension: "",
    });
  }

  if (!img.raw && isDataUrl) {
    const indexData = dataUrl.indexOf("data:");
    const indexBase64 = dataUrl.indexOf("base64");
    img.raw = {
      type: dataUrl.substring(indexData + "data:".length, indexBase64 - 1),
    };
    return $commonLib.GetImgBase64(dataUrl).then((imagePath: string) => ({
      imagePath,
      imageName: img.name,
      imageExtension: img.raw.type,
    }));
  }

  return $commonLib.GetImgBase64(img.raw).then((imagePath: string) => ({
    imagePath,
    imageName: img.name,
    imageExtension: img.raw?.type || "",
  }));
}

function getImage(file: any, fileList: any) {
  console.error("【getImage】");
  console.log(file);

  if (!validateImageFile(file)) {
    upload.value?.handleRemove(file);
    return false;
  }
}

function GetCodePoliceList(callback: any) {
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
        callback("error");
        return console.error(`API res ${_resData}`);
      }

      let _res = _resData.result;

      if (_res.errCode != 0) {
        callback("error");
        return console.error(_res.errMsg);
      }

      _res.result.forEach((code: any, i: number) => {
        codePoliceList.push({
          value: code.id,
          label: code.labelName,
        });
      });

      if (routeNameType.indexOf("add") >= 0 && !codePolicyID.value && codePoliceList.length > 0) {
        codePolicyID.value = codePoliceList[0].value;
      }

      callback("success");
    }
  );
}

function GetCodeKeywordList(callback: any) {
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
        callback("error");
        return console.error(`API res ${_resData}`);
      }

      let _res = _resData.result;

      if (_res.errCode != 0) {
        callback("error");
        return console.error(_res.errMsg);
      }

      _res.result.forEach((code: any, i: number) => {
        codeKeywordList.push({
          value: code.id,
          label: code.labelName,
        });
      });

      callback("success");
    }
  );
}

function GetArticlesLazyData() {
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
      const _data = _res.result[0];
      codePolicyID.value = _data.codePolicy_ID;
      codeKeywordIDs.value = _data.codeKeywordList.map(
        (_code: any, i: number) => {
          return _code.id;
        }
      );
      imgList.value = _data.imageList.map((_img:any, i:number) => {
        return {
          name: _img.imageName,
          url: _img.imagePath
        }
      })
      createdate.value = _data.createDate;
      input_title.value = _data.title;
      datepicker_release.value = _data.releaseTime;
      datepicker_discontinued.value = _data.discontinuedTime;
      switch_state.value = _data.state == "啟用";
    }
  );
}

const promise_codePolicy = new Promise((resolve, reject) => {
  GetCodePoliceList((resMsg: string) => {
    resMsg == "success"
      ? resolve(`getCodePolicy_${resMsg}`)
      : reject(`getCodePolicy_${resMsg}`);
  });
});

const promise_codeKeyword = new Promise((resolve, reject) => {
  GetCodeKeywordList((resMsg: string) => {
    resMsg == "success"
      ? resolve(`getCodeKeyword_${resMsg}`)
      : reject(`getCodeKeyword_${resMsg}`);
  });
});

Promise.all([promise_codePolicy, promise_codeKeyword]).then((res) => {
  console.log(res);
  if (res.includes("error")) return false;

  if (routeNameType.indexOf("edit") >= 0) {
    GetArticlesLazyData();
  }
});

function SaveAction() {
  console.log(imgList.value);

  if (saving.value) return;
  if (!validateForm()) return;

  saving.value = true;

  const imgPayloadList = imgList.value.map((img:any) => buildImagePayload(img));

  Promise.all(imgPayloadList).then((res) => {
    const _imgList = res.length > 0 ? res : []

    const _title = input_title.value;
    const _state = switch_state.value;

    const _codePolicyID = codePolicyID.value;
    const _codeKeywordIDs = codeKeywordIDs.value;

    const _releaseTime = formatDateTimeForApi(datepicker_release.value);
    const _discontinued = formatDateTimeForApi(datepicker_discontinued.value);

    if (routeNameType.indexOf("add") >= 0) {
      console.log("[Add] Save action");
      $WebAPI.InsertArticlesLazy(userStore.token, _title, _imgList, _codePolicyID, _codeKeywordIDs, _releaseTime, _discontinued, _state,(res: any) => {
          let _resData = res.data || "error";
          if (_resData == "error") {
            $Message({ message: `API res ${_resData}`, type: "error" })
            saving.value = false;
            return console.error(`API res ${_resData}`);
          }

          let _res = _resData.result;
          if (_res.errCode != 0) {
            $Message({ message: _res.errMsg, type: "error" })
            saving.value = false;
            return console.error(_res.errMsg);
          }

          $Message({ message: '新增成功', type: "success" })
          // 2026-05-25 #56 — 儲存成功後清掉草稿
          draft.markClean();
          saving.value = false;
          $commonLib.GuideToPage('Articles_Lazy_DataList')
        }
      );
    }

    if (routeNameType.indexOf("edit") >= 0) {
      console.log("[Edit] Save action");
      const _id = ids? ids[0] : 0
      if (_id == 0) return false
      $WebAPI.UpdateArticlesLazy(userStore.token, _id, _title, _imgList, _codePolicyID, _codeKeywordIDs, _releaseTime, _discontinued, _state,(res: any) => {
          let _resData = res.data || "error";
          if (_resData == "error") {
            $Message({ message: `API res ${_resData}`, type: "error" })
            saving.value = false;
            return console.error(`API res ${_resData}`);
          }

          let _res = _resData.result;
          if (_res.errCode != 0) {
            $Message({ message: _res.errMsg, type: "error" })
            saving.value = false;
            return console.error(_res.errMsg);
          }

          $Message({ message: '編輯成功', type: "success" })
          // 2026-05-25 #56 — 儲存成功後清掉草稿
          draft.markClean();
          saving.value = false;
          _router.back()
        }
      );
    }
  }).catch((err:any) => {
    console.error('[ArticlesLazy] save image failed', err);
    $Message({ message: '圖片處理失敗，請重新選擇圖片後再儲存。', type: 'error' });
    saving.value = false;
  });
}
</script>
