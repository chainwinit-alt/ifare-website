<template>
  <!-- 頁面頂部標題列：包含副標題（建立日期、資料ID）與操作按鈕 -->
  <main-header>
    <!-- 編輯模式下才顯示建立日期與資料 ID -->
    <template #subtitle v-if="$route.name == 'Collaborator_Edit'">
      <sub class="sub-title sub-createDate">{{ createdate }}</sub>
      <sub class="sub-title sub-number">{{$route.query.id}}</sub>
    </template>
    <!-- 右側操作按鈕：取消返回上一頁、儲存提交表單 -->
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
    <!-- 合作夥伴基本資料卡片：名稱、服務項目、電話、連結、圖片上傳 -->
    <div
      class="section-main-card card-fullsize card-collaborator card-input-format"
    >
      <div class="card-info column-wrap">
        <!-- 左欄：文字輸入欄位 -->
        <div class="item-group-list">
          <div class="item-group" :class="{ 'has-error': fieldErrors.title }">
            <label class="input-title required">名稱</label>
            <div class="field-stack">
              <el-input v-model="input_title" type="text" placeholder="例如：長穩社福慈善基金會" @input="clearFieldError('title')" />
              <span v-if="fieldErrors.title" class="field-error">{{ fieldErrors.title }}</span>
              <span v-else class="input-hint">請填寫前台要顯示的合作單位名稱。</span>
            </div>
          </div>
          <div class="item-group" :class="{ 'has-error': fieldErrors.serviceItem }">
            <label class="input-title required">服務項目</label>
            <div class="field-stack">
              <el-input v-model="input_serve" type="text" placeholder="例如：長照服務、弱勢家庭支持" @input="clearFieldError('serviceItem')" />
              <span v-if="fieldErrors.serviceItem" class="field-error">{{ fieldErrors.serviceItem }}</span>
              <span v-else class="input-hint">用一句話描述合作夥伴提供的主要服務。</span>
            </div>
          </div>
          <div class="item-group" :class="{ 'has-error': fieldErrors.tel }">
            <label class="input-title required">電話</label>
            <div class="field-stack">
              <el-input v-model="input_tel" type="text" placeholder="例如：02-1234-5678" @input="clearFieldError('tel')" />
              <span v-if="fieldErrors.tel" class="field-error">{{ fieldErrors.tel }}</span>
              <span v-else class="input-hint">可填市話或服務窗口電話。</span>
            </div>
          </div>
          <div class="item-group" :class="{ 'has-error': fieldErrors.url }">
            <label class="input-title required">連結</label>
            <div class="field-stack">
              <el-input v-model="input_url" type="text" placeholder="例如：https://www.example.org" @input="clearFieldError('url')" />
              <span v-if="fieldErrors.url" class="field-error">{{ fieldErrors.url }}</span>
              <span v-else class="input-hint">建議使用完整網址，包含 https://。</span>
            </div>
          </div>
        </div>
        <!-- 右欄：圖片上傳區（拖曳或點擊上傳，僅限 JPG/PNG，最大 500KB） -->
        <div class="item-group-list">
          <div class="item-group upload-drag">
            <label class="input-title">上傳圖片</label>
            <el-upload class="card-upload"
                        action=""
                        v-model:file-list="imgList"
                        list-type="picture"
                        :show-file-list="false"
                        accept=".jpg,.jpeg,.png"
                        :limit="1"
                        :auto-upload="false"
                        :on-change="getImage"
                        :on-exceed="uploadNewImg"
                        ref="upload"
                        drag>
                <!-- 已有預覽圖時顯示圖片，否則顯示上傳提示圖示 -->
                <img v-if="imgPreview" :src="imgPreview" style="width:100%; object-fit: contain;"/>
                <el-icon v-show="!imgPreview" class="el-icon--upload"><upload-filled /></el-icon>
                <div v-show="!imgPreview" class="el-upload__text">將圖片拖曳到這裡，或<em>點擊上傳</em></div>
                <template #tip>
                    <div class="el-upload__tip">格式：JPG / JPEG / PNG，建議 56px * 56px，500KB 以下。</div>
                </template>
            </el-upload>
          </div>
        </div>
      </div>
    </div>
    <!-- 資料狀態卡片：啟用 / 停用切換 -->
    <div
      class="section-main-card card-fullsize card-collaborator card-input-format"
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
/**
 * 頁面用途：合作夥伴 新增 / 編輯 表單頁
 * - 路由名稱為 Collaborator_Add 時執行新增
 * - 路由名稱為 Collaborator_Edit 時執行編輯（透過 query.id 取得資料）
 * 資料流：
 *   編輯模式 → GetCollaboratorList API 取回現有資料填入表單
 *   儲存時   → 圖片轉 Base64 後呼叫 InsertCollaborator / UpdateCollaborator API
 */
import { computed, ref, reactive, onMounted, getCurrentInstance } from "vue";
import {
  ElButton,
  ElMessageBox,
  ElScrollbar,
  ElSwitch,
  ElInput,
  ElUpload,
  ElIcon,
  genFileId
} from "element-plus";
import type { UploadProps, UploadUserFile, UploadInstance, UploadRawFile } from "element-plus";
import { Close, Check, Plus, UploadFilled } from "@element-plus/icons-vue";
import MainHeader from "@/components/MainHeader.vue";
import { useUserStore } from "@/stores/user";
import { useRouter } from "vue-router";
import { useDraftAutosave } from "@/composables/useDraftAutosave";

// 取得全域工具：CommonLib（共用函式）、$message（訊息提示）、WebAPI（API 呼叫）、$route（路由資訊）
const app = getCurrentInstance();
const $commonLib = app?.appContext.config.globalProperties.$CommonLib;
const $Message = app?.appContext.config.globalProperties.$message
const $WebAPI = app?.appContext.config.globalProperties.$WebAPI;
const _$route = app?.appContext.config.globalProperties.$route;
const _router = useRouter();
const userStore = useUserStore();

// 判斷目前是新增或編輯模式（依路由名稱小寫比對）
const routeNameType = _$route?.name?.toString().toLocaleLowerCase() || "";
// 編輯模式下從 query.id 取得資料 ID，包成陣列供 API 使用
const ids = _$route?.query.id ? [parseInt(_$route?.query.id.toString())] : null
const createdate = ref("")  // 資料建立日期（僅編輯模式顯示）

// 表單欄位雙向綁定
const input_title = ref('')   // 名稱
const input_serve = ref('')   // 服務項目
const input_tel = ref('')     // 電話
const input_url = ref('')     // 連結

const imgPreview = ref()      // 圖片預覽 URL（本地或遠端）

const switch_state = ref(true); // 資料狀態：true = 啟用
const saving = ref(false);
const fieldErrors = reactive<Record<string, string>>({});

// Element Plus 上傳元件實例與檔案清單
const upload = ref<UploadInstance>();
const imgList = ref<UploadUserFile[]>([])

const IMAGE_MAX_SIZE = 500 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpg', 'image/jpeg', 'image/png'];

// 2026-05-25 #56 — 自動儲存草稿 + 離開提醒(圖片不存草稿,只存文字欄位)
const DRAFT_KEY = computed(() =>
  `ifare:collaborator-draft:v1:${routeNameType.indexOf('add') >= 0 ? 'new' : ids?.[0] ?? 'new'}`
);
const draftData = computed(() => ({
  title: input_title.value,
  serve: input_serve.value,
  tel: input_tel.value,
  url: input_url.value,
  state: switch_state.value,
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
      input_serve.value = d.serve ?? '';
      input_tel.value = d.tel ?? '';
      input_url.value = d.url ?? '';
      switch_state.value = d.state ?? true;
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
    $Message({ message: "圖片大小不可超過 500KB，請壓縮後再上傳。", type: 'error' });
    return false;
  }

  if (!ACCEPTED_IMAGE_TYPES.includes(raw.type)) {
    $Message({ message: "檔案類型只限 JPG、JPEG、PNG。", type: 'error' });
    return false;
  }

  return true;
}

function validateForm() {
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key]);

  if (!input_title.value.trim()) fieldErrors.title = '請輸入合作夥伴名稱。';
  if (!input_serve.value.trim()) fieldErrors.serviceItem = '請輸入服務項目。';
  if (!input_tel.value.trim()) fieldErrors.tel = '請輸入聯絡電話。';
  if (!input_url.value.trim()) fieldErrors.url = '請輸入合作夥伴連結。';

  if (Object.keys(fieldErrors).length > 0) {
    $Message({ message: '請先補齊必填欄位，再儲存。', type: "warning" });
    return false;
  }

  return true;
}


/**
 * getImage：使用者選取圖片後觸發
 * - 驗證檔案大小（500KB 上限）與格式（jpg/png）
 * - 通過驗證後更新圖片預覽
 */
function getImage(file:any, fileList:any){
  console.error('【getImage】')
  console.log(file)

  if (!validateImageFile(file)) {
    upload.value?.handleRemove(file);
    return false;
  }

  imgPreview.value = file.url
}

/**
 * uploadNewImg：超過上傳數量限制（limit=1）時觸發
 * - 清除舊檔案並以新檔案取代，實現「替換上傳」效果
 */
function uploadNewImg(rawfile:any){
  console.error('【uploadNewImg】')
  console.log(rawfile)
  upload.value!.clearFiles()
  const file = rawfile[0] as UploadRawFile
  file.uid = genFileId()
  upload.value!.handleStart(file)
}

// 編輯模式初始化：呼叫 API 取回現有合作夥伴資料並填入表單
if (routeNameType.indexOf("edit") >= 0) {
  $WebAPI.GetCollaboratorList(
    userStore.token,
    null,
    null,
    null,
    null,
    ids,
    (res: any) => {
      let _resData = res.data || "error";
      if (_resData == "error") return console.error(`API res ${_resData}`);

      let _res = _resData.result;

      if (_res.errCode != 0) return console.error(_res.errMsg);
      let _data = _res.result[0]
      // 將 API 回傳資料填入各表單欄位
      createdate.value = _data.createDate
      input_title.value = _data.title
      input_serve.value = _data.serviceItem
      input_tel.value = _data.tel
      input_url.value = _data.url
      imgPreview.value = _data.imageFile
      switch_state.value = _data.state == '啟用'
    }
  );
}

/**
 * SaveAction：儲存按鈕點擊事件
 * 1. 驗證必填欄位
 * 2. 呼叫 GetImgBase64 將圖片轉為 Base64 字串
 * 3. 依模式呼叫對應 API：
 *    - 新增：InsertCollaborator → 成功後跳轉至列表頁
 *    - 編輯：UpdateCollaborator → 成功後返回上一頁
 */
function SaveAction() {
  console.log(imgList.value)
  if (saving.value) return;
  if (!validateForm()) return;

  saving.value = true;

  // 若有新上傳圖片則轉 Base64，否則傳入 'NA' 表示不更新圖片
  $commonLib.GetImgBase64(imgList.value.length > 0 ? imgList.value[0].raw : 'NA').then((res:any)=> {

    const _title = input_title.value
    const _serviceItem = input_serve.value
    const _tel = input_tel.value
    const _url = input_url.value
    // 僅在有新圖片時傳送圖片相關參數，否則傳 null（後端保持原圖）
    const _imageFile = res != 'NA' ? res : null
    const _imageName = res != 'NA' ? imgList.value[0].name : null
    const _imageExtension = res != 'NA' ? imgList.value[0].raw?.type : null
    const _state = switch_state.value

    // 新增模式
    if (routeNameType.indexOf("add") >= 0) {
      console.log("[Add] Save action");
      $WebAPI.InsertCollaborator(userStore.token, _title, _serviceItem, _tel, _url, _imageFile, _imageName, _imageExtension, _state,(res: any) => {
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
          $commonLib.GuideToPage('Collaborator_DataList')  // 新增成功後跳轉至列表頁
        }
      );
    }

    // 編輯模式
    if (routeNameType.indexOf("edit") >= 0) {
      console.log("[Edit] Save action");
      const _id = ids? ids[0] : 0
      if (_id == 0) return false  // ID 無效時不執行
      $WebAPI.UpdateCollaborator(userStore.token, _id, _title, _serviceItem, _tel, _url, _imageFile, _imageName, _imageExtension, _state,(res: any) => {
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
          _router.back();  // 編輯成功後返回上一頁（詳情頁）
        }
      );
    }
  }).catch((err:any) => {
    console.error('[Collaborator] save image failed', err);
    $Message({ message: '圖片處理失敗，請重新選擇圖片後再儲存。', type: 'error' });
    saving.value = false;
  })
}
</script>
