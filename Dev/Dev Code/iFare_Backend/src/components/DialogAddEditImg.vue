<template>
    <el-dialog
        v-model="dialogVisible"
        width="600"
        align-center
        append-to-body
        :show-close="true"
        :title="title"
        :close-on-click-modal="false"
        v-on:close="InitInput"
    >
    <el-form
        label-position="right"
        :label-width="_labelWidth">
        <el-form-item label="標題">
            <el-input v-model="_formaTitle"></el-input>
        </el-form-item>
        <el-form-item label="圖片類別">
            <el-select v-model="_formaType" style="width: 100%;">
                <el-option
                    v-for="item in typeOpts"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"></el-option>
            </el-select>
        </el-form-item>
        <el-form-item label="檔案">
            <el-upload
                class="card-upload"
                action=""
                v-model:file-list="imgList"
                list-type="picture"
                accept=".jpg, .png"
                :limit="1"
                :auto-upload="false"
                :on-change="getImage"
                ref="upload"
            >
                <el-button type="primary" :disabled="saving">上傳圖片</el-button>
                <template #tip>
                    <div class="el-upload__tip">只能上傳 jpg/png，檔案需小於 500KB</div>
                </template>
            </el-upload>
            <!-- #32 — 上傳後顯示檔案資訊，避免使用者要點開預覽才知道格式/大小 -->
            <div v-if="currentFileInfo" class="img-meta">
              <span class="img-meta__row"><strong>檔名</strong>{{ currentFileInfo.name }}</span>
              <span class="img-meta__row"><strong>格式</strong>{{ currentFileInfo.type || '—' }}</span>
              <span class="img-meta__row"><strong>大小</strong>{{ currentFileInfo.sizeText }}</span>
            </div>
            <!-- #32 — 編輯模式 + 已有舊圖 + 已替換新圖 時顯示前後對比，避免換錯 -->
            <div v-if="showCompare" class="img-compare">
              <div class="img-compare__col">
                <span class="img-compare__label">原圖</span>
                <img :src="originalImgUrl" alt="原圖預覽" />
              </div>
              <div class="img-compare__arrow">→</div>
              <div class="img-compare__col">
                <span class="img-compare__label">新圖</span>
                <img :src="currentFileInfo!.previewUrl" alt="新圖預覽" />
              </div>
            </div>
        </el-form-item>
    </el-form>
    <template #footer>
        <span class="dialog-footer">
          <el-button @click="CancelAction" :disabled="saving">取消</el-button>
          <el-button type="primary" :loading="saving" @click="SaveAction">確定</el-button>
        </span>
    </template>
    </el-dialog>
</template>

<style lang="scss" scope>
.dialog-alert-msg {
    display: flex;
    justify-content: center;
}

.card-upload {
    overflow: auto;

    .el-upload-list__item-info {
        overflow: hidden;
    }
}

.img-meta {
    display: grid;
    gap: 4px;
    margin-top: 12px;
    padding: 10px 12px;
    border-radius: 8px;
    background: #f7f8fa;
    border: 1px solid rgba(48, 49, 51, 0.06);
    font-size: 12px;
    color: #606266;

    .img-meta__row {
        display: inline-flex;
        gap: 8px;
        align-items: baseline;

        strong {
            color: #909399;
            font-size: 11px;
            min-width: 36px;
        }
    }
}

.img-compare {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 12px;
    margin-top: 12px;
    padding: 12px;
    border-radius: 12px;
    background: #fff8f3;
    border: 1px dashed rgba(234, 85, 4, 0.32);
}

.img-compare__col {
    display: grid;
    gap: 6px;
    text-align: center;

    img {
        width: 100%;
        max-height: 140px;
        object-fit: contain;
        border-radius: 8px;
        background: #ffffff;
        border: 1px solid #ebeef5;
    }
}

.img-compare__label {
    color: #909399;
    font-size: 12px;
    font-weight: 600;
}

.img-compare__arrow {
    color: #ea5504;
    font-size: 20px;
    font-weight: 700;
}
</style>

<script setup lang="ts">
import { ref, computed, getCurrentInstance, watch } from "vue";
import type { UploadProps, UploadInstance, UploadUserFile } from "element-plus";
import {
  ElDialog,
  ElButton,
  ElIcon,
  ElForm,
  ElFormItem,
  ElInput,
  ElSelect,
  ElOption
} from "element-plus";
import type { SelectOption } from "@/interface/SelectOptions";
import { useUserStore } from "@/stores/user";

const props = defineProps(['isVisable', 'title', 'format_title', 'format_type', 'format_img', 'format_id'])
const emits = defineEmits(['update:isVisable', 'confirm', 'update:updateTime', 'update:format_title', 'update:format_type', 'update:format_img', 'update:format_id'])

const dialogVisible = computed({
    get() {
        return props.isVisable
    },
    set(value) {
        emits('update:isVisable', value)
    }
})

const formatTitle = computed({
    get() {
        return props.format_title
    },
    set(value) {
        emits('update:format_title', value)
    }
})

const formatType = computed({
    get() {
        return props.format_type
    },
    set(value) {
        emits('update:format_type', value)
    }
})

const formatImg = computed({
    get() {
        return props.format_img
    },
    set(value:UploadUserFile[]) {
        emits('update:format_img', value)
    }
})

const formatID = computed({
    get() {
        return props.format_id
    },
    set(value) {
        emits('update:format_id', value)
    }
})

const app = getCurrentInstance();
const userStore = useUserStore();
const $commonLib = app?.appContext.config.globalProperties.$CommonLib;
const $Message = app?.appContext.config.globalProperties.$message;
const $WebAPI = app?.appContext.config.globalProperties.$WebAPI;

const _labelWidth = ref("140px")
const typeOpts = ref<Array<SelectOption>>([
        {
            label: "最新消息",
            value: "最新消息"
        },
        {
            label: "福利文章",
            value: "福利文章"
        },
        {
            label: "福利政策",
            value: "福利政策"
        }
    ])
const _formaTitle = ref(props.title.indexOf("編輯") >= 0 ? formatTitle : null)
const _formaType = ref(props.title.indexOf("編輯") >= 0 ? formatType : "福利文章")
const upload = ref<UploadInstance>();
const imgList = ref<UploadUserFile[] | any>(props.title.indexOf("編輯") >= 0 ? formatImg : []);
const _formatID = ref(formatID)
const saving = ref(false)
// #32 — 記錄編輯模式進入時的原圖 URL，用於前後對比
const originalImgUrl = ref<string>('')
const isEditMode = computed(() => props.title.indexOf('編輯') >= 0)

watch(
  () => props.format_img,
  (val: any) => {
    if (isEditMode.value && Array.isArray(val) && val.length > 0 && !originalImgUrl.value) {
      originalImgUrl.value = val[0]?.url || ''
    }
  },
  { immediate: true },
)

function formatFileSize(bytes: number): string {
  if (!bytes && bytes !== 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

// 上傳後可顯示的檔案資訊：檔名 / MIME / 大小 / 預覽 URL
const currentFileInfo = computed(() => {
  const file = (imgList.value as any[])[0]
  if (!file) return null
  const name = file.name || ''
  const size = typeof file.size === 'number' ? file.size : file?.raw?.size ?? 0
  const type = file?.raw?.type || file?.type || ''
  const previewUrl = file?.url || ''
  return {
    name,
    type,
    sizeText: formatFileSize(size),
    previewUrl,
  }
})

// 前後對比顯示條件：編輯模式 + 已記錄原圖 + 目前圖跟原圖不同
const showCompare = computed(() => {
  if (!isEditMode.value) return false
  if (!originalImgUrl.value) return false
  if (!currentFileInfo.value?.previewUrl) return false
  return currentFileInfo.value.previewUrl !== originalImgUrl.value
})

function getImage(file: any, _fileList: any) {
  if (file.size > 500000) {
    upload.value!.handleRemove(file);
    $Message({ message: "圖片大小不可超過 500KB", type: "error" });
    return false;
  }
  if (
    file.raw.type !== "image/jpg" &&
    file.raw.type !== "image/jpeg" &&
    file.raw.type !== "image/png"
  )
    return $Message({ message: "檔案類型只限 .jpg, .png", type: "error" });
}

function InitInput() {
    _formaTitle.value = null
    _formaType.value = "福利文章"
    imgList.value.splice(0)
    originalImgUrl.value = ''
    saving.value = false
}

function CancelAction() {
    dialogVisible.value = false
}

function SaveAction() {
  // #32 — saving guard：避免使用者快速雙擊「確定」造成重複送出
  if (saving.value) return
  if (!imgList.value || imgList.value.length === 0) {
    $Message({ message: '請先上傳圖片', type: 'warning' })
    return
  }
  saving.value = true

  let imgBase64List = imgList.value.map((img:any, i:number) => {
    const str_data = 'data:'
    const str_base64 = 'base64'
    const index_data = img.url.indexOf(str_data)
    const index_base64 = img.url.indexOf(str_base64)
    if (img.raw == null && index_data >= 0 && index_base64 >= 0) {
      // @ts-ignore
      imgList.value[i].raw = { type: ''}
      // @ts-ignore
      imgList.value[i].raw.type = img.url.substring(index_data+str_data.length, index_base64-1)
      return $commonLib.GetImgBase64(img.url);
    }
    return $commonLib.GetImgBase64(img.raw);
  });

  // #32 — 統一釋放 saving 狀態
  const finalize = () => { saving.value = false }

  Promise.all(imgBase64List).then((res) => {
    const _imgList = res.length > 0 ? res.map((_imgBase64:any, j:number) => {
      return {
        imgPath: _imgBase64,
        imgName: imgList.value[j].name,
        // @ts-ignore
        imgExtension: imgList.value[j].raw.type,
        imgSize: imgList.value[j].size
      }
    }) : []

    const _title = _formaTitle.value;
    const _type = _formaType.value;

    if (props.title.indexOf("新增") >= 0) {
        $WebAPI.InsertImg(userStore.token, _title, _imgList[0].imgPath, _imgList[0].imgExtension, _type, _imgList[0].imgSize, (_res:any) => {
            let _resData = _res.data || "error";
            if (_resData == "error") {
                $Message({ message: `API res ${_resData}`, type: "error" })
                finalize();
                return console.error(`API res ${_resData}`);
            }

            let _result = _resData.result;
            if (_result.errCode != 0) {
                $Message({ message: _result.errMsg, type: "error" })
                finalize();
                return console.error(_result.errMsg);
            }

            $Message({ message: '新增成功', type: "success" })
            emits('update:updateTime', new Date())
            dialogVisible.value = false
            finalize();
        })
        return;
    }

    if (props.title.indexOf("編輯") >= 0) {
        const _id = _formatID.value
        $WebAPI.EditImg(userStore.token, _id, _title, _imgList[0].imgPath, _imgList[0].imgExtension, _type, _imgList[0].imgSize, (_res:any) => {
            let _resData = _res.data || "error";
            if (_resData == "error") {
                $Message({ message: `API res ${_resData}`, type: "error" })
                finalize();
                return console.error(`API res ${_resData}`);
            }

            let _result = _resData.result;
            if (_result.errCode != 0) {
                $Message({ message: _result.errMsg, type: "error" })
                finalize();
                return console.error(_result.errMsg);
            }

            $Message({ message: '編輯成功', type: "success" })
            emits('update:updateTime', new Date())
            dialogVisible.value = false
            finalize();
        })
    }
  }).catch((err) => {
    $Message({ message: `圖片處理失敗：${err instanceof Error ? err.message : String(err)}`, type: 'error' })
    finalize();
  });
}

</script>