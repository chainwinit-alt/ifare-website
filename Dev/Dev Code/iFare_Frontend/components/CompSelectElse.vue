<template>
    <div
      class="component-select else-mode no-userselect"
      :class="{ active: isShow}"
      tabindex="0"
      role="combobox"
      :aria-expanded="isShow"
      aria-haspopup="dialog"
      :aria-label="props.selectTitle || props.placeholder"
      @click="ToggleSelectDialog"
      @keydown.enter.prevent="ToggleSelectDialog"
      @keydown.space.prevent="ToggleSelectDialog"
      @keydown.esc.prevent="CloseDialog"
    >
      <div class="comp-group">
        <button
              class="btn btn-advance"
              :class="{ active: isOpts }"
              @click="isOpts = !isOpts"
            >
              <i class="ic-options"></i>
            </button>
      </div>
      <div class="select-content-bg" v-show="isShow">
        <div class="select-content" @click.stop.prevent="PreventClick($event)">
          <div class="part-top">
            <h5 class="select-title">{{ props.selectTitle }}</h5>
          </div>
          <div class="part-filter-list">
            <div class="filter-group">
              <label class="filter-title">經濟條件</label>
              <div class="btn-tag-list">
                <span
                  class="btn btn-tag"
                  :class="{ active: selectItems.findIndex((p:any) => p.name == _item.name) >= 0 }"
                  v-for="_item in selectListIncome"
                  :key="_item.val"
                  @click="ClickSelectItem(_item.name, _item.val, 'Income')"
                  >{{ _item.name }}</span
                >
              </div>
            </div>
            <div class="filter-group">
              <label class="filter-title" name="identity">特殊身分</label>
              <div class="btn-tag-list">
                <span
                  class="btn btn-tag"
                  :class="{ active: selectItems.findIndex((p:any) => p.name == _item.name) >= 0 }"
                  v-for="_item in selectListIdentity"
                  :key="_item.val"
                  @click="ClickSelectItem(_item.name, _item.val, 'Identity')"
                  >{{ _item.name }}</span
                >
              </div>
            </div>
          </div>
          <div class="part-bottom">
            <button class="btn btn-select-close transition-general" @click.stop.prevent="ToggleSelectDialog">關閉</button>
            <!-- <button class="btn-filter" @click="Search">
              <span>搜尋</span>
              <i class="icon ic-search"></i>
            </button> -->
          </div>
        </div>
      </div>
    </div>
  </template>

  <script setup lang="ts">
  import { computed, watch } from "vue";

  interface switchItem {
    type: string,
    name: string,
    value: string
  }

  const selectVal = ref("");
  const selectName = ref("");
  const isShow = ref(false);
  const isOpts = ref(false)
  const selectItems = reactive<Array<switchItem>>([])

  function ToggleSelectDialog() {
    isShow.value = !isShow.value;
    emits("isOpened", props.selectType, isShow.value)
  }

  function CloseDialog() {
    if (isShow.value) {
      isShow.value = false;
      emits("isOpened", props.selectType, false);
    }
  }

  function PreventClick(e:any) {
    return false;
  }

  function ClickSelectItem(name: string, val: string, type: string) {
    let _data = {
        type: type,
        name: name,
        value: val
    }

    // let existIndex = selectItems.findIndex(p => p.type == type)
    // if (existIndex >= 0) {
    //     return selectItems.splice(existIndex, 1, _data)
    // }

    let existIndex = selectItems.findIndex((p:any) => p.name == name)
    if (existIndex >= 0) {
        selectItems.splice(existIndex, 1)
    } else {
      selectItems.push(_data)
    }

    const noIdentityValue = props.selectListIdentity
      ?.find((item: any) => String(item.name || "").trim() === "無")?.val;
    if (type == "Identity" && val == noIdentityValue && existIndex < 0) {
      let removeIndex:Array<number> = []
      selectItems.forEach((_item:any, i:number) => {
        if (_item.type == type && _item.value != val) {
          removeIndex.splice(0, 0, i)
        }
      })
      removeIndex.forEach((_index:number, j:number) => {
        selectItems.splice(_index, 1)
      })
    }
    if (type == "Identity" && val != noIdentityValue && existIndex < 0) {
      const noIdentityIndex = selectItems.findIndex(
        (item: any) => item.type == type && item.value == noIdentityValue
      );
      if (noIdentityIndex >= 0) selectItems.splice(noIdentityIndex, 1);
    }

    emits("update:select-items", props.selectType, selectItems);
    // ToggleSelectDialog()
  }

  function Search() {
    ToggleSelectDialog()
  }

  const props = defineProps([
    "placeholder",
    "selectListIncome",
    "selectListIdentity",
    "selectItems",
    "selectedIncomes",
    "selectedIdentities",
    "selectType",
    "selectTitle"
  ]);
  const emits = defineEmits(["update:select-items", "isOpened"]);

  function syncSelectedItems() {
    const nextItems: switchItem[] = [];
    const selectedIncomes = Array.isArray(props.selectedIncomes) ? props.selectedIncomes : [];
    const selectedIdentities = Array.isArray(props.selectedIdentities) ? props.selectedIdentities : [];

    selectedIncomes.forEach((value: any) => {
      const item = props.selectListIncome?.find((entry: any) => String(entry.val) === String(value));
      if (item) nextItems.push({ type: "Income", name: item.name, value: String(item.val) });
    });
    selectedIdentities.forEach((value: any) => {
      const item = props.selectListIdentity?.find((entry: any) => String(entry.val) === String(value));
      if (item) nextItems.push({ type: "Identity", name: item.name, value: String(item.val) });
    });

    selectItems.splice(0, selectItems.length, ...nextItems);
  }

  watch(
    () => [props.selectedIncomes, props.selectedIdentities, props.selectListIncome, props.selectListIdentity],
    syncSelectedItems,
    { deep: true, immediate: true }
  );

  const modelValue = computed({
    get() {
      return props.selectItems;
    },
  set() {
      emits("update:select-items", selectItems);
    },
  });
  </script>

