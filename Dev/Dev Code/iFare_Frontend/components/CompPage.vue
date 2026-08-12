<template>
  <!--
    2026-05-25 UIUX #51 — 合併原 CompPage / CompPageNum,以 mode prop 切換呈現
    mode="list" (預設):顯示完整頁碼 1 2 3 4 5 ... + 上下頁
    mode="num"        :只顯示 current / total + 上下頁 (適合行動裝置或窄欄位)
  -->
  <nav
    class="page-component"
    :class="{ 'num-mode': mode === 'num' }"
    aria-label="分頁導覽"
  >
    <div class="page-content" ref="_elnPageContent">
      <ul v-if="mode !== 'num'" class="list-unstyled pages-list">
        <li
          v-for="_page in pageList"
          :key="_page.num"
          :class="{ active: _page.isActive, hide: _page.isHide }"
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
      <label v-else class="page-nums">
        <span class="page-current">{{ currentPage }}</span
        >/<span class="page-total">{{ pageList.length }}</span>
      </label>
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
        :class="{ disabled: currentPage >= props.pageList.length }"
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
const props = defineProps<{
  pageList: Array<{ num: number; isActive: boolean; isHide?: boolean }>;
  mode?: 'list' | 'num';
}>();
const emits = defineEmits(['changePage']);
const _elnPageContent = ref<HTMLElement | null>(null);
const _widthPageContent = ref(0);
const WIDTH_PAGEITEM = 52;

watch(
  () => props.pageList,
  (newVal) => {
    if (newVal.length >= 0) {
      _widthPageContent.value = _elnPageContent.value?.offsetWidth || 0;
      // #116 — pageList 變化(重新搜尋等情境)後重置 currentPage 並重算視窗
      currentPage.value = 1;
      nextTick(() => recomputeVisibleWindow());
    }
  },
);

onMounted(() => {
  _widthPageContent.value = _elnPageContent.value?.offsetWidth || 0;
  recomputeVisibleWindow();
});

function PageClick(clickNum: number) {
  props.pageList.forEach((_page) => {
    _page.isActive = _page.num == clickNum;
  });
  currentPage.value = clickNum;
  emits('changePage', clickNum);
  recomputeVisibleWindow();
}

/**
 * #116 — 統一管理 isHide:根據 currentPage 與容器寬度算「可見視窗」,
 * 把 currentPage 放中間,超出視窗的 page item 標 isHide。
 * num-mode 不顯示 page items,直接 skip。
 */
function recomputeVisibleWindow() {
  if (props.mode === 'num') return;

  const total = props.pageList.length;
  if (total <= 0) return;

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

  props.pageList.forEach((_item, i) => {
    const num = i + 1;
    _item.isHide = num < start || num > end;
  });
}

function PageNext() {
  if (currentPage.value >= props.pageList.length) return;
  PageClick(currentPage.value + 1);
}

function PagePrev() {
  if (currentPage.value <= 1) return;
  PageClick(currentPage.value - 1);
}
</script>
