<template>
  <div class="section-main-card card-fullsize card-table" :name="props.tbName">
    <div class="part-table">
      <div class="table-toolbar">
        <div class="table-toolbar__summary">
          <strong>{{ totalRows }}</strong>
          <span v-if="totalRows > 0">目前顯示 {{ currentRangeText }}</span>
          <span v-else>目前沒有資料</span>
        </div>
        <span class="table-toolbar__meta" v-if="props.tbName">{{ props.tbName }}</span>
      </div>
      <el-table
        :data="paginatedRows"
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
            <!-- 2026-05-25 #35 — 「資料狀態」column header 加 tooltip 區分於「上架狀態」 -->
            <template #header v-if="column.opts.type == 'state_data'">
              <span class="state-header">
                {{ column.label }}
                <el-tooltip placement="top" effect="dark">
                  <template #content>
                    <div style="max-width: 240px; line-height: 1.6">
                      <strong>資料狀態</strong>(啟用 / 停用)<br />
                      指這筆<strong>資料本身</strong>是否啟用,停用後前台會自動隱藏。<br />
                      不同於「上架狀態」(上架日期 / 下架日期),後者是控制公開時段。
                    </div>
                  </template>
                  <el-icon class="state-info-icon" aria-label="說明資料狀態與上架狀態的差異">
                    <QuestionFilled />
                  </el-icon>
                </el-tooltip>
              </span>
            </template>
            <!-- 2026-05-25 #35 — 「資料狀態」改 el-tag + icon,視覺上跟未來的「上架狀態」明顯區分 -->
            <template #default="scope" v-if="column.opts.type == 'state_data'">
              <el-tag
                :type="scope.row.state_data == '停用' ? 'info' : 'primary'"
                :effect="scope.row.state_data == '停用' ? 'plain' : 'light'"
                size="small"
                class="state-data-tag"
                :title="scope.row.state_data == '停用' ? '此資料目前停用,前台不顯示' : '此資料目前啟用'"
              >
                <span class="state-data-dot" :class="scope.row.state_data == '停用' ? 'is-off' : 'is-on'"></span>
                {{ scope.row.state_data }}
              </el-tag>
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
        <template #empty>
          <div class="table-empty">
            <strong>目前沒有符合條件的資料</strong>
            <span>可以調整搜尋條件，或新增第一筆內容。</span>
          </div>
        </template>
      </el-table>
    </div>
    <div class="part-page">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :background="pageBg"
        :page-sizes="[10, 20, 50, 100]"
        :total="totalRows"
        @current-change="currentPageChange"
        layout="total, prev, pager, next, jumper, sizes"
      />
    </div>
  </div>
  <DialogAlert v-model:isVisable="isDialogAlertVisible" :alertMsg="alertMsg" confirmBtnName="刪除" title="刪除資料" width="min(420px, 92vw)" @confirm="deleteConfirm" :confirmApiName="confirmApiName" :param="param"/>
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
  ElTag,
  ElTooltip,
  ElIcon,
type UploadUserFile,
} from "element-plus";
import { QuestionFilled } from "@element-plus/icons-vue";
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

const totalRows = computed(() => tbData.value.length);
const paginatedRows = computed(() =>
  tbData.value.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value),
);
const currentRangeText = computed(() => {
  if (totalRows.value === 0) return "0 - 0";

  const start = (currentPage.value - 1) * pageSize.value + 1;
  const end = Math.min(currentPage.value * pageSize.value, totalRows.value);
  return `${start} - ${end} / ${totalRows.value}`;
});

function clampCurrentPage() {
  const maxPage = Math.max(1, Math.ceil(totalRows.value / pageSize.value));
  if (currentPage.value > maxPage) {
    currentPage.value = maxPage;
  }
}

watch(totalRows, () => {
  clampCurrentPage();
});

watch(pageSize, () => {
  currentPage.value = 1;
  clampCurrentPage();
});

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

function getDeleteTargetLabel(row: any) {
  const candidates = [
    row.title,
    row.question,
    row.user_name,
    row.name,
    row.account,
    row.email,
    row.id ? `編號 ${row.id}` : "",
  ];
  const label = candidates.find((value) => value !== undefined && value !== null && `${value}`.trim() !== "");

  return label ? `${label}` : "這筆資料";
}

function openDeleteConfirm(row: any, apiName: string) {
  const label = getDeleteTargetLabel(row);

  param.value = { id: row.id };
  confirmApiName.value = apiName;
  alertMsg.value = `確定要刪除「${label}」嗎？\n刪除後無法復原。`;
  isDialogAlertVisible.value = true;
}

const handleClick_Articles_Welfare = (_data: any, _btnType: string) => {
  const _id = _data.row.id;
  if (_btnType != "刪除") return _global?.$router.push({ name: "Articles_Welfare_Detail", query: { id: _id } });

  openDeleteConfirm(_data.row, 'DeleteArticlesWelfare')
};

const handleClick_Articles_Lazy = (_data: any, _btnType: string) => {
  const _id = _data.row.id;
  if (_btnType != "刪除") return _global?.$router.push({ name: "Articles_Lazy_Detail", query: { id: _id } });

  openDeleteConfirm(_data.row, 'DeleteArticlesLazy')
};

const handleClick_IFare_QA = (_data: any, _btnType: string) => {
  const _id = _data.row.id;
  if (_btnType != "刪除") return _global?.$router.push({ name: "IFare_QA_Detail", query: {id: _id} });

  openDeleteConfirm(_data.row, 'DeleteFareQA')
};

const handleClick_IFare_OfficeUnit = (_data: any) => {
  const _id = _data.row.id;
  _global?.$router.push({ name: "IFare_OfficeUnit_Detail", query: {id: _id} });
};

const handleClick_IFare_Policy = (_data: any, _btnType: string) => {
  const _id = _data.row.id;
  if (_btnType != "刪除") return _global?.$router.push({ name: "IFare_Policy_Detail", query: {id: _id} });

  openDeleteConfirm(_data.row, 'DeleteFarePolicy')
};

const handleClick_Collaborator = (_data: any, _btnType: string) => {
  const _id = _data.row.id;
  if (_btnType != "刪除") return _global?.$router.push({ name: "Collaborator_Detail", query: { id: _id } });

  openDeleteConfirm(_data.row, 'DeleteCollaborator')
};

const handleClick_News = (_data: any, _btnType: string) => {
  const _id = _data.row.id;
  if (_btnType != "刪除") return _global?.$router.push({ name: "News_Detail", query: { id: _id } });

  openDeleteConfirm(_data.row, 'DeleteNews')
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
    openDeleteConfirm(_data.row, 'DeleteImgManager')
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

<style lang="scss" scoped>
.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.table-toolbar__summary {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  color: #606266;

  strong {
    font-size: 24px;
    font-weight: 700;
    color: #303133;
  }

  span {
    font-size: 13px;
  }
}

.table-toolbar__meta {
  font-size: 12px;
  color: #909399;
}

.table-empty {
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #909399;

  strong {
    font-size: 15px;
    color: #303133;
  }

  span {
    font-size: 13px;
  }
}

// 2026-05-25 #35 — 資料狀態 column 視覺強化
.state-header {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.state-info-icon {
  color: #909399;
  font-size: 14px;
  cursor: help;

  &:hover {
    color: #ea5504;
  }
}

.state-data-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.state-data-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;

  &.is-on {
    background: #409eff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.18);
  }

  &.is-off {
    background: #c0c4cc;
  }
}
</style>
