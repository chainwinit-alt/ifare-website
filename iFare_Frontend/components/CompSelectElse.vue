<template>
    <div class="component-select else-mode no-userselect" :class="{ active: isShow}" @click="ToggleSelectDialog">
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
  import { computed } from "vue";

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
  
  function PreventClick(e:any) {
    return false;
  }
  
  function ClickSelectItem(name: string, val: string, type: string) {
    console.log(`name: ${name} || val: ${val} || type: ${type}`)
   
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

    if (type == 'Income') {
      let removeIncomeIndex:Array<number> = []
      selectItems.forEach((_item:any, i:number) => {
        if (_item.type == type && _item.value != val) {
          removeIncomeIndex.splice(0, 0, i)
        }
      })
      removeIncomeIndex.forEach((_index:number, j:number) => {
        selectItems.splice(_index, 1)
      })
    }

    if (type == 'Identity' && val == "1") {
      let removeIndex:Array<number> = []
      selectItems.forEach((_item:any, i:number) => {
        if (_item.type == type && _item.value != val) {
          removeIndex.splice(0, 0, i)
        }
      })
      console.log(JSON.parse(JSON.stringify(removeIndex)))
      removeIndex.forEach((_index:number, j:number) => {
        selectItems.splice(_index, 1)
      })
    }

    emits("update:selectItems", props.selectType, selectItems);
    // ToggleSelectDialog()
  }

  function Search() {
    console.log(selectItems)
    ToggleSelectDialog()
  }
  
  const props = defineProps([
    "placeholder",
    "selectListIncome",
    "selectListIdentity",
    "selectItems",
    "selectType",
    "selectTitle"
  ]);
  const emits = defineEmits(["update:selectItems", "isOpened"]);
  
  const modelValue = computed({
    get() {
      return props.selectItems;
    },
    set() {
      emits("update:selectItems", selectItems);
    },
  });
  </script>
  