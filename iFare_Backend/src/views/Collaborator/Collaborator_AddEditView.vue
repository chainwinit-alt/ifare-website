<template>
  <main-header>
    <template #subtitle v-if="$route.name == 'Collaborator_Edit'">
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
      class="section-main-card card-fullsize card-collaborator card-input-format"
    >
      <div class="card-info column-wrap">
        <div class="item-group-list">
          <div class="item-group">
            <label class="input-title required">名稱</label>
            <el-input v-model="input_title" type="text" placeholder="輸入名稱" />
          </div>
          <div class="item-group">
            <label class="input-title required">服務項目</label>
            <el-input v-model="input_serve" type="text" placeholder="輸入服務項目" />
          </div>
          <div class="item-group">
            <label class="input-title required">電話</label>
            <el-input v-model="input_tel" type="text" placeholder="輸入電話" />
          </div>
          <div class="item-group">
            <label class="input-title required">連結</label>
            <el-input v-model="input_url" type="text" placeholder="輸入連結" />
          </div>
        </div>
        <div class="item-group-list">
          <div class="item-group upload-drag">
            <label class="input-title">上傳圖片</label>
            <el-upload class="card-upload"
                        action=""
                        v-model:file-list="imgList"
                        list-type="picture"
                        :show-file-list="false"
                        accept=".jpg, .png"
                        :limit="1"
                        :auto-upload="false"
                        :on-change="getImage"
                        :on-exceed="uploadNewImg"
                        ref="upload"
                        drag>
                <img v-if="imgPreview" :src="imgPreview" style="width:100%; object-fit: contain;"/>
                <el-icon v-show="!imgPreview" class="el-icon--upload"><upload-filled /></el-icon>
                <div v-show="!imgPreview" class="el-upload__text">將圖片拖曳到這裡，或<em>點擊上傳</em></div>
                <template #tip>
                    <div class="el-upload__tip">格式： JPG or PNG、56px * 56px、500KB以下</div>
                </template>
            </el-upload>
          </div>
        </div>
      </div>
    </div>
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
import { ref, reactive, getCurrentInstance } from "vue";
import {
  ElButton,
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

const app = getCurrentInstance();
const $commonLib = app?.appContext.config.globalProperties.$CommonLib;
const $Message = app?.appContext.config.globalProperties.$message
const $WebAPI = app?.appContext.config.globalProperties.$WebAPI;
const _$route = app?.appContext.config.globalProperties.$route;
const _router = useRouter();
const userStore = useUserStore();

const routeNameType = _$route?.name?.toString().toLocaleLowerCase() || "";
const ids = _$route?.query.id ? [parseInt(_$route?.query.id.toString())] : null
const createdate = ref("")

const input_title = ref('')
const input_serve = ref('')
const input_tel = ref('')
const input_url = ref('')

const imgPreview = ref()

const switch_state = ref(true);

const upload = ref<UploadInstance>();
const imgList = ref<UploadUserFile[]>([])


function getImage(file:any, fileList:any){
  console.error('【getImage】')
  console.log(file)

  if (file.size > 500000) return $Message({message: "圖片大小不可超過500KB", type: 'error'})
  if (file.raw.type !== 'image/jpg' && file.raw.type !== 'image/jpeg' && file.raw.type !== 'image/png') return $Message({message: "檔案類型只限.jpg, .png", type: 'error'})

  imgPreview.value = file.url
}

function uploadNewImg(rawfile:any){
  console.error('【uploadNewImg】')
  console.log(rawfile)
  upload.value!.clearFiles()
  const file = rawfile[0] as UploadRawFile
  file.uid = genFileId()
  upload.value!.handleStart(file)
}

if (routeNameType.indexOf("edit") >= 0) {
  $WebAPI.GetCollaboratorList(
    userStore.token,
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
      let _data = _res.result[0]
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

function SaveAction() {
  console.log(imgList.value)
  if (!input_title.value) {
    return $Message({ message: `【標題】不可為空`, type: "warning" })
  }
  if (!input_serve.value) {
    return $Message({ message: `【服務項目】不可為空`, type: "warning" })
  }
  if (!input_tel.value) {
    return $Message({ message: `【電話】不可為空`, type: "warning" })
  }
  if (!input_url.value) {
    return $Message({ message: `【連結】不可為空`, type: "warning" })
  }

  $commonLib.GetImgBase64(imgList.value.length > 0 ? imgList.value[0].raw : 'NA').then((res:any)=> {

    const _title = input_title.value
    const _serviceItem = input_serve.value
    const _tel = input_tel.value
    const _url = input_url.value
    const _imageFile = res != 'NA' ? res : null
    const _imageName = res != 'NA' ? imgList.value[0].name : null
    const _imageExtension = res != 'NA' ? imgList.value[0].raw?.type : null
    const _state = switch_state.value

    if (routeNameType.indexOf("add") >= 0) {
      console.log("[Add] Save action");
      $WebAPI.InsertCollaborator(userStore.token, _title, _serviceItem, _tel, _url, _imageFile, _imageName, _imageExtension, _state,(res: any) => {
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
          $commonLib.GuideToPage('Collaborator_DataList')
        }
      );
    }

    if (routeNameType.indexOf("edit") >= 0) {
      console.log("[Edit] Save action");
      const _id = ids? ids[0] : 0
      if (_id == 0) return false
      $WebAPI.UpdateCollaborator(userStore.token, _id, _title, _serviceItem, _tel, _url, _imageFile, _imageName, _imageExtension, _state,(res: any) => {
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
          // $commonLib.GuideToPage('Collaborator_DataList')
          _router.back();
        }
      );
    }
  })
}
</script>
