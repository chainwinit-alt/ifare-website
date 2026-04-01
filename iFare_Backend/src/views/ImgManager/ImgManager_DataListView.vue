<template>
    <main-header>
        <template #btnsRight>
        <el-button
            :icon="Plus"
            type="primary"
            size="large"
            @click="AddImgClick"
            >新增圖片</el-button
        >
        </template>
    </main-header>
    <el-scrollbar class="main-scrollbar">
        <card-search-param
            v-model:search-params="searchParams"
            search-mode="ImgManager"
            :defaultParams="defaultParams"
        />
        <card-table
            :column-info-list="columnInfoList"
            :tb-data-list="tbDataList"
            tb-name="ImgManager"
            v-model:updateTime="editUpdateTime"
        />
    </el-scrollbar>
    <DialogAddEditImg v-model:isVisable="isVisableAddEditDialog" v-model:updateTime="addUpdateTime" title="新增圖片"></DialogAddEditImg>
</template>

<script lang="ts" setup>
    import { ref, reactive, watch, getCurrentInstance } from "vue";
    import { ElButton, ElScrollbar } from "element-plus";
    import { Plus } from "@element-plus/icons-vue";
    import type { ColumnInfo, TbDataInfo_ArticlesLazy, TbDataInfo_Collaborator, TbDataInfo_ImgManager } from "@/interface/MTable";
    import MainHeader from "@/components/MainHeader.vue";
    import CardSearchParam from "@/components/CardSearchParam.vue";
    import CardTable from "@/components/CardTable.vue";
    import DialogAddEditImg from "@/components/DialogAddEditImg.vue";
    import { useUserStore } from "@/stores/user";
    import { useRoute } from "vue-router";

    const app = getCurrentInstance();
    const $commonLib = app?.appContext.config.globalProperties.$CommonLib;
    const $WebAPI = app?.appContext.config.globalProperties.$WebAPI;
    const userStore = useUserStore();
    const _route = useRoute()

    const defaultParams = ref(_route.query)
    const searchParams = ref();
    const isVisableAddEditDialog = ref(false)
    const title_AddEditDialog = ref()

    const addUpdateTime = ref()
    const editUpdateTime = ref()

    const columnInfoList = reactive<Array<ColumnInfo>>([
        { prop: "img_preview", label: "圖片顯示" },
        { prop: "title", label: "名稱" },
        { prop: "type", label: "圖片類別"},
        { prop: "size", label: "檔案大小"},
        { prop: "user_update", label: "上傳人員" },
        { prop: "date_update", label: "上傳日期" },
        {
            prop: "operate",
            label: "操作",
            opts: { type: "url", info: [{ label: "複製連結" }, { label: "編輯" }, { label: "刪除" }] },
        },
    ]);
    const tbDataList = reactive<Array<TbDataInfo_ImgManager>>([]);

    function AddImgClick() {
        isVisableAddEditDialog.value = !isVisableAddEditDialog.value
    }

    function WebAPI_GetDataList(
        _updateDateStart?: string,
        _updateDateEnd?: string,
        _type?: string,
        _searchName?: string
    ) {
        $WebAPI.GetImgManagerList(
            userStore.token,
            _updateDateStart,
            _updateDateEnd,
            _type,
            _searchName,
            (res: any) => {
            console.log(res);
            let _resData = res.data || "error";
            if (_resData == "error") return console.error(`API res ${_resData}`);

            let _res = _resData.result;

            if (_res.errCode != 0) return console.error(_res.errMsg);

            let list: Array<TbDataInfo_ImgManager> = _res.result.map(
                (item: any, i: number) => {
                return {
                    id: item.id,
                    title: item.title,
                    type: item.type,
                    size: item.size,
                    imgPath: item.imgPath,
                    user_update: item.updateUserName || "-",
                    date_update: item.updateTime || "-",
                };
                }
            );

            tbDataList.splice(0, tbDataList.length, ...list);
            }
        );
    }

    WebAPI_GetDataList()

    watch(searchParams, (newVal, oldVal) => {
        console.log(newVal);

        let uploadDate = newVal.datepicker.upload || [];
        let searchWord = newVal.searchInput.word || "";
        let imgManagerType = newVal.itemSelect.imgManagerType || null;

        WebAPI_GetDataList(
            uploadDate.length >= 2 ? uploadDate[0] : undefined,
            uploadDate.length >= 2 ? uploadDate[1] : undefined,
            imgManagerType,
            searchWord
        );
    });

    watch(addUpdateTime, (newVal, oldVal) => {
        if (newVal != oldVal) {
            WebAPI_GetDataList()
        }
    })
    watch(editUpdateTime, (newVal, oldVal) => {
        if (newVal != oldVal) {
            WebAPI_GetDataList()
        }
    })
</script>