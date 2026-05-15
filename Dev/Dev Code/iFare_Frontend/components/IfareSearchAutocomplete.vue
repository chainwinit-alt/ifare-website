<template>
  <div ref="rootRef" class="ifare-search-autocomplete" :class="{ 'is-open': isOpen }">
    <div class="query-input-wrap">
      <input
        ref="inputRef"
        :value="modelValue"
        class="input-query"
        type="text"
        :maxlength="maxLength"
        :placeholder="placeholder"
        autocomplete="off"
        :disabled="disabled"
        @focus="handleFocus"
        @input="handleInput"
        @keydown.down.prevent="moveHighlight(1)"
        @keydown.up.prevent="moveHighlight(-1)"
        @keydown.enter.prevent="handleEnter"
        @keydown.esc.prevent="closePanel"
      />
      <div v-if="showCount" class="query-count" aria-live="polite">{{ modelValue.length }}/{{ maxLength }}</div>
    </div>

    <div v-if="isOpen" class="search-suggestion-panel">
      <div v-if="isLoading" class="panel-state">Loading suggestions...</div>
      <div v-else-if="displayItems.length === 0 && hotKeywords.length === 0" class="panel-state">No suggestions available.</div>
      <template v-else>
        <div v-if="!trimmedQuery && hotKeywords.length > 0" class="panel-section">
          <div class="panel-title">Popular Keywords</div>
          <div class="hot-keyword-list">
            <button
              v-for="(keyword, index) in hotKeywords"
              :key="keyword"
              class="hot-keyword-chip transition-general"
              type="button"
              :class="{ active: highlightedIndex === index }"
              @mouseenter="highlightedIndex = index"
              @click="selectKeyword(keyword)"
            >
              {{ keyword }}
            </button>
          </div>
        </div>

        <div v-if="trimmedQuery && displayItems.length > 0" class="panel-section">
          <div class="panel-title">Suggestions</div>
          <button
            v-for="(item, index) in displayItems"
            :key="`${item.type}-${item.text}`"
            class="suggestion-item transition-general"
            type="button"
            :class="{ active: highlightedIndex === index }"
            @mouseenter="highlightedIndex = index"
            @click="selectSuggestion(item.text)"
          >
            <span class="suggestion-main">{{ item.text }}</span>
            <span class="suggestion-meta">{{ getTypeLabel(item.type) }}</span>
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
interface SuggestionFilters {
  CodePolicy?: string | number | null;
  CodeRecipient?: string | number | null;
  CodeDomicile?: string | number | null;
  CodeIncome?: string | number | null;
  CodeIdentities?: Array<string | number>;
}

interface SuggestionItem {
  text: string;
  type: string;
  matchCount?: number;
}

interface SuggestionPayload {
  hotKeywords?: string[];
  suggestions?: SuggestionItem[];
}

const props = withDefaults(defineProps<{
  modelValue: string;
  placeholder?: string;
  maxLength?: number;
  filters?: SuggestionFilters;
  disabled?: boolean;
  showCount?: boolean;
}>(), {
  placeholder: "Enter keyword",
  maxLength: 50,
  filters: () => ({}),
  disabled: false,
  showCount: true,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "submit"): void;
}>();

const { $WebApiGetDetailed } = useNuxtApp();
const { getApiResultValue } = useApiResult();

const rootRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const isOpen = ref(false);
const isLoading = ref(false);
const highlightedIndex = ref(-1);
const hotKeywords = ref<string[]>([]);
const suggestions = ref<SuggestionItem[]>([]);
const trimmedQuery = computed(() => props.modelValue.trim());
const displayItems = computed(() =>
  trimmedQuery.value
    ? suggestions.value
    : hotKeywords.value.map((text) => ({ text, type: "hot" })),
);

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function buildRequestQuery() {
  const query: Record<string, any> = {
    Limit: 8,
    HotLimit: 8,
  };

  if (trimmedQuery.value) query.Query = trimmedQuery.value;
  if (props.filters?.CodePolicy) query.CodePolicy = props.filters.CodePolicy;
  if (props.filters?.CodeRecipient) query.CodeRecipient = props.filters.CodeRecipient;
  if (props.filters?.CodeDomicile) query.CodeDomicile = props.filters.CodeDomicile;
  if (props.filters?.CodeIncome) query.CodeIncome = props.filters.CodeIncome;
  if (props.filters?.CodeIdentities && props.filters.CodeIdentities.length > 0) {
    query.CodeIdentities = props.filters.CodeIdentities;
  }

  return query;
}

async function loadSuggestions() {
  if (props.disabled) return;

  isLoading.value = true;
  try {
    const { data } = await $WebApiGetDetailed("/FarePolicy/GetIFareSearchSuggestions", buildRequestQuery());
    const payload = getApiResultValue<SuggestionPayload>(data) || {};
    hotKeywords.value = Array.isArray(payload.hotKeywords)
      ? payload.hotKeywords.filter(Boolean)
      : [];
    suggestions.value = Array.isArray(payload.suggestions)
      ? payload.suggestions.filter((item) => item?.text)
      : [];
    highlightedIndex.value = -1;
  } catch {
    hotKeywords.value = [];
    suggestions.value = [];
    highlightedIndex.value = -1;
  } finally {
    isLoading.value = false;
  }
}

function queueLoadSuggestions() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    loadSuggestions();
  }, 180);
}

function handleFocus() {
  isOpen.value = true;
  queueLoadSuggestions();
}

function handleInput(event: Event) {
  const nextValue = (event.target as HTMLInputElement).value || "";
  emit("update:modelValue", nextValue);
  if (!isOpen.value) {
    isOpen.value = true;
  }
  queueLoadSuggestions();
}

function moveHighlight(step: number) {
  if (!isOpen.value) {
    isOpen.value = true;
    queueLoadSuggestions();
    return;
  }

  const items = displayItems.value;
  if (items.length === 0) return;

  const nextIndex = highlightedIndex.value + step;
  if (nextIndex < 0) {
    highlightedIndex.value = items.length - 1;
    return;
  }
  if (nextIndex >= items.length) {
    highlightedIndex.value = 0;
    return;
  }

  highlightedIndex.value = nextIndex;
}

function handleEnter() {
  const activeItem = displayItems.value[highlightedIndex.value];
  if (activeItem?.text) {
    emit("update:modelValue", activeItem.text);
  }
  emit("submit");
  closePanel();
}

function selectKeyword(keyword: string) {
  emit("update:modelValue", keyword);
  emit("submit");
  closePanel();
}

function selectSuggestion(text: string) {
  emit("update:modelValue", text);
  emit("submit");
  closePanel();
}

function closePanel() {
  isOpen.value = false;
  highlightedIndex.value = -1;
}

function getTypeLabel(type: string) {
  switch (type) {
    case "keyword":
      return "Keyword";
    case "title":
      return "Title";
    case "policy":
      return "Policy";
    case "area":
      return "Area";
    case "recipient":
      return "Recipient";
    case "identity":
      return "Identity";
    case "income":
      return "Income";
    case "qualification":
      return "Rule";
    default:
      return "Suggest";
  }
}

function handleDocumentPointerDown(event: PointerEvent) {
  if (!rootRef.value) return;
  if (rootRef.value.contains(event.target as Node)) return;
  closePanel();
}

watch(
  () => [trimmedQuery.value, JSON.stringify(props.filters || {})],
  () => {
    if (!isOpen.value) return;
    queueLoadSuggestions();
  },
);

onMounted(() => {
  document.addEventListener("pointerdown", handleDocumentPointerDown);
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", handleDocumentPointerDown);
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
});
</script>

<style scoped lang="scss">
.ifare-search-autocomplete {
  position: relative;
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

.panel-section + .panel-section {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(16, 94, 96, 0.08);
}

.panel-title {
  margin-bottom: 10px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: rgba(20, 70, 72, 0.68);
}

.hot-keyword-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hot-keyword-chip,
.suggestion-item {
  border: 0;
  cursor: pointer;
}

.hot-keyword-chip {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(26, 100, 102, 0.08);
  color: #18585a;
  font-size: 14px;
}

.hot-keyword-chip.active,
.hot-keyword-chip:hover {
  background: rgba(26, 100, 102, 0.16);
}

.suggestion-item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: transparent;
  text-align: left;
}

.suggestion-item.active,
.suggestion-item:hover {
  background: rgba(26, 100, 102, 0.08);
}

.suggestion-main {
  color: #163f40;
  font-size: 14px;
}

.suggestion-meta {
  flex-shrink: 0;
  color: rgba(22, 63, 64, 0.56);
  font-size: 12px;
}

.panel-state {
  padding: 10px 4px;
  color: rgba(22, 63, 64, 0.62);
  font-size: 14px;
}
</style>
