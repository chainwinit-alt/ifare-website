<template>
  <div class="section-main-card card-fullsize card-table" :name="props.tbName">
    <div class="part-table">
      <el-table
        :data="
          tbData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
        "
        stripe
      >
        <template v-for="column in columnInfoList">
          <el-table-column
            :prop="column.prop"
            :label="column.label"
            v-if="!column.opts && 
              column.prop!='size' && 
              column.prop!='img_preview' && 
              column.prop.indexOf('date_') < 0 && 
              column.prop.indexOf('state') < 0 &&
              column.prop.indexOf('user') < 0 &&
              column.prop.indexOf('email') < 0 &&
              column.prop.indexOf('permission') < 0 &&
              column.prop.indexOf('type') < 0 &&
              column.prop.indexOf('id') < 0 &&
              column.prop.indexOf('title') < 0 &&
              column.prop.indexOf('domicile') < 0"
          />
          <el-table-column 
            :prop="column.prop"
            :label="column.label"
            min-width="120"
            v-else-if="column.prop.indexOf('title') >= 0"
          />
          <el-table-column 
            :prop="column.prop"
            :label="column.label"
            width="80"
            v-else-if="column.prop.indexOf('domicile') >= 0 ||
              column.prop.indexOf('permission') >= 0"
          />
          <el-table-column 
            :prop="column.prop"
            :label="column.label"
            width="100"
            v-else-if="column.prop.indexOf('date_') >= 0 || 
              column.prop.indexOf('state') >= 0 ||
              column.prop.indexOf('id') >= 0 ||
              column.prop.indexOf('type') >= 0"
          />
          <el-table-column 
            :prop="column.prop"
            :label="column.label"
            width="150"
            v-else-if="column.prop.indexOf('user') >= 0 &&
              column.prop.indexOf('email') < 0"
          />
          <el-table-column 
            :prop="column.prop"
            :label="column.label"
            width="200"
            v-else-if="column.prop.indexOf('email') >= 0"
          />
          <el-table-column
            :prop="column.prop"
            :label="column.label"
            width="200"
            v-else-if="column.prop=='img_preview'">
            <template #default="scope">
              <ElImage :src="scope.row.imgPath" style="width: 120px;" fit="contain" />
            </template>
          </el-table-column>
          <el-table-column
            :prop="column.prop"
            :label="column.label"
            width="200"
            v-else-if="column.prop=='size'">
            <template #default="scope">
              <el-text>{{ Math.round(scope.row.size / 1024 * 100) / 100 }} KB</el-text>
            </template>
          </el-table-column>
          <el-table-column :prop="column.prop" :label="column.label" width="180" v-else>
            <template #default="scope" v-if="column.opts.type == 'state_data'">
              <el-text :type="scope.row.state_data == '停用' ? 'danger' : ''">{{
                scope.row.state_data
              }}</el-text>
            </template>
            <template #default="scope" v-if="column.opts.type == 'url'">
              <el-button
                v-for="btn in column.opts.info"
                link
                :type="btn.label != '刪除' ? 'primary' : ''"
                @click="handleClick(scope, btn.label)"
                >{{ btn.label }}</el-button
              >
            </template>
          </el-table-column>
        </template>
      </el-table>
    </div>
    <div class="part-page">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :background="pageBg"
        :page-sizes="[10, 50, 100]"
        :total="tbData.length"
        @current-change="currentPageChange"
        layout="total, prev, pager, next, jumper, sizes"
      />
    </div>
  </div>
  <DialogAlert v-model:isVisable="isDialogAlertVisible" :alertMsg="alertMsg" confirmBtnName="刪除" width="15%" @confirm="deleteConfirm" :confirmApiName="confirmApiName" :param="param"/>
  <DialogAddEditImg v-model:isVisable="isVisableAddEditImgDialog" v-model:format_title="editImgTitle" v-model:format_type="editImgType" v-model:format_img="editImg" v-model:format_id="editImgID" v-model:updateTime="editImgUpdateTime" title="編輯圖片"></DialogAddEditImg>
  <DialogErrorInfo v-model:isVisable="isVisableErrorInfoDialog" alertMsg="複製連結成功！" />
</template>

<script setup lang="ts">
import { ref, computed, getCurrentInstance, h, watch } from "vue";
import {
  ElTable,
  ElTableColumn,
  ElText,
  ElButton,
  ElPagination,
  ElImage,
type UploadUserFile,
} from "element-plus";
import { stringifyQuery } from "vue-router";
import { useUserStore } from "@/stores/user";
import DialogAlert from './DialogAlert.vue'
import DialogAddEditImg from './DialogAddEditImg.vue'
import DialogErrorInfo from "./DialogErrorInfo.vue";

const app = getCurrentInstance();
const _global = app?.appContext.config.globalProperties;
const props = defineProps(["columnInfoList", "tbDataList", "tbName", "updateTime"]);
const emits = defineEmits(["update:tbDataList", "update:updateTime"]);
const $WebAPI = app?.appContext.config.globalProperties.$WebAPI;
const userStore = useUserStore();
const $Message = app?.appContext.config.globalProperties.$message;

const isDialogAlertVisible = ref(false)
const isVisableErrorInfoDialog = ref(false)
const alertMsg = ref('是否刪除資料？')
const confirmApiName = ref('')
const param = ref()

const isVisableAddEditImgDialog = ref(false)
const editImgTitle = ref()
const editImgType = ref()
const editImgID = ref()
const editImg = ref<UploadUserFile[]>([])
const editImgUpdateTime = ref()

watch(editImgUpdateTime, (newVal, oldVal) => {
  if (newVal != oldVal) {
    emits("update:updateTime", newVal);
  }
})

const tbData = computed({
  get() {
    return props.tbDataList;
  },
  set(value) {
    emits("update:tbDataList", value);
  },
});

const tbUpdateTime = computed({
  get() {
    return props.updateTime;
  },
  set(value) {
    emits("update:updateTime", value);
  },
});

const currentPage = ref(1);
const pageSize = ref(10);
const pageBg = ref(false);

const currentPageChange = (page: any) => {
  console.log("page: ", page);
  currentPage.value = page;
};

const handleClick = (_data: any, _btnType: string) => {
  console.log("table link clicked.");
  console.log(_data);
  console.log(_btnType);
  switch (props.tbName) {
    case "Account":
      handleClick_Account(_data);
      break;
    case "Code_Domicile":
    case "Code_Identity":
    case "Code_Income":
    case "Code_Keyword":
    case "Code_Policy":
    case "Code_Recipient":
      handleClick_Code(_data);
      break;
    case "Articles_Welfare":
      handleClick_Articles_Welfare(_data, _btnType);
      break;
    case "Articles_Lazy":
      handleClick_Articles_Lazy(_data, _btnType);
      break;
    case "IFare_QA":
      handleClick_IFare_QA(_data, _btnType);
      break;
    case "IFare_OfficeUnit":
      handleClick_IFare_OfficeUnit(_data);
      break;
    case "IFare_Policy":
      handleClick_IFare_Policy(_data, _btnType);
      break;
    case "Collaborator":
      handleClick_Collaborator(_data, _btnType);
      break;
    case "News":
      handleClick_News(_data, _btnType);
      break;
    case "ImgManager":
      handleClick_ImgManager(_data, _btnType)
      break;
  }
};

const handleClick_Account = (_data: any) => {
  console.log("-----> handleClick_Account");
  // const permission = _data.row.permission
  const _id = _data.row.id;
  _global?.$router.push({ name: "Account_Detail", query: { id: _id } });
};

const handleClick_Code = (_data: any) => {
  const editPageName =
    _global?.$route.path.replace("/", "").replace("-", "_") + "_Edit";
  console.log(editPageName);
  const _id = _data.row.id;
  console.log(_id);
  _global?.$router.push({ name: editPageName, query: { id: _id } });
};

const handleClick_Articles_Welfare = (_data: any, _btnType: string) => {
  const _id = _data.row.id;
  if (_btnType != "刪除") return _global?.$router.push({ name: "Articles_Welfare_Detail", query: { id: _id } });

  param.value = { id: _id}
  isDialogAlertVisible.value = true
  confirmApiName.value = 'DeleteArticlesWelfare'
};

const handleClick_Articles_Lazy = (_data: any, _btnType: string) => {
  const _id = _data.row.id;
  if (_btnType != "刪除") return _global?.$router.push({ name: "Articles_Lazy_Detail", query: { id: _id } });

  param.value = { id: _id}
  isDialogAlertVisible.value = true
  confirmApiName.value = 'DeleteArticlesLazy'
};

const handleClick_IFare_QA = (_data: any, _btnType: string) => {
  const _id = _data.row.id;
  if (_btnType != "刪除") return _global?.$router.push({ name: "IFare_QA_Detail", query: {id: _id} });

  param.value = { id: _id}
  isDialogAlertVisible.value = true
  confirmApiName.value = 'DeleteFareQA'
};

const handleClick_IFare_OfficeUnit = (_data: any) => {
  const _id = _data.row.id;
  _global?.$router.push({ name: "IFare_OfficeUnit_Detail", query: {id: _id} });
};

const handleClick_IFare_Policy = (_data: any, _btnType: string) => {
  const _id = _data.row.id;
  if (_btnType != "刪除") return _global?.$router.push({ name: "IFare_Policy_Detail", query: {id: _id} });

  param.value = { id: _id}
  isDialogAlertVisible.value = true
  confirmApiName.value = 'DeleteFarePolicy'
};

const handleClick_Collaborator = (_data: any, _btnType: string) => {
  const _id = _data.row.id;
  if (_btnType != "刪除") return _global?.$router.push({ name: "Collaborator_Detail", query: { id: _id } });

  param.value = { id: _id}
  isDialogAlertVisible.value = true
  confirmApiName.value = 'DeleteCollaborator'
};

const handleClick_News = (_data: any, _btnType: string) => {
  const _id = _data.row.id;
  if (_btnType != "刪除") return _global?.$router.push({ name: "News_Detail", query: { id: _id } });

  param.value = { id: _id}
  isDialogAlertVisible.value = true
  confirmApiName.value = 'DeleteNews'
};

const handleClick_ImgManager = async (_data:any, _btnType: string) => {
  const _id = _data.row.id;

  if (_btnType == "複製連結") {
    try {
      await navigator.clipboard.writeText(`https://www.i-fare.org.tw/ifare_api/api/services/app/Img/GetmImg?imgID=${_id}`)
      isVisableErrorInfoDialog.value = !isVisableErrorInfoDialog.value
    } catch (error) {
      console.error(error)
    }
    return;
  }

  if (_btnType == "編輯") {
    editImgID.value = _data.row.id
    editImgTitle.value = _data.row.title
    editImgType.value = _data.row.type
    editImg.value = [{
      name: _data.row.title,
      url: _data.row.imgPath,
      size: _data.row.size
    }]
    isVisableAddEditImgDialog.value = !isVisableAddEditImgDialog.value
    return;
  }

  if (_btnType == "刪除") {
    param.value = { id: _id}
    isDialogAlertVisible.value = true
    confirmApiName.value = 'DeleteImgManager'
    return;
  }
}

const deleteConfirm = (callApiName:string, _param:any) => {
  const _id = _param.id

  switch (callApiName) {
    case 'DeleteArticlesWelfare':
      $WebAPI.DeleteArticlesWelfare(userStore.token, _id, (res: any) => {
        let _resData = res.data || "error";
        if (_resData == "error") {
          $Message({ message: `API res ${_resData}`, type: "error" })
          return console.error(`API res ${_resData}`);
        }

        let _res = _resData.result;
        if (_res.errCode != 0) {
          $Message({ message: '_res.errMsg', type: "error" })
          return console.error(_res.errMsg);
        }

        let removeIndex = tbData.value.findIndex((item:any) => item.id == _id)
        tbData.value.splice(removeIndex, 1)
        $Message({ message: '刪除成功', type: "success" })
      });
      break;
    case 'DeleteArticlesLazy':
      $WebAPI.DeleteArticlesLazy(userStore.token, _id, (res: any) => {
        let _resData = res.data || "error";
        if (_resData == "error") {
          $Message({ message: `API res ${_resData}`, type: "error" })
          return console.error(`API res ${_resData}`);
        }

        let _res = _resData.result;
        if (_res.errCode != 0) {
          $Message({ message: '_res.errMsg', type: "error" })
          return console.error(_res.errMsg);
        }

        let removeIndex = tbData.value.findIndex((item:any) => item.id == _id)
        tbData.value.splice(removeIndex, 1)
        $Message({ message: '刪除成功', type: "success" })
      });
      break;
    case 'DeleteFareQA':
      $WebAPI.DeleteFareQA(userStore.token, _id, (res: any) => {
        let _resData = res.data || "error";
        if (_resData == "error") {
          $Message({ message: `API res ${_resData}`, type: "error" })
          return console.error(`API res ${_resData}`);
        }

        let _res = _resData.result;
        if (_res.errCode != 0) {
          $Message({ message: '_res.errMsg', type: "error" })
          return console.error(_res.errMsg);
        }

        let removeIndex = tbData.value.findIndex((item:any) => item.id == _id)
        tbData.value.splice(removeIndex, 1)
        $Message({ message: '刪除成功', type: "success" })
      });
      break;
    case 'DeleteFarePolicy':
      $WebAPI.DeleteFarePolicy(userStore.token, _id, (res: any) => {
        let _resData = res.data || "error";
        if (_resData == "error") {
          $Message({ message: `API res ${_resData}`, type: "error" })
          return console.error(`API res ${_resData}`);
        }

        let _res = _resData.result;
        if (_res.errCode != 0) {
          $Message({ message: '_res.errMsg', type: "error" })
          return console.error(_res.errMsg);
        }

        let removeIndex = tbData.value.findIndex((item:any) => item.id == _id)
        tbData.value.splice(removeIndex, 1)
        $Message({ message: '刪除成功', type: "success" })
      });
      break;
    case 'DeleteCollaborator':
      $WebAPI.DeleteCollaborator(userStore.token, _id, (res: any) => {
        let _resData = res.data || "error";
        if (_resData == "error") {
          $Message({ message: `API res ${_resData}`, type: "error" })
          return console.error(`API res ${_resData}`);
        }

        let _res = _resData.result;
        if (_res.errCode != 0) {
          $Message({ message: '_res.errMsg', type: "error" })
          return console.error(_res.errMsg);
        }

        let removeIndex = tbData.value.findIndex((item:any) => item.id == _id)
        tbData.value.splice(removeIndex, 1)
        $Message({ message: '刪除成功', type: "success" })
      });
      break;
    case 'DeleteNews':
      $WebAPI.DeleteNews(userStore.token, _id, (res: any) => {
        let _resData = res.data || "error";
        if (_resData == "error") {
          $Message({ message: `API res ${_resData}`, type: "error" })
          return console.error(`API res ${_resData}`);
        }

        let _res = _resData.result;
        if (_res.errCode != 0) {
          $Message({ message: '_res.errMsg', type: "error" })
          return console.error(_res.errMsg);
        }

        let removeIndex = tbData.value.findIndex((item:any) => item.id == _id)
        tbData.value.splice(removeIndex, 1)
        $Message({ message: '刪除成功', type: "success" })
      });
      break;
    case "DeleteImgManager":
      console.log(_id)
      $WebAPI.DeleteImg(userStore.token, _id, (res: any) => {
          let _resData = res.data || "error";
          if (_resData == "error") {
            $Message({ message: `API res ${_resData}`, type: "error" })
            return console.error(`API res ${_resData}`);
          }

          let _res = _resData.result;
          if (_res.errCode != 0) {
            $Message({ message: '_res.errMsg', type: "error" })
            return console.error(_res.errMsg);
          }

          let removeIndex = tbData.value.findIndex((item:any) => item.id == _id)
          tbData.value.splice(removeIndex, 1)
          $Message({ message: '刪除成功', type: "success" })
        });
      break;
  }

  isDialogAlertVisible.value = false
}
</script>
