<template>
  <!--
    2026-05-25 UIUX #57 — 統一 CompSelect / CompSelectRecipient 為單一元件
    variant="list" (預設) — 下拉清單 <ul><li>(原 CompSelect)
    variant="tags"        — 橫排按鈕 tag 樣式(原 CompSelectRecipient)
    allow-deselect="true" — 重複點選會清空(Recipient 行為)
  -->
  <div
    class="component-select no-userselect"
    :class="[{ active: isShow }, `variant-${variant}`]"
    :name="selectType"
    tabindex="0"
    role="combobox"
    :aria-expanded="isShow"
    :aria-haspopup="variant === 'tags' ? 'listbox' : 'listbox'"
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

        <!-- variant="list":垂直清單 -->
        <ul v-if="variant === 'list'" class="list-unstyled select-list" role="listbox">
          <li
            v-for="(_item, idx) in selectList"
            :key="_item.val"
            class="select-item"
            :class="{ active: _item.name == selectName, focused: idx === focusedIndex }"
            role="option"
            :aria-selected="_item.name == selectName"
            tabindex="-1"
            @click.stop.prevent="ClickSelectItem(_item.name, _item.val)"
          >
            {{ _item.name }}
          </li>
        </ul>

        <!-- variant="tags":橫排 tag 按鈕 -->
        <div v-else class="btn-tag-list" role="listbox">
          <span
            v-for="(_item, idx) in selectList"
            :key="_item.val"
            class="btn btn-tag"
            :class="{ active: _item.name == selectName, focused: idx === focusedIndex }"
            role="option"
            :aria-selected="_item.name == selectName"
            tabindex="-1"
            @click.stop.prevent="ClickSelectItem(_item.name, _item.val)"
          >
            {{ _item.name }}
          </span>
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

const props = defineProps<{
  placeholder?: string;
  selectList?: Array<{ name: string; val: string }>;
  selectValue?: string;
  selectType?: string;
  selectTitle?: string;
  selectDefault?: string;
  /** 2026-05-25 UIUX #57 — 視覺變體 */
  variant?: 'list' | 'tags';
  /** 2026-05-25 UIUX #57 — 重複點同選項 = 清空(原 Recipient 行為) */
  allowDeselect?: boolean;
}>();
const emits = defineEmits(["update:selectValue", "isOpened"]);

const variant = computed(() => props.variant ?? 'list');

function ToggleSelectDialog() {
  isShow.value = !isShow.value;
  if (isShow.value) {
    const list = (props.selectList || []) as any[];
    const cur = list.findIndex((p: any) => p.name === selectName.value);
    focusedIndex.value = cur >= 0 ? cur : 0;
  } else {
    focusedIndex.value = -1;
  }
  emits("isOpened", props.selectType, isShow.value);
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

function PreventClick(_e: any) {
  return false;
}

function ClickSelectItem(name: string, val: string) {
  // 2026-05-25 UIUX #57 — allowDeselect 時,重複點 = 清空(原 Recipient 行為)
  if (props.allowDeselect && selectVal.value === val) {
    selectName.value = "";
    selectVal.value = "";
    emits("update:selectValue", props.selectType, "");
    ToggleSelectDialog();
    return;
  }

  selectName.value = name;
  selectVal.value = val;
  emits("update:selectValue", props.selectType, selectVal.value);
  ToggleSelectDialog();
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

watch(
  () => props.selectList,
  (newList) => {
    if (!newList || !Array.isArray(newList)) return;

    if (props.selectDefault) {
      const _defaultItem = newList.find((p: any) => p.val == props.selectDefault);
      if (_defaultItem) {
        selectName.value = _defaultItem.name;
        selectVal.value = _defaultItem.val;
      } else {
        selectName.value = "";
        selectVal.value = "";
      }
    }

    if (props.selectDefault === "") {
      selectName.value = "";
      selectVal.value = "";
    }
  },
);

const modelValue = computed({
  get() {
    return props.selectValue;
  },
  set() {
    emits("update:selectValue", selectVal);
  },
});
</script>
