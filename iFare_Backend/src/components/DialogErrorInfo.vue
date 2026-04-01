<template>
    <el-dialog
        v-model="dialogVisible"
        width="360"
        center
        align-center
        append-to-body
        :show-close="false"
        :title="title"
    >
    <template #header>
        <el-icon color="#67C23A" size="72px">
            <SuccessFilled />
        </el-icon>
    </template>
    <span class="dialog-alert-msg">{{ alertMsg }}</span>
    <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="dialogVisible = false">確定</el-button>
        </span>
    </template>
    </el-dialog>
</template>

<style scope>
.dialog-alert-msg {
    display: flex;
    justify-content: center;
}
</style>

<script setup lang="ts">
import { ref, computed, getCurrentInstance } from "vue";
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