<template>
  <div class="param-group" :name="props.radioType">
    <label class="group-title">{{ paramTitle }}</label>
    <el-radio-group v-model="modelValue">
        <el-radio v-for="(radio) in radioList" :label="radio.value">{{ radio.title }}</el-radio>
    </el-radio-group>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { ElRadioGroup, ElRadio } from "element-plus";
import type { RadioObj } from '@/interface/Component';

const props = defineProps(['radioType', 'radioValue'])
const emits = defineEmits(['update:radioValue'])

const paramTitle = ref('')

// all
const radioList = reactive<Array<RadioObj>>([{
    title: '不限', value: '不限'
}])

if (props.radioType == 'dataState') {
    // enable, disable, pending
    paramTitle.value = '資料狀態'
    radioList.push(...[
        {title: '啟用', value: '啟用'},
        {title: '停用', value: '停用'}
    ])
}

if (props.radioType == 'policyState') {
    // enable, disable, pending
    paramTitle.value = '資料狀態'
    radioList.push(...[
        {title: '啟用', value: '啟用'},
        {title: '停用', value: '停用'},
        // {title: '待確認', value: '待確認'}
    ])
}

if (props.radioType == 'permission') {
    paramTitle.value = '權限'
    // reader, editor, manager
    radioList.push(...[
        {title: '檢視者', value: '檢視者'},
        {title: '編輯者', value: '編輯者'},
        {title: '管理者', value: '管理者'}
    ])
}

if (props.radioType == 'releaseState') {
    paramTitle.value = '上架狀態'
    radioList.push(...[
        {title: '上架', value: '上架'},
        {title: '下架', value: '下架'}
    ])
}

const modelValue = computed({
    get() {
        return props.radioValue
    },
    set(value) {
        console.log(value)
        emits('update:radioValue', value)
    }
})

</script>
