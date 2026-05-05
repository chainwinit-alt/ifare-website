<template>
  <nav class="page-component" aria-label="分頁導覽">
    <div class="page-content" ref="_elnPageContent">
      <ul class="list-unstyled pages-list">
        <li
          :class="{ active: _page.isActive, hide: _page.isHide }"
          v-for="_page in pageList"
          :key="_page.num"
          role="button"
          tabindex="0"
          :aria-current="_page.isActive ? 'page' : undefined"
          :aria-label="`第 ${_page.num} 頁`"
          @click="PageClick(_page.num)"
          @keydown.enter.space.prevent="PageClick(_page.num)"
        >
          {{ _page.num }}
        </li>
      </ul>
    </div>
    <div class="page-control">
      <button
        type="button"
        class="btn-icon btn-page-prev"
        :class="{ disabled: currentPage == 1 }"
        :disabled="currentPage == 1"
        aria-label="上一頁"
        @click="PagePrev"
      >
        <i class="ic-arrow-simple" aria-hidden="true"></i>
      </button>
      <button
        type="button"
        class="btn-icon btn-page-next"
        :class="{
          disabled: currentPage >= props.pageList.length,
        }"
        :disabled="currentPage >= props.pageList.length"
        aria-label="下一頁"
        @click="PageNext"
      >
        <i class="ic-arrow-simple" aria-hidden="true"></i>
      </button>
    </div>
  </nav>
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

  if (_currentPageNum == props.pageList.length) {
    _currentPageNum = _currentPageNum - Math.floor(_widthPageContent.value / WIDTH_PAGEITEM) + 1
    props.pageList.forEach((_item: any, i: number) => {
      _item.isHide = i + 1 < _currentPageNum;
    });
  }

  if (lastPageItemWidth > _widthPageContent.value) {
    props.pageList.forEach((_item: any, i: number) => {
      _item.isHide = i + 1 < _currentPageNum;
    });
  }
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
