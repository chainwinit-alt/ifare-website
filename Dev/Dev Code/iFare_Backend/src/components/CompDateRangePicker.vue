<template>
  <div class="param-group" :name="props.dateType">
    <label class="group-title">{{ props.dateTitle }}</label>
    <el-date-picker v-model="modelValue"
                    class="m-datepicker-range"
                    type="daterange"
                    format="YYYY/MM/DD"
                    value-format="MM/DD/YYYY"
                    range-separator="至"
                    start-placeholder="起始日期"
                    end-placeholder="結束日期"
                    :shortcuts="dateShortcuts"
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
        emits('update:dateValue', value)
    }
})

function addDays(date: Date, days: number) {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
}

function startOfToday() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
}

const dateShortcuts = [
    {
        text: '今天',
        value: () => {
            const today = startOfToday()
            return [today, today]
        },
    },
    {
        text: '本週',
        value: () => {
            const today = startOfToday()
            const start = addDays(today, -today.getDay())
            const end = addDays(start, 6)
            return [start, end]
        },
    },
    {
        text: '本月',
        value: () => {
            const today = startOfToday()
            const start = new Date(today.getFullYear(), today.getMonth(), 1)
            const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
            return [start, end]
        },
    },
    {
        text: '最近 7 天',
        value: () => {
            const today = startOfToday()
            return [addDays(today, -6), today]
        },
    },
    {
        text: '最近 30 天',
        value: () => {
            const today = startOfToday()
            return [addDays(today, -29), today]
        },
    },
]
</script>
