<template>
  <div class="param-group" :name="props.inputName">
    <label class="group-title">{{ props.inputTitle }}</label>
    <el-input v-model="modelValue" :placeholder="inputPlaceholder" :type="$props.inputName == 'searchNum' ? 'number' : 'text'"/>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ElInput } from "element-plus";

const props = defineProps(['inputTitle', 'inputName', 'inputPlaceholder', 'inputValue'])
const emits = defineEmits(['update:inputValue'])

const modelValue = computed({
    get() {
        return props.inputValue
    },
    set(value) {
        emits('update:inputValue', value)
    }
})

</script>
