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
                <el-button type="primary">上傳圖片</el-button>
                <template #tip>
                    <div class="el-upload__tip">只能上傳 jpg/png</div>
                </template>
            </el-upload>
        </el-form-item>
    </el-form>
    <template #footer>
        <span class="dialog-footer">
          <el-button @click="CancelAction">取消</el-button>  
          <el-button type="primary" @click="SaveAction">確定</el-button>  
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

function getImage(file: any, fileList: any) {
  console.error("【getImage】");
  console.log(file);
  if (file.size > 500000) {
    upload.value!.handleRemove(file);
    $Message({ message: "圖片大小不可超過500KB", type: "error" });
    return false;
  }
  if (
    file.raw.type !== "image/jpg" &&
    file.raw.type !== "image/jpeg" &&
    file.raw.type !== "image/png"
  )
    return $Message({ message: "檔案類型只限.jpg, .png", type: "error" });
}

function InitInput() {
    _formaTitle.value = null
    _formaType.value = "福利文章"
    imgList.value.splice(0)
}

function CancelAction() {
    dialogVisible.value = false
}

function SaveAction() {
  console.log(imgList.value);

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
                return console.error(`API res ${_resData}`);
            }

            let _result = _resData.result;
            if (_result.errCode != 0) {
                $Message({ message: _result.errMsg, type: "error" })
                return console.error(_result.errMsg);
            }

            $Message({ message: '新增成功', type: "success" })
            emits('update:updateTime', new Date())
            dialogVisible.value = false
        })
        return;
    }

    if (props.title.indexOf("編輯") >= 0) {
        const _id = _formatID.value
        $WebAPI.EditImg(userStore.token, _id, _title, _imgList[0].imgPath, _imgList[0].imgExtension, _type, _imgList[0].imgSize, (_res:any) => {
            let _resData = _res.data || "error";
            if (_resData == "error") {
                $Message({ message: `API res ${_resData}`, type: "error" })
                return console.error(`API res ${_resData}`);
            }

            let _result = _resData.result;
            if (_result.errCode != 0) {
                $Message({ message: _result.errMsg, type: "error" })
                return console.error(_result.errMsg);
            }

            $Message({ message: '編輯成功', type: "success" })
            emits('update:updateTime', new Date())
            dialogVisible.value = false
        })
    }
  });
}

</script>