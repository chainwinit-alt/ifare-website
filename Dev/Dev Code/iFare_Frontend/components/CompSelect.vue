<template>
  <!--
    2026-05-25 UIUX #57:
    variant="list" 以清單呈現
    variant="tags" 以 tag 呈現
    allow-deselect="true" 可再次點擊取消選取
  -->
  <div
    ref="rootEl"
    class="component-select no-userselect"
    :class="[{ active: isShow }, `variant-${variant}`]"
    :name="selectType"
    tabindex="0"
    role="combobox"
    :aria-expanded="isShow"
    aria-haspopup="listbox"
    :aria-controls="listboxId || undefined"
    :aria-activedescendant="activeDescendantId"
    :aria-label="props.selectTitle || props.placeholder"
    @click="toggleSelectDialog"
    @keydown.enter.prevent="onEnterSelect"
    @keydown.space.prevent="onEnterSelect"
    @keydown.esc.prevent="closeDialog"
    @keydown.down.prevent="onArrow(1)"
    @keydown.up.prevent="onArrow(-1)"
  >
    <div class="comp-group">
      <span v-show="displayName === ''" class="comp-placeholder">{{ props.placeholder }}</span>
      <span v-show="displayName !== ''" class="comp-name">{{ displayName }}</span>
      <i class="icon ic-select-arrow"></i>
    </div>

    <div v-show="isShow" class="select-content-bg">
      <div class="select-content" @click.stop.prevent="preventClick">
        <div class="part-top">
          <h5 class="select-title">{{ props.selectTitle }}</h5>
        </div>

        <ul
          v-if="variant === 'list'"
          class="list-unstyled select-list"
          role="listbox"
          :id="listboxId || undefined"
          :aria-multiselectable="props.multiple || undefined"
        >
          <li
            v-for="(item, idx) in selectList"
            :key="item.val"
            :id="listboxId ? `${listboxId}-option-${idx}` : undefined"
            class="select-item"
            :class="{ active: isItemSelected(item.val), focused: idx === focusedIndex }"
            role="option"
            :aria-selected="isItemSelected(item.val)"
            tabindex="-1"
            @click.stop.prevent="clickSelectItem(item.name, item.val)"
          >
            {{ item.name }}
          </li>
        </ul>

        <div v-else class="btn-tag-list" role="listbox" :id="listboxId || undefined">
          <span
            v-for="(item, idx) in selectList"
            :key="item.val"
            :id="listboxId ? `${listboxId}-option-${idx}` : undefined"
            class="btn btn-tag"
            :class="{ active: isItemSelected(item.val), focused: idx === focusedIndex }"
            role="option"
            :aria-selected="isItemSelected(item.val)"
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
import { computed, ref, watch, onMounted, onBeforeUnmount } from "vue";

// 2026-08-25 A11y #35：模組層級計數器，為每個 combobox 實例產生穩定且唯一的 listbox id
let comboboxUidSeed = 0;

type SelectItem = {
  name: string;
  val: string;
};

const selectVal = ref("");
const selectName = ref("");
const selectedValues = ref<string[]>([]);
const isShow = ref(false);
const focusedIndex = ref(-1);
const rootEl = ref<HTMLElement | null>(null);
// 2026-08-25 A11y #35：對應 listbox 的唯一 id，於 client 端 mount 後才產生（避免 SSR/CSR hydration 不一致）
const listboxId = ref("");

const props = defineProps<{
  placeholder?: string;
  selectList?: SelectItem[];
  selectValue?: string;
  selectType?: string;
  selectTitle?: string;
  selectDefault?: string;
  selectDefaults?: string[];
  variant?: "list" | "tags";
  allowDeselect?: boolean;
  multiple?: boolean;
  allValue?: string;
}>();

const emits = defineEmits(["update:selectValue", "update:selectValues", "isOpened"]);

const variant = computed(() => props.variant ?? "list");
const selectList = computed(() => props.selectList ?? []);
const selectType = computed(() => props.selectType ?? "");
const displayName = computed(() => {
  if (!props.multiple) return selectName.value;

  return selectedValues.value
    .map((value) => selectList.value.find((item) => item.val === value)?.name)
    .filter(Boolean)
    .join("、");
});

// 2026-08-25 A11y #35：面板開啟且 focusedIndex 有效時，指向目前高亮選項的 id；否則為空字串（等同無 active descendant）
const activeDescendantId = computed(() =>
  isShow.value &&
  focusedIndex.value >= 0 &&
  focusedIndex.value < selectList.value.length &&
  listboxId.value
    ? `${listboxId.value}-option-${focusedIndex.value}`
    : "",
);

function isItemSelected(value: string) {
  return props.multiple
    ? selectedValues.value.includes(value)
    : selectVal.value === value;
}

function toggleSelectDialog() {
  isShow.value = !isShow.value;

  if (isShow.value) {
    const currentIndex = selectList.value.findIndex((item) => isItemSelected(item.val));
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
  if (props.multiple) {
    const allValue = props.allValue || "";
    let nextValues = [...selectedValues.value];

    if (allValue && val === allValue) {
      nextValues = [allValue];
    } else {
      if (allValue) {
        nextValues = nextValues.filter((value) => value !== allValue);
      }

      nextValues = nextValues.includes(val)
        ? nextValues.filter((value) => value !== val)
        : [...nextValues, val];

      if (nextValues.length === 0 && allValue) {
        nextValues = [allValue];
      }
    }

    selectedValues.value = nextValues;
    emits("update:selectValues", props.selectType, [...nextValues]);
    return;
  }

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

function syncSelectionFromProps() {
  if (props.multiple) {
    const availableValues = new Set(selectList.value.map((item) => item.val));
    let nextValues = (props.selectDefaults || []).filter((value) => availableValues.has(value));

    if (nextValues.length === 0 && props.allValue && availableValues.has(props.allValue)) {
      nextValues = [props.allValue];
    }

    selectedValues.value = nextValues;
    return;
  }

  const defaultValue = props.selectDefault ?? props.selectValue ?? "";
  const defaultItem = selectList.value.find((item) => item.val === defaultValue);
  selectName.value = defaultItem?.name || "";
  selectVal.value = defaultItem?.val || "";
}

watch(
  () => [props.selectList, props.selectDefault, props.selectDefaults, props.multiple],
  syncSelectionFromProps,
  { deep: true, immediate: true },
);

watch(
  () => props.selectValue,
  (newValue) => {
    if (props.multiple) return;
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

// 2026-06-08 UIUX #188 — 點擊元件外部時關閉下拉
// （桌機版 .select-content-bg 為 absolute 下拉面板、非全螢幕遮罩，原本點頁面別處不會收合，多個 select 可同時開）
function onDocumentClick(e: MouseEvent) {
  if (isShow.value && rootEl.value && !rootEl.value.contains(e.target as Node)) {
    closeDialog();
  }
}
onMounted(() => {
  // 2026-08-25 A11y #35：於 client 端產生唯一 id（避免 SSR/CSR hydration 不一致）
  listboxId.value = `comp-select-${comboboxUidSeed++}`;
  document.addEventListener("click", onDocumentClick);
});
onBeforeUnmount(() => document.removeEventListener("click", onDocumentClick));
</script>
