<template>
  <!--
    2026-05-25 UIUX #57:
    variant="list" 以清單呈現
    variant="tags" 以 tag 呈現
    allow-deselect="true" 可再次點擊取消選取
  -->
  <div
    class="component-select no-userselect"
    :class="[{ active: isShow }, `variant-${variant}`]"
    :name="selectType"
    tabindex="0"
    role="combobox"
    :aria-expanded="isShow"
    aria-haspopup="listbox"
    :aria-label="props.selectTitle || props.placeholder"
    @click="toggleSelectDialog"
    @keydown.enter.prevent="onEnterSelect"
    @keydown.space.prevent="onEnterSelect"
    @keydown.esc.prevent="closeDialog"
    @keydown.down.prevent="onArrow(1)"
    @keydown.up.prevent="onArrow(-1)"
  >
    <div class="comp-group">
      <span v-show="selectName === ''" class="comp-placeholder">{{ props.placeholder }}</span>
      <span v-show="selectName !== ''" class="comp-name">{{ selectName }}</span>
      <i class="icon ic-select-arrow"></i>
    </div>

    <div v-show="isShow" class="select-content-bg">
      <div class="select-content" @click.stop.prevent="preventClick">
        <div class="part-top">
          <h5 class="select-title">{{ props.selectTitle }}</h5>
        </div>

        <ul v-if="variant === 'list'" class="list-unstyled select-list" role="listbox">
          <li
            v-for="(item, idx) in selectList"
            :key="item.val"
            class="select-item"
            :class="{ active: item.name === selectName, focused: idx === focusedIndex }"
            role="option"
            :aria-selected="item.name === selectName"
            tabindex="-1"
            @click.stop.prevent="clickSelectItem(item.name, item.val)"
          >
            {{ item.name }}
          </li>
        </ul>

        <div v-else class="btn-tag-list" role="listbox">
          <span
            v-for="(item, idx) in selectList"
            :key="item.val"
            class="btn btn-tag"
            :class="{ active: item.name === selectName, focused: idx === focusedIndex }"
            role="option"
            :aria-selected="item.name === selectName"
            tabindex="-1"
            @click.stop.prevent="clickSelectItem(item.name, item.val)"
          >
            {{ item.name }}
          </span>
        </div>

        <div class="part-bottom">
          <button class="btn btn-select-close transition-general" @click.stop.prevent="toggleSelectDialog">
            關閉
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

type SelectItem = {
  name: string;
  val: string;
};

const selectVal = ref("");
const selectName = ref("");
const isShow = ref(false);
const focusedIndex = ref(-1);

const props = defineProps<{
  placeholder?: string;
  selectList?: SelectItem[];
  selectValue?: string;
  selectType?: string;
  selectTitle?: string;
  selectDefault?: string;
  variant?: "list" | "tags";
  allowDeselect?: boolean;
}>();

const emits = defineEmits(["update:selectValue", "isOpened"]);

const variant = computed(() => props.variant ?? "list");
const selectList = computed(() => props.selectList ?? []);
const selectType = computed(() => props.selectType ?? "");

function toggleSelectDialog() {
  isShow.value = !isShow.value;

  if (isShow.value) {
    const currentIndex = selectList.value.findIndex((item) => item.name === selectName.value);
    focusedIndex.value = currentIndex >= 0 ? currentIndex : 0;
  } else {
    focusedIndex.value = -1;
  }

  emits("isOpened", props.selectType, isShow.value);
}

function closeDialog() {
  if (!isShow.value) return;

  isShow.value = false;
  focusedIndex.value = -1;
  emits("isOpened", props.selectType, false);
}

function onArrow(delta: number) {
  if (!isShow.value) {
    toggleSelectDialog();
    return;
  }

  if (selectList.value.length === 0) return;

  let next = focusedIndex.value + delta;
  if (next < 0) next = selectList.value.length - 1;
  if (next >= selectList.value.length) next = 0;
  focusedIndex.value = next;
}

function preventClick() {
  return false;
}

function clickSelectItem(name: string, val: string) {
  if (props.allowDeselect && selectVal.value === val) {
    selectName.value = "";
    selectVal.value = "";
    emits("update:selectValue", props.selectType, "");
    toggleSelectDialog();
    return;
  }

  selectName.value = name;
  selectVal.value = val;
  emits("update:selectValue", props.selectType, selectVal.value);
  toggleSelectDialog();
}

function onEnterSelect() {
  if (isShow.value && focusedIndex.value >= 0) {
    const item = selectList.value[focusedIndex.value];
    if (item) {
      clickSelectItem(item.name, item.val);
    }
    return;
  }

  toggleSelectDialog();
}

watch(
  () => props.selectList,
  (newList) => {
    if (!newList || !Array.isArray(newList)) return;

    if (props.selectDefault) {
      const defaultItem = newList.find((item) => item.val === props.selectDefault);
      if (defaultItem) {
        selectName.value = defaultItem.name;
        selectVal.value = defaultItem.val;
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
  { deep: true, immediate: true },
);

watch(
  () => props.selectValue,
  (newValue) => {
    if (typeof newValue !== "string") return;

    const matchedItem = selectList.value.find((item) => item.val === newValue);
    if (matchedItem) {
      selectName.value = matchedItem.name;
      selectVal.value = matchedItem.val;
      return;
    }

    if (newValue === "") {
      selectName.value = "";
      selectVal.value = "";
    }
  },
  { immediate: true },
);

const modelValue = computed({
  get() {
    return props.selectValue;
  },
  set() {
    emits("update:selectValue", selectVal.value);
  },
});
</script>
