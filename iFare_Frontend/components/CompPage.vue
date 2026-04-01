<template>
  <div class="page-component">
    <div class="page-content" ref="_elnPageContent">
      <ul class="list-unstyled pages-list">
        <li
          :class="{ active: _page.isActive, hide: _page.isHide }"
          v-for="_page in pageList"
          :key="_page.num"
          @click="PageClick(_page.num)"
        >
          {{ _page.num }}
        </li>
      </ul>
    </div>
    <div class="page-control">
      <button
        class="btn-icon btn-page-prev"
        :class="{ disabled: currentPage == 1 }"
        @click="PagePrev"
      >
        <i class="ic-arrow-simple"></i>
      </button>
      <button
        class="btn-icon btn-page-next"
        :class="{
          disabled: currentPage >= props.pageList.length,
        }"
        @click="PageNext"
      >
        <i class="ic-arrow-simple"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const currentPage = ref(1);
const props = defineProps(["pageList"]);
const emits = defineEmits(["changePage"]);
const _elnPageContent = ref();
const _widthPageContent = ref(0);
const _widthPageItemsTTL = ref(0);
const WIDTH_PAGEITEM = 52;

// onMounted(() => {
//   _widthPageContent.value = _elnPageContent.value.offsetWidth;
// });

watch(props.pageList, (newVal, oldVal) => {
  if (newVal.length >= 0) {
    _widthPageContent.value = _elnPageContent.value.offsetWidth;
    _widthPageItemsTTL.value = newVal.length * WIDTH_PAGEITEM;
  }
});

function PageClick(clickNum: number) {
  props.pageList.forEach((_page: any, i: number) => {
    _page.isActive = _page.num == clickNum;
  });
  currentPage.value = clickNum;
  emits("changePage", clickNum);
}

function PageNext(e: any) {
  if (currentPage.value >= props.pageList.length) return false;

  PageClick(currentPage.value + 1);

  let _currentPageNum = currentPage.value

  const lastPageItemWidth =
    (props.pageList.length - _currentPageNum + 2) * WIDTH_PAGEITEM; // Add current page and after empty tag.

    console.log('props.pageList.length: ', props.pageList.length)
    console.log('_widthPageContent.value: ', _widthPageContent.value)
    console.log('lastPageItemWidth: ', lastPageItemWidth)

  if (_currentPageNum == props.pageList.length) {
    console.log("ssssss")
    _currentPageNum = _currentPageNum - Math.floor(_widthPageContent.value / WIDTH_PAGEITEM) + 1
    console.log(_currentPageNum)
    props.pageList.forEach((_item: any, i: number) => {
      _item.isHide = i + 1 < _currentPageNum;
    });
  }

  if (lastPageItemWidth > _widthPageContent.value) {
    props.pageList.forEach((_item: any, i: number) => {
      _item.isHide = i + 1 < _currentPageNum;
    });
  }

  console.log(props.pageList)
}

function PagePrev(e: any) {
  if (currentPage.value <= 1) return false;
  
  PageClick(currentPage.value - 1);

  props.pageList.forEach((_item: any, i: number) => {
    if (currentPage.value == i+1) {
        _item.isHide = false;
    }
  });
}
</script>
