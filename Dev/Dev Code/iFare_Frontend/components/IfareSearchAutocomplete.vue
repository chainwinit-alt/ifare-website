<template>
  <div ref="rootRef" class="ifare-search-autocomplete" :class="{ 'is-open': isPanelVisible }">
    <div class="query-input-wrap">
      <!--
        id 由呼叫端傳入，讓外面的 <label for> 指得到這個 input。
        result.vue 早就寫好 <label for="ifare-result-mobile-query">，但這個元件從來沒有
        把該 id 放上來，等於標籤指向不存在的元素——報讀軟體只念「編輯區，空白」。
        沒有傳 id 的呼叫端則退回 aria-label；placeholder 不算可靠的名稱，一打字就不見了。

        combobox 相關屬性：aria-controls / aria-activedescendant 只在面板實際渲染時才綁，
        指向不存在的 id 是無效引用（axe 會報）；面板初始必為關閉，SSR 輸出因此不含這些
        id，也就不會有 hydration 差異。
      -->
      <input
        ref="inputRef"
        :id="inputId || undefined"
        :aria-label="inputId ? undefined : (ariaLabel || placeholder)"
        :value="modelValue"
        class="input-query"
        type="text"
        :maxlength="maxLength"
        :placeholder="placeholder"
        autocomplete="off"
        :disabled="disabled"
        role="combobox"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        :aria-expanded="isPanelVisible ? 'true' : 'false'"
        :aria-controls="isPanelVisible ? listboxId : undefined"
        :aria-activedescendant="activeOptionId"
        @focus="handleFocus"
        @input="handleInput"
        @compositionstart="handleCompositionStart"
        @compositionend="handleCompositionEnd"
        @keydown.down.prevent="moveHighlight(1)"
        @keydown.up.prevent="moveHighlight(-1)"
        @keydown.enter.prevent="handleEnter"
        @keydown.esc.prevent="closePanel"
      />
      <!--
        原本固定掛 aria-live="polite"，於是每打一個字報讀軟體就念一次「1/50」「2/50」，
        中文注音輸入時每個組字階段都觸發，吵到蓋掉使用者自己在打的內容。
        改成只有快到上限時才播報，其餘時間純視覺提示。
      -->
      <div
        v-if="showCount"
        class="query-count"
        :aria-live="isNearLimit ? 'polite' : 'off'"
      >{{ modelValue.length }}/{{ maxLength }}</div>
    </div>

    <!--
      建議面板的資料是官方關鍵字清單（/Code/GetCodeKeywordList，54 筆），不打逐字建議 API——
      原本設計的 /FarePolicy/GetIFareSearchSuggestions 後端從未實作（一律 404），而 54 筆這種
      量級抓一次、快取起來在前端過濾就夠了，還省掉每個字一次的網路往返與防抖動。
      清單載入失敗時 displayItems 恆為空、整個面板不渲染，搜尋本身完全不受影響。

      空輸入時的標題刻意叫「常見主題」而不是「熱門關鍵字」：我們沒有任何點擊或搜尋頻率
      統計，寫「熱門」是憑空宣稱。挑選邏輯見 COMMON_TOPICS 的註解。
    -->
    <div v-if="isPanelVisible" class="search-suggestion-panel">
      <div :id="panelTitleId" class="panel-title">{{ trimmedQuery ? "建議關鍵字" : "常見主題" }}</div>
      <!--
        標題放在 listbox 外、用 aria-labelledby 掛回來：listbox 底下只能是 option，
        夾一個純文字節點會讓報讀軟體把它當成不明項目。
      -->
      <div
        :id="listboxId"
        role="listbox"
        :aria-labelledby="panelTitleId"
        :class="trimmedQuery ? 'suggestion-list' : 'topic-chip-list'"
      >
        <!--
          tabindex="-1"：combobox 模式下焦點永遠留在輸入框，選項用 aria-activedescendant
          指過去；讓按鈕進 Tab 順序反而會把鍵盤使用者困在清單裡。
        -->
        <button
          v-for="(keyword, index) in displayItems"
          :key="keyword"
          :id="getOptionId(index)"
          role="option"
          type="button"
          tabindex="-1"
          class="transition-general"
          :class="[trimmedQuery ? 'suggestion-item' : 'topic-chip', { active: highlightedIndex === index }]"
          :aria-selected="highlightedIndex === index"
          @mouseenter="highlightedIndex = index"
          @click="selectKeyword(keyword)"
        >
          {{ keyword }}
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
// 模組層（非 setup）：result 頁桌機、手機各掛一個元件實例，這裡的快取讓 54 筆
// 關鍵字清單整個分頁生命週期只抓一次，兩個實例共用同一份、同一個進行中的請求。
// 只在使用者聚焦輸入框後才發請求（純 client 行為），不會在 SSR 期間執行，
// 所以放模組層不會有跨請求汙染的問題。
let keywordListCache: string[] | null = null;
let keywordListRequest: Promise<string[] | null> | null = null;

// aria id 需要跨實例唯一（同頁兩個實例）。這些 id 只出現在面板開啟後的 DOM，
// 面板在 SSR 時必為關閉，因此 server/client 各算各的 counter 也不會造成 hydration 差異。
let instanceCounter = 0;
</script>

<script setup lang="ts">
/**
 * 呼叫端（result.vue 桌機/手機兩處）仍以 :filters 傳入目前的篩選條件。
 * 建議來源改成全站共用的官方關鍵字清單後，這份條件已不參與過濾，但 prop 得留著——
 * 拿掉宣告後傳進來的物件會變成 fallthrough attribute，以 "[object Object]" 印在根節點上。
 * 等呼叫端不再傳入時，可連同這個 interface 一起刪除。
 */
interface SuggestionFilters {
  CodePolicy?: string | number | null;
  CodeRecipient?: string | number | null;
  CodeDomicile?: string | number | null;
  CodeIncome?: string | number | null;
  CodeIdentities?: Array<string | number>;
}

/** /Code/GetCodeKeywordList 單筆的形狀（後端 CodeKeyword 資料表） */
interface KeywordCodeRow {
  id: number;
  codeName: string;
}

const props = withDefaults(defineProps<{
  modelValue: string;
  placeholder?: string;
  maxLength?: number;
  filters?: SuggestionFilters;
  disabled?: boolean;
  showCount?: boolean;
  /** 外部 <label for> 要指到的 id */
  inputId?: string;
  /** 沒有外部 label 時用的可讀名稱 */
  ariaLabel?: string;
}>(), {
  placeholder: "請輸入關鍵字",
  maxLength: 50,
  filters: () => ({}),
  disabled: false,
  showCount: true,
  inputId: "",
  ariaLabel: "",
});

// 剩 10 字以內才開始播報，這時候的提醒才有意義（真的快打不下了）
const isNearLimit = computed(() => props.maxLength - props.modelValue.length <= 10);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "submit"): void;
}>();

const { $WebApiGetDetailed } = useNuxtApp();
const { getApiResultValue } = useApiResult();

const MAX_VISIBLE = 3;

// 空輸入時顯示的常見主題：從 54 筆官方關鍵字裡挑涵蓋面最廣的幾個人生情境
// （照顧、口腔、居住、育兒、急難、障礙、老年、就業），依「情境涵蓋」挑選、
// 不是依點擊頻率——沒有頻率資料，也因此面板標題不叫「熱門」。
const COMMON_TOPICS = ["長期照顧", "假牙補助", "租屋", "托育", "急難", "身心障礙", "老人津貼", "就業"];

const rootRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const isOpen = ref(false);
const isComposing = ref(false);
const highlightedIndex = ref(-1);
const keywordList = ref<string[]>([]);

const instanceId = ++instanceCounter;
const listboxId = `ifare-autocomplete-listbox-${instanceId}`;
const panelTitleId = `ifare-autocomplete-title-${instanceId}`;
const getOptionId = (index: number) => `ifare-autocomplete-option-${instanceId}-${index}`;

const trimmedQuery = computed(() => props.modelValue.trim());

// 有輸入：子字串比對（打「牙」也要找得到「假牙補助」，開頭比對會漏掉這種詞中命中）。
// 沒輸入：常見主題。兩者都吃同一份清單，最多各顯示 3 筆。
const displayItems = computed<string[]>(() => {
  if (trimmedQuery.value) {
    const query = trimmedQuery.value.toLowerCase();
    return keywordList.value
      .filter((keyword) => keyword.toLowerCase().includes(query))
      .slice(0, MAX_VISIBLE);
  }

  const topics = COMMON_TOPICS.filter((topic) => keywordList.value.includes(topic));
  // 後端清單哪天改版到跟預選主題對不上時，退回清單前幾筆，面板不會無故開天窗
  return (topics.length > 0 ? topics : keywordList.value).slice(0, MAX_VISIBLE);
});

// 沒東西可顯示（清單還沒載到、載入失敗、或打的字比對不到）就整個面板收起來：
// 這是輸入建議、不是搜尋結果，顯示「查無建議」會誤導使用者以為這個詞搜不到——
// 搜尋本身並不限於這 54 個詞。
const isPanelVisible = computed(() => isOpen.value && displayItems.value.length > 0);

const activeOptionId = computed(() =>
  isPanelVisible.value && highlightedIndex.value >= 0
    ? getOptionId(highlightedIndex.value)
    : undefined,
);

async function fetchKeywordList(): Promise<string[] | null> {
  const { data, error } = await $WebApiGetDetailed("/Code/GetCodeKeywordList");
  if (error) return null;

  const rows = getApiResultValue<KeywordCodeRow[]>(data);
  if (!Array.isArray(rows)) return null;

  return rows
    .map((row) => (row?.codeName || "").trim())
    // 其他 Code 清單慣例會塞「全選」佔位項；關鍵字清單目前沒有，防禦性排除以免哪天出現
    .filter((name) => name && name !== "全選");
}

async function ensureKeywordList() {
  if (keywordListCache) {
    keywordList.value = keywordListCache;
    return;
  }

  if (!keywordListRequest) {
    keywordListRequest = fetchKeywordList();
  }

  const list = await keywordListRequest;
  if (list && list.length > 0) {
    keywordListCache = list;
    keywordList.value = list;
  } else {
    // 失敗就安靜收場：面板不出現、不留任何錯誤狀態，下次聚焦時重試。
    // $WebApiGetDetailed 已把失敗記進 console，這裡不需要再報。
    keywordListRequest = null;
  }
}

function openPanel() {
  if (props.disabled) return;
  isOpen.value = true;
  void ensureKeywordList();
}

function handleFocus() {
  openPanel();
}

function handleInput(event: Event) {
  const nextValue = (event.target as HTMLInputElement).value || "";
  emit("update:modelValue", nextValue);
  if (!isOpen.value) {
    openPanel();
  }
}

function handleCompositionStart() {
  isComposing.value = true;
}

function handleCompositionEnd(event: CompositionEvent) {
  isComposing.value = false;
  // 各瀏覽器 compositionend 與最後一個 input 事件的先後不一，這裡再同步一次最終字串
  const nextValue = (event.target as HTMLInputElement)?.value || "";
  emit("update:modelValue", nextValue);
}

function moveHighlight(step: number) {
  // 組字中的上下鍵是在注音選字窗裡挑候選字，不能拿來移動建議反白
  if (isComposing.value) return;

  if (!isOpen.value) {
    openPanel();
    return;
  }

  const items = displayItems.value;
  if (items.length === 0) return;

  const nextIndex = highlightedIndex.value + step;
  if (nextIndex < 0) {
    highlightedIndex.value = items.length - 1;
  } else if (nextIndex >= items.length) {
    highlightedIndex.value = 0;
  } else {
    highlightedIndex.value = nextIndex;
  }
}

function handleEnter(event: KeyboardEvent) {
  // 注音組字時按的 Enter 是在「選字」，不是要送出。不守這關，選字那一下就會
  // 拿走正反白的建議、或把只打到一半的詞送去搜尋。Chrome 組字中 keydown 的
  // event.isComposing 為 true（key 為 Process，多半根本進不到這個 handler），
  // 但各瀏覽器時序不一（Safari 會先發 compositionend），兩個旗標一起看比較穩。
  if (event.isComposing || isComposing.value) return;

  const activeItem = displayItems.value[highlightedIndex.value];
  if (activeItem) {
    emit("update:modelValue", activeItem);
  }
  emit("submit");
  closePanel();
}

function selectKeyword(keyword: string) {
  emit("update:modelValue", keyword);
  emit("submit");
  closePanel();
}

function closePanel() {
  isOpen.value = false;
  highlightedIndex.value = -1;
}

function handleDocumentPointerDown(event: PointerEvent) {
  if (!rootRef.value) return;
  if (rootRef.value.contains(event.target as Node)) return;
  closePanel();
}

// 打字改變過濾結果後，舊的反白位置指的已是另一筆（或不存在的）項目，
// 不歸零的話下一個 Enter 會選到使用者根本沒看到的東西
watch(displayItems, () => {
  highlightedIndex.value = -1;
});

onMounted(() => {
  document.addEventListener("pointerdown", handleDocumentPointerDown);
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", handleDocumentPointerDown);
});
</script>

<style scoped lang="scss">
.ifare-search-autocomplete {
  position: relative;
  width: 100%;
}

.query-input-wrap {
  position: relative;
  width: 100%;
}

.input-query {
  width: 100%;
  min-width: 0;
  padding-right: 64px;
  box-sizing: border-box;
}

.query-count {
  position: absolute;
  right: 14px;
  bottom: 50%;
  transform: translateY(50%);
  pointer-events: none;
  color: rgba(22, 63, 64, 0.46);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.search-suggestion-panel {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  right: 0;
  z-index: 25;
  background: #fff;
  border: 1px solid rgba(16, 94, 96, 0.16);
  border-radius: 18px;
  box-shadow: 0 18px 48px rgba(21, 74, 76, 0.16);
  padding: 14px;
}

.panel-title {
  margin-bottom: 10px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: rgba(20, 70, 72, 0.68);
}

.topic-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.suggestion-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.topic-chip,
.suggestion-item {
  border: 0;
  cursor: pointer;
  color: #163f40;
  font-size: 14px;
}

.topic-chip {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(26, 100, 102, 0.08);
  color: #18585a;
}

.topic-chip.active,
.topic-chip:hover {
  background: rgba(26, 100, 102, 0.16);
}

.suggestion-item {
  width: 100%;
  padding: 10px 12px;
  border-radius: 12px;
  background: transparent;
  text-align: left;
}

.suggestion-item.active,
.suggestion-item:hover {
  background: rgba(26, 100, 102, 0.08);
}

@media (max-width: 1024px) {
  .search-suggestion-panel {
    position: static;
    margin-top: 10px;
    border-radius: 16px;
    box-shadow: 0 12px 32px rgba(21, 74, 76, 0.12);
  }

  .topic-chip-list {
    gap: 10px;
  }

  .topic-chip {
    max-width: 100%;
    overflow-wrap: anywhere;
  }

  .suggestion-item {
    padding: 12px;
  }
}

@media (max-width: 640px) {
  .input-query {
    padding-right: 58px;
  }

  .query-count {
    right: 12px;
    font-size: 10px;
  }
}
</style>
