<template>
    <div
      class="component-select no-userselect"
      :class="{ active: isShow}"
      :name="selectType"
      tabindex="0"
      role="combobox"
      :aria-expanded="isShow"
      aria-haspopup="listbox"
      :aria-label="props.selectTitle || props.placeholder"
      @click="ToggleSelectDialog"
      @keydown.enter.prevent="onEnterSelect"
      @keydown.space.prevent="onEnterSelect"
      @keydown.esc.prevent="CloseDialog"
      @keydown.down.prevent="onArrow(1)"
      @keydown.up.prevent="onArrow(-1)"
    >
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
          <div class="btn-tag-list" role="listbox">
            <span
                class="btn btn-tag"
                :class="{ active: _item.name == selectName, focused: idx === focusedIndex }"
                v-for="(_item, idx) in selectList"
                :key="_item.val"
                role="option"
                :aria-selected="_item.name == selectName"
                tabindex="-1"
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
  const focusedIndex = ref(-1);

  function ToggleSelectDialog() {
    isShow.value = !isShow.value;
    if (isShow.value) {
      const list = (props.selectList || []) as any[];
      const cur = list.findIndex((p: any) => p.name === selectName.value);
      focusedIndex.value = cur >= 0 ? cur : 0;
    } else {
      focusedIndex.value = -1;
    }
    emits("isOpened", props.selectType, isShow.value)
  }

  function CloseDialog() {
    if (isShow.value) {
      isShow.value = false;
      focusedIndex.value = -1;
      emits("isOpened", props.selectType, false);
    }
  }

  function onArrow(delta: number) {
    if (!isShow.value) {
      ToggleSelectDialog();
      return;
    }
    const list = (props.selectList || []) as any[];
    if (list.length === 0) return;
    let next = focusedIndex.value + delta;
    if (next < 0) next = list.length - 1;
    if (next >= list.length) next = 0;
    focusedIndex.value = next;
  }

  function onEnterSelect() {
    if (isShow.value && focusedIndex.value >= 0) {
      const list = (props.selectList || []) as any[];
      const item = list[focusedIndex.value];
      if (item) ClickSelectItem(item.name, item.val);
    } else {
      ToggleSelectDialog();
    }
  }

  function PreventClick(e:any) {
    return false;
  }

  function ClickSelectItem(name: string, val: string) {
    if (selectVal.value == val) {
      selectName.value = "";
      selectVal.value = "";
      emits("update:selectValue", props.selectType, "");
      ToggleSelectDialog()
      return;
    }

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

  watch(
    () => props.selectList,
    (newList) => {
      if (!newList || !Array.isArray(newList)) return;  // 防呆: null/undefined/非陣列

      if (props.selectDefault) {
        const _defaultItem = newList.find((p:any) => p.val == props.selectDefault)
        if (_defaultItem) {
          selectName.value = _defaultItem.name
          selectVal.value = _defaultItem.val
        } else {
          selectName.value = ""
          selectVal.value = ""
        }
      }

      if (props.selectDefault == "") {
        selectName.value = ""
        selectVal.value = ""
      }
    },
    { deep: true, immediate: true }
  )
  
  const modelValue = computed({
    get() {
      return props.selectValue;
    },
  set() {
      emits("update:selectValue", selectVal.value);
    },
  });
  </script>
  
