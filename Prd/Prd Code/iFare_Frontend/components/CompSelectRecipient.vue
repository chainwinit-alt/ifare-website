<template>
    <div class="component-select no-userselect" :class="{ active: isShow}" :name="selectType" @click="ToggleSelectDialog">
      <div class="comp-group">
        <span class="comp-placeholder" v-show="selectName == ''">{{
          props.placeholder
        }}</span>
        <span class="comp-name" v-show="selectName != ''">{{ selectName }}</span>
        <i class="icon ic-select-arrow"></i>
      </div>
      <div class="select-content-bg" v-show="isShow">
        <div class="select-content" @click.stop.prevent="PreventClick($event)">
          <div class="part-top">
            <h5 class="select-title">{{ props.selectTitle }}</h5>
          </div>
          <div class="btn-tag-list">
            <span
                class="btn btn-tag"
                :class="{ active: _item.name == selectName }"
                v-for="_item in selectList"
                :key="_item.val"
                @click.stop.prevent="ClickSelectItem(_item.name, _item.val)"
                >{{ _item.name }}</span
            >
          </div>
          <div class="part-bottom">
            <button class="btn btn-select-close transition-general" @click.stop.prevent="ToggleSelectDialog">關閉</button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed } from "vue";
  
  const selectVal = ref("");
  const selectName = ref("");
  const isShow = ref(false);
  
  function ToggleSelectDialog() {
    isShow.value = !isShow.value;
    emits("isOpened", props.selectType, isShow.value)
  }
  
  function PreventClick(e:any) {
    return false;
  }
  
  function ClickSelectItem(name: string, val: string) {
    selectName.value = name;
    selectVal.value = val;
    emits("update:selectValue", props.selectType, selectVal.value);
    ToggleSelectDialog()
  }
  
  const props = defineProps([
    "placeholder",
    "selectList",
    "selectValue",
    "selectType",
    "selectTitle",
    "selectDefault"
  ]);
  const emits = defineEmits(["update:selectValue", "isOpened"]);

  watch(props.selectList, (newList, oldList) => {
    if (props.selectDefault) {
      const _defaultItem = newList.find((p:any) => p.val == props.selectDefault)
      selectName.value = _defaultItem.name
      selectVal.value = _defaultItem.val
    }

    if (props.selectDefault == "") {
      selectName.value = ""
      selectVal.value = ""
    }
  })
  
  const modelValue = computed({
    get() {
      return props.selectValue;
    },
    set() {
      emits("update:selectValue", selectVal);
    },
  });
  </script>
  