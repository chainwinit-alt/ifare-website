<template>
  <div class="param-group" :name="props.selectType">
    <label class="group-title">{{ paramTitle }}</label>
    <el-select 
      v-model="modelValue" 
      :placeholder="placeholderTxt" 
      :multiple="props.selectType=='keyword'"
      :multiple-limit="props.selectType=='keyword' ? 3 : 0"
      value-key="label"
      collapse-tags
      collapse-tags-tooltip
      filterable
      clearable>
      <el-option
        v-for="selItem in selectList"
        :key="selItem.value"
        :label="selItem.label"
        :value="selItem"
      />
    </el-select>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, getCurrentInstance } from "vue";
import { ElSelect, ElOption } from "element-plus";
import { useUserStore } from "@/stores/user";
import type { SelectOption } from "@/interface/SelectOptions";

const app = getCurrentInstance();
const $commonLib = app?.appContext.config.globalProperties.$CommonLib;
const $WebAPI = app?.appContext.config.globalProperties.$WebAPI;
const userStore = useUserStore();

const props = defineProps(["selectType", "selectValue"]);
const emits = defineEmits(["update:selectValue"]);

const paramTitle = ref("");
const selectList = reactive<Array<SelectOption>>([]);
const placeholderTxt = ref("");

if (props.selectType == "domicile") {
  paramTitle.value = "地區";
  placeholderTxt.value = "選擇地區";
  $WebAPI.GetCodeDomicile(
    userStore.token,
    null,
    null,
    null,
    null,
    null,
    true,
    null,
    (res: any) => {
      console.log(res);
      let _resData = res.data || "error";
      if (_resData == "error") return console.error(`API res ${_resData}`);

      let _res = _resData.result;

      if (_res.errCode != 0) return console.error(_res.errMsg);

      let _selectIndex = null
      _res.result.forEach((code:any, i:number) => {
        if (props.selectValue == code.id) {
          _selectIndex = i
        }
        selectList.push({
          value: code.id,
          label: code.labelName
        })
      })
      if (_selectIndex) {
        modelValue.value = selectList[_selectIndex]
      }
    }
  );
}

if (props.selectType == "policy") {
  paramTitle.value = "政策類別";
  placeholderTxt.value = "選擇政策";
  $WebAPI.GetCodePolicy(
    userStore.token,
    null,
    null,
    null,
    null,
    null,
    null,
    false,
    (res: any) => {
      console.log(res);
      let _resData = res.data || "error";
      if (_resData == "error") return console.error(`API res ${_resData}`);

      let _res = _resData.result;

      if (_res.errCode != 0) return console.error(_res.errMsg);

      let _selectIndex = null
      _res.result.forEach((code:any, i: number) => {
        if (props.selectValue == code.id) {
          _selectIndex = i
        }
        selectList.push({
          value: code.id,
          label: code.labelName
        })
      })

      if (_selectIndex) {
        modelValue.value = selectList[_selectIndex]
      }
    }
  );
}

if (props.selectType == "keyword") {
  paramTitle.value = "關鍵字";
  placeholderTxt.value = "選擇關鍵字";
  $WebAPI.GetCodeKeyword(
    userStore.token,
    null,
    null,
    null,
    null,
    null,
    null,
    (res: any) => {
      console.log(res);
      let _resData = res.data || "error";
      if (_resData == "error") return console.error(`API res ${_resData}`);

      let _res = _resData.result;

      if (_res.errCode != 0) return console.error(_res.errMsg);

      let _selectIndex:Array<number> = []
      _res.result.forEach((code:any, i: number) => {
        if (props.selectValue.indexOf(`${code.id}`) >= 0) {
          _selectIndex.push(i)
        }
        selectList.push({
          value: code.id,
          label: code.labelName
        })
      })
      modelValue.value.splice(0)
      _selectIndex.forEach((_i:any) => {
        console.log(_i)
        console.log(selectList)
        modelValue.value.push(selectList[_i])
      })
    }
  );
}

if (props.selectType == "imgManagerType") {
  paramTitle.value = "圖片類別";
  placeholderTxt.value = "請選擇圖片類別";
  selectList.push(...[
    {
      value: '福利文章',
      label: '福利文章'
    },
    {
      value: '最新消息',
      label: '最新消息'
    },
    {
      value: '福利政策',
      label: '福利政策'
    }
  ])
}

const modelValue = computed({
  get() {
    return props.selectValue;
  },
  set(value) {
    console.log(value);
    emits("update:selectValue", value);
  },
});
</script>
