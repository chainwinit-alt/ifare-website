<template>
  <div class="param-group" :name="props.dateType">
    <label class="group-title">{{ props.dateTitle }}</label>
    <el-date-picker v-model="modelValue"
                    class="m-datepicker-range"
                    type="daterange"
                    range-separator="至"
                    start-placeholder="起始日期"
                    end-placeholder="結束日期"
                    clearable />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ElDatePicker } from "element-plus";

const props = defineProps(['dateTitle', 'dateType', 'dateValue'])
const emits = defineEmits(['update:dateValue'])

const modelValue = computed({
    get() {
        return props.dateValue
    },
    set(value) {
        console.log(value)
        emits('update:dateValue', value)
    }
})
</script>
