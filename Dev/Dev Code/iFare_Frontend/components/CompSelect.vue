<template>
  <div
    class="component-select no-userselect"
    :class="{ active: isShow}"
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
        <ul class="list-unstyled select-list" role="listbox">
          <li
            class="select-item"
            :class="{ active: _item.name == selectName, focused: idx === focusedIndex }"
            v-for="(_item, idx) in selectList"
            :key="_item.val"
            role="option"
            :aria-selected="_item.name == selectName"
            tabindex="-1"
            @click.stop.prevent="ClickSelectItem(_item.name, _item.val)"
          >
            {{ _item.name }}
          </li>
        </ul>
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
    // 開啟時，預設 focus 已選項目，無則 focus 第一個
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
    // 關閉狀態下方向鍵也可開啟
    ToggleSelectDialog();
    return;
  }
  const list = (props.selectList || []) as any[];
  if (list.length === 0) return;
  let next = focusedIndex.value + delta;
  if (next < 0) next = list.length - 1;
  if (next >= list.length) next = 0;
  focusedIndex.value = next;
  // Enter 在 focused option 上會觸發 click
  const item = list[next];
  if (item) {
    // 視覺反饋：滾到可視範圍 (簡單版)
  }
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

// 讓 Enter 在外層 keydown 時，如果有 focusedIndex，選中該項
function onEnterSelect() {
  if (isShow.value && focusedIndex.value >= 0) {
    const list = (props.selectList || []) as any[];
    const item = list[focusedIndex.value];
    if (item) ClickSelectItem(item.name, item.val);
  } else {
    ToggleSelectDialog();
  }
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
  if (!newList || !Array.isArray(newList)) return;  // null / undefined / 非 array 防呆

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
