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
    _widthPageContent.value = _elnPageContent.value?.offsetWidth || 0;
    _widthPageItemsTTL.value = newVal.length * WIDTH_PAGEITEM;
    // #116 — pageList 變化（重新搜尋等情境）後重置 currentPage 並重算視窗
    currentPage.value = 1;
    nextTick(() => recomputeVisibleWindow());
  }
});

onMounted(() => {
  _widthPageContent.value = _elnPageContent.value?.offsetWidth || 0;
  recomputeVisibleWindow();
});

function PageClick(clickNum: number) {
  props.pageList.forEach((_page: any, i: number) => {
    _page.isActive = _page.num == clickNum;
  });
  currentPage.value = clickNum;
  emits("changePage", clickNum);
  // #116 — 切頁後重算 visible window，PageNext / PagePrev 不再各自維護
  recomputeVisibleWindow();
}

// #116 — 統一管理 isHide：根據 currentPage 與容器寬度算「可見視窗」，
// 把 currentPage 放中間，超出視窗的 page item 標 isHide。
// 修正舊版 PagePrev 只 unhide 當前頁、其他被隱藏的 page 永遠拉不回來的 bug。
function recomputeVisibleWindow() {
  const total = props.pageList.length;
  if (total <= 0) return;

  // 預設視窗：依容器寬度容納幾個 item；若還沒量到寬度，全部顯示
  let windowSize = total;
  if (_widthPageContent.value > 0) {
    windowSize = Math.max(1, Math.floor(_widthPageContent.value / WIDTH_PAGEITEM));
    windowSize = Math.min(windowSize, total);
  }

  const cur = currentPage.value;
  const half = Math.floor((windowSize - 1) / 2);
  let start = Math.max(1, cur - half);
  let end = Math.min(total, start + windowSize - 1);
  if (end - start + 1 < windowSize) {
    start = Math.max(1, end - windowSize + 1);
  }

  props.pageList.forEach((_item: any, i: number) => {
    const num = i + 1;
    _item.isHide = num < start || num > end;
  });
}

function PageNext(e: any) {
  if (currentPage.value >= props.pageList.length) return false;
  PageClick(currentPage.value + 1);
}

function PagePrev(e: any) {
  if (currentPage.value <= 1) return false;
  PageClick(currentPage.value - 1);
}
</script>
