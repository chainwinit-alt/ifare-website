<template>
    <el-dialog
        v-model="dialogVisible"
        :width="width"
        center
        align-center
        append-to-body
        :show-close="false"
        :title="title"
    >
    <template #header>
        <div class="dialog-alert-header">
            <el-icon color="#F56C6C" size="56px">
                <WarnTriangleFilled />
            </el-icon>
            <strong>{{ title || '請再次確認' }}</strong>
        </div>
    </template>
    <p class="dialog-alert-msg">{{ alertMsg }}</p>
    <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>  
          <el-button type="primary" @click="$emit('confirm', confirmApiName, param)">{{ confirmBtnName }}</el-button>  
        </span>
    </template>
    </el-dialog>
</template>

<style scoped>
.dialog-alert-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
}

.dialog-alert-header strong {
    font-size: 18px;
    line-height: 1.4;
}

.dialog-alert-msg {
    display: flex;
    justify-content: center;
    margin: 0;
    color: #303133;
    line-height: 1.7;
    text-align: center;
    white-space: pre-line;
}
</style>

<script setup lang="ts">
import { computed } from "vue";
import {
  ElDialog,
  ElButton,
  ElIcon
} from "element-plus";

const props = defineProps(['alertMsg', 'confirmBtnName', 'isVisable', 'title', 'width', 'confirmApiName', 'param'])
const emits = defineEmits(['update:isVisable', 'confirm'])

const dialogVisible = computed({
    get() {
        return props.isVisable
    },
    set(value) {
        emits('update:isVisable', value)
    }
})
</script>
