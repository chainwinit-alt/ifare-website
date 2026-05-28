<template>
  <main-header>
    <template #btnsRight>
      <el-button plain @click="startCreateTerm">新增搜尋詞</el-button>
    </template>
  </main-header>

  <el-scrollbar class="main-scrollbar">
    <section class="section-main-card card-fullsize">
      <div class="card-info section-head">
        <div>
          <h3>搜尋詞管理</h3>
          <p>以前台顯示詞為單位管理搜尋熱度，不再拆成來源下拉清單。</p>
        </div>
        <div class="summary-inline">
          <span>{{ filteredGroupedTerms.length }} 個顯示詞</span>
          <span>{{ activeTerms }} 筆啟用中</span>
          <span>{{ inactiveTerms }} 筆停用中</span>
          <span>{{ totalAliases }} 個別名</span>
        </div>
      </div>
    </section>

    <section class="governance-layout">
      <article class="section-main-card card-fullsize">
        <div class="card-info">
          <div class="term-toolbar">
            <div class="group-hint">
              <strong>聚合視圖</strong>
              <p>同一個顯示詞直接顯示 7 日熱度與 30 日搜尋數，來源資訊只保留摘要。</p>
            </div>
            <el-input
              v-model="searchKeyword"
              class="term-search-input"
              clearable
              placeholder="搜尋顯示詞、類型、來源或狀態"
            />
          </div>

          <div class="formula-note">
            <h4>熱度計算說明</h4>
            <p>`7日熱度` 來自近 7 天每日熱度分數加總，分數會綜合搜尋次數、結果頁觸發次數、非零結果表現、內容支撐度、人工加權與基礎權重。表格中顯示的是依目前清單最高熱度標準化後的 0-100 分數。</p>
            <p>`30日搜尋數` 為近 30 天同一顯示詞群組下所有搜尋詞的搜尋次數加總。單次搜尋事件應只計入一次，不因同名來源重複累加。</p>
          </div>

          <el-table :data="filteredGroupedTerms" stripe style="width: 100%">
            <el-table-column prop="displayTerm" label="搜尋詞" min-width="200" />
            <el-table-column label="7日熱度" width="150">
              <template #default="{ row }">
                <div class="heat-score-cell">
                  <strong>{{ row.aggregateHotScore7dPercent }}</strong>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="aggregateSearchCount30d" label="30日搜尋數" width="130" />
            <el-table-column prop="aggregateAliasCount" label="別名數" width="100" />
            <el-table-column label="啟用" width="90">
              <template #default="{ row }">
                <span>{{ row.activeCount }}/{{ row.itemCount }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="typeSummary" label="類型" min-width="150" />
            <el-table-column prop="sourceSummary" label="來源" min-width="200" />
            <el-table-column prop="latestUpdated" label="最近更新" width="170" />
            <el-table-column label="操作" width="120" align="center">
              <template #default="{ row }">
                <el-button text type="primary" @click="openGroupEditor(row)">編輯</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </article>
    </section>
  </el-scrollbar>

  <el-dialog
    v-model="isTermDialogOpen"
    :title="isCreatingTerm ? '新增搜尋詞' : selectedTerm?.displayTerm || '編輯搜尋詞'"
    width="880px"
    append-to-body
    :z-index="4000"
    modal-class="search-governance-term-modal"
    destroy-on-close
  >
    <div v-if="selectedTerm" class="term-dialog-body">
      <div class="inspector-head">
        <div>
          <h3>{{ isCreatingTerm ? "新增搜尋詞" : selectedTerm.displayTerm }}</h3>
          <p>{{ isCreatingTerm ? "建立新的標準搜尋詞。" : selectedTerm.normalizedTerm }}</p>
        </div>
        <el-tag :type="selectedTerm.status === 'active' ? 'success' : 'info'">
          {{ isCreatingTerm ? "草稿" : getStatusLabel(selectedTerm.status) }}
        </el-tag>
      </div>

      <div class="kv-grid">
        <div class="kv-item">
          <span>正規化詞</span>
          <strong>{{ isCreatingTerm ? "建立後產生" : selectedTerm.normalizedTerm }}</strong>
        </div>
        <div class="kv-item">
          <span>最近更新</span>
          <strong>{{ isCreatingTerm ? "尚未建立" : selectedTerm.lastUpdated }}</strong>
        </div>
      </div>

      <div class="editor-grid">
        <div class="editor-item">
          <label>顯示詞</label>
          <div class="display-term-input-wrap">
            <input
              v-model="termForm.displayTerm"
              class="display-term-native-input"
              placeholder="輸入或選擇既有顯示詞"
              @focus="showDisplayTermSuggestions = true"
              @blur="hideDisplayTermSuggestions"
            />
            <div
              v-if="showDisplayTermSuggestions && filteredDisplayTermOptions.length"
              class="display-term-suggestions"
            >
              <button
                v-for="option in filteredDisplayTermOptions"
                :key="option"
                type="button"
                class="display-term-suggestion-item"
                @mousedown.prevent="selectDisplayTermOption(option)"
              >
                {{ option }}
              </button>
            </div>
          </div>
        </div>
        <div class="editor-item">
          <label>類型</label>
          <select v-model="termForm.termType" class="editor-native-select">
            <option value="keyword">關鍵字</option>
            <option value="policy">政策分類</option>
            <option value="policy_title">政策標題</option>
            <option value="trend">趨勢詞</option>
            <option value="recipient">受助者</option>
            <option value="identity">特殊身分</option>
            <option value="income">所得別</option>
          </select>
        </div>
        <div class="editor-item">
          <label>來源</label>
          <select v-model="termForm.sourceKind" class="editor-native-select">
            <option value="code_keyword">程式關鍵字</option>
            <option value="policy_extract">政策抽取</option>
            <option value="ifare_policy">iFare 政策</option>
            <option value="manual">手動建立</option>
            <option value="google_trends_related_query">Google Trends</option>
          </select>
        </div>
        <div class="editor-item">
          <label>狀態</label>
          <select v-model="termForm.status" class="editor-native-select">
            <option value="active">啟用</option>
            <option value="inactive">停用</option>
          </select>
        </div>
        <div class="editor-item">
          <label>人工加權</label>
          <el-input-number v-model="termForm.manualBoost" :min="0" :max="10" :step="0.1" :precision="2" />
        </div>
        <div class="editor-item">
          <label>基礎權重</label>
          <el-input-number v-model="termForm.baseWeight" :min="0" :max="10" :step="0.05" :precision="2" />
        </div>
      </div>

      <div class="metric-stack">
        <div>
          <div class="metric-row">
            <span>7日熱度</span>
            <strong>{{ isCreatingTerm ? 0 : selectedTerm.hotScore7d }}</strong>
          </div>
          <el-progress :percentage="Math.min(100, isCreatingTerm ? 0 : selectedTerm.hotScore7d)" :stroke-width="10" />
        </div>
        <div>
          <div class="metric-row">
            <span>別名數</span>
            <strong>{{ isCreatingTerm ? 0 : selectedTerm.aliasCount }}</strong>
          </div>
          <el-progress :percentage="Math.min(100, (isCreatingTerm ? 0 : selectedTerm.aliasCount) * 20)" status="success" :stroke-width="10" />
        </div>
      </div>

      <div class="inspector-note">
        <h4>治理備註</h4>
        <el-input
          v-model="termForm.note"
          type="textarea"
          :rows="4"
          resize="none"
          placeholder="記錄這個搜尋詞的治理原因或後續處理方向。"
        />
      </div>
    </div>

    <template #footer>
      <div class="dialog-actions">
        <el-button plain @click="resetTermForm" :disabled="isSavingTerm">重設</el-button>
        <el-button plain @click="closeTermDialog" :disabled="isSavingTerm">{{ isCreatingTerm ? "取消" : "關閉" }}</el-button>
        <el-button
          v-if="!isCreatingTerm && selectedTerm"
          type="primary"
          plain
          @click="router.push({ name: 'SearchGovernance_Aliases', query: { term: selectedTerm.displayTerm } })"
        >
          管理別名
        </el-button>
        <el-button type="primary" @click="saveTerm" :loading="isSavingTerm">
          {{ isCreatingTerm ? "建立搜尋詞" : "儲存變更" }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, ref, watch } from "vue";
import {
  ElButton,
  ElDialog,
  ElInput,
  ElInputNumber,
  ElOption,
  ElProgress,
  ElScrollbar,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from "element-plus";
import { useRoute, useRouter } from "vue-router";
import MainHeader from "@/components/MainHeader.vue";
import type { SearchTermItem } from "@/data/SearchGovernance";
import { useUserStore } from "@/stores/user";

interface SearchTermGroup {
  key: string;
  displayTerm: string;
  itemCount: number;
  activeCount: number;
  aggregateHotScore7d: number;
  aggregateHotScore7dPercent: number;
  aggregateSearchCount30d: number;
  aggregateAliasCount: number;
  typeSummary: string;
  sourceSummary: string;
  latestUpdated: string;
  primaryItem: SearchTermItem | null;
  items: SearchTermItem[];
}

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const app = getCurrentInstance();
const $WebAPI = app?.appContext.config.globalProperties.$WebAPI;
const $Message = app?.appContext.config.globalProperties.$message;

const searchTerms = ref<SearchTermItem[]>([]);
const searchKeyword = ref("");
const selectedTerm = ref<SearchTermItem | null>(null);
const isTermDialogOpen = ref(false);
const isCreatingTerm = ref(false);
const isSavingTerm = ref(false);
const showDisplayTermSuggestions = ref(false);
const termForm = ref(createTermForm(selectedTerm.value));

const activeTerms = computed(() => searchTerms.value.filter((item) => item.status === "active").length);
const inactiveTerms = computed(() => searchTerms.value.length - activeTerms.value);
const totalAliases = computed(() => searchTerms.value.reduce((sum, item) => sum + item.aliasCount, 0));
const displayTermOptions = computed(() => {
  return Array.from(
    new Set(
      baseGroupedTerms.value
        .map((item) => item.displayTerm.trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b, "zh-Hant"));
});

const filteredDisplayTermOptions = computed(() => {
  const keyword = termForm.value.displayTerm.trim().toLowerCase();

  return displayTermOptions.value
    .filter((option) => !keyword || option.toLowerCase().includes(keyword))
    .slice(0, 8);
});

const baseGroupedTerms = computed<SearchTermGroup[]>(() => {
  const groupMap = new Map<string, SearchTermItem[]>();

  searchTerms.value.forEach((item) => {
    const key = item.displayTerm.trim().toLowerCase() || `(empty-${item.id})`;
    const current = groupMap.get(key) || [];
    current.push(item);
    groupMap.set(key, current);
  });

  return Array.from(groupMap.entries())
    .map(([key, items]) => {
      const sortedItems = [...items].sort((a, b) => {
        if (a.status !== b.status) {
          return a.status === "active" ? -1 : 1;
        }
        if (b.hotScore7d !== a.hotScore7d) {
          return b.hotScore7d - a.hotScore7d;
        }
        if (b.searchCount30d !== a.searchCount30d) {
          return b.searchCount30d - a.searchCount30d;
        }
        return a.id - b.id;
      });

      return {
        key,
        displayTerm: sortedItems[0]?.displayTerm || "",
        itemCount: sortedItems.length,
        activeCount: sortedItems.filter((item) => item.status === "active").length,
        aggregateHotScore7d: sortedItems.reduce((sum, item) => sum + Number(item.hotScore7d || 0), 0),
        aggregateHotScore7dPercent: 0,
        aggregateSearchCount30d: sortedItems.reduce((sum, item) => sum + Number(item.searchCount30d || 0), 0),
        aggregateAliasCount: sortedItems.reduce((sum, item) => sum + Number(item.aliasCount || 0), 0),
        typeSummary: Array.from(new Set(sortedItems.map((item) => getTermTypeLabel(item.termType)))).join(" / "),
        sourceSummary: Array.from(new Set(sortedItems.map((item) => getSourceKindLabel(item.sourceKind)))).join(" / "),
        latestUpdated: sortedItems.find((item) => item.lastUpdated)?.lastUpdated || "",
        primaryItem: sortedItems[0] || null,
        items: sortedItems,
      };
    })
    .sort((a, b) => {
      if (b.aggregateHotScore7d !== a.aggregateHotScore7d) {
        return b.aggregateHotScore7d - a.aggregateHotScore7d;
      }
      if (b.aggregateSearchCount30d !== a.aggregateSearchCount30d) {
        return b.aggregateSearchCount30d - a.aggregateSearchCount30d;
      }
      return a.displayTerm.localeCompare(b.displayTerm, "zh-Hant");
    });
});

const maxAggregateHotScore7d = computed(() => {
  return baseGroupedTerms.value.reduce((max, group) => Math.max(max, Number(group.aggregateHotScore7d || 0)), 0);
});

const groupedTerms = computed<SearchTermGroup[]>(() => {
  if (maxAggregateHotScore7d.value <= 0) {
    return baseGroupedTerms.value.map((group) => ({
      ...group,
      aggregateHotScore7dPercent: 0,
    }));
  }

  return baseGroupedTerms.value.map((group) => ({
    ...group,
    aggregateHotScore7dPercent: Math.round((Number(group.aggregateHotScore7d || 0) / maxAggregateHotScore7d.value) * 100),
  }));
});

const normalizedSearchKeyword = computed(() => searchKeyword.value.trim().toLowerCase());

const filteredGroupedTerms = computed<SearchTermGroup[]>(() => {
  const keyword = normalizedSearchKeyword.value;
  if (!keyword) {
    return groupedTerms.value;
  }

  return groupedTerms.value.filter((group) => {
    const haystacks = [
      group.displayTerm,
      group.typeSummary,
      group.sourceSummary,
      group.latestUpdated,
      ...group.items.flatMap((item) => [item.normalizedTerm, item.termType, item.sourceKind, item.status]),
    ];

    return haystacks.some((value) => String(value || "").toLowerCase().includes(keyword));
  });
});

function getStatusLabel(status: string) {
  return status === "active" ? "啟用" : status === "inactive" ? "停用" : status;
}

function getTermTypeLabel(termType: string) {
  const labels: Record<string, string> = {
    keyword: "關鍵字",
    policy: "政策分類",
    policy_title: "政策標題",
    trend: "趨勢詞",
    recipient: "受助者",
    identity: "特殊身分",
    income: "所得別",
  };
  return labels[termType] || termType;
}

function getSourceKindLabel(sourceKind: string) {
  const labels: Record<string, string> = {
    code_keyword: "程式關鍵字",
    policy_extract: "政策抽取",
    ifare_policy: "iFare 政策",
    manual: "手動建立",
    google_trends_related_query: "Google Trends",
  };
  return labels[sourceKind] || sourceKind;
}

function createTermForm(term: SearchTermItem | null) {
  return {
    displayTerm: term?.displayTerm || "",
    termType: term?.termType || "keyword",
    sourceKind: term?.sourceKind || "manual",
    status: (term?.status || "active") as SearchTermItem["status"],
    manualBoost: Number(term?.manualBoost || 0),
    baseWeight: Number(term?.baseWeight || 1),
    note: term?.note || "",
  };
}

function selectDisplayTermOption(option: string) {
  termForm.value.displayTerm = option;
  showDisplayTermSuggestions.value = false;
}

function hideDisplayTermSuggestions() {
  window.setTimeout(() => {
    showDisplayTermSuggestions.value = false;
  }, 120);
}

function selectTerm(term: SearchTermItem) {
  isCreatingTerm.value = false;
  selectedTerm.value = term;
  isTermDialogOpen.value = true;
}

function openGroupEditor(group: SearchTermGroup) {
  if (group.primaryItem) {
    selectTerm(group.primaryItem);
  }
}

function startCreateTerm() {
  isCreatingTerm.value = true;
  selectedTerm.value = {
    id: 0,
    displayTerm: "",
    normalizedTerm: "",
    termType: "keyword",
    sourceKind: "manual",
    status: "active",
    manualBoost: 0,
    baseWeight: 1,
    hotScore7d: 0,
    searchCount30d: 0,
    lastUpdated: "",
    aliasCount: 0,
    note: "",
  };
  isTermDialogOpen.value = true;
}

function closeTermDialog() {
  isTermDialogOpen.value = false;
  showDisplayTermSuggestions.value = false;
  if (isCreatingTerm.value) {
    isCreatingTerm.value = false;
    selectedTerm.value = searchTerms.value[0] || null;
  }
}

function resetTermForm() {
  termForm.value = createTermForm(selectedTerm.value);
}

function applyFocusedTerm() {
  const focusId = Number(route.query.focus || 0);
  if (!focusId) return false;
  const match = searchTerms.value.find((item) => item.id === focusId);
  if (match) {
    selectedTerm.value = match;
    return true;
  }
  return false;
}

function loadTerms() {
  if (!$WebAPI || !userStore.token) {
    return;
  }

  $WebAPI.GetSearchGovernanceTerms(userStore.token, (res: any) => {
    const payload = res?.data?.result;
    if (!payload || payload.errCode != 0 || !Array.isArray(payload.result)) {
      return;
    }

    searchTerms.value = payload.result;
    selectedTerm.value = payload.result[0] || null;
    applyFocusedTerm();
  });
}

function saveTerm() {
  if (!selectedTerm.value) return;
  if (!$WebAPI || !userStore.token) {
    $Message?.({ type: "error", message: "搜尋詞 API 尚未就緒。" });
    return;
  }

  const displayTerm = termForm.value.displayTerm.trim();
  if (!displayTerm) {
    $Message?.({ type: "warning", message: "請輸入顯示詞。" });
    return;
  }

  isSavingTerm.value = true;
  const action = isCreatingTerm.value ? $WebAPI.CreateSearchGovernanceTerm : $WebAPI.UpdateSearchGovernanceTerm;
  const payloadData: any = {
    displayTerm,
    termType: termForm.value.termType,
    sourceKind: termForm.value.sourceKind,
    status: termForm.value.status,
    manualBoost: termForm.value.manualBoost,
    baseWeight: termForm.value.baseWeight,
    note: termForm.value.note.trim(),
  };

  if (!isCreatingTerm.value) {
    payloadData.id = selectedTerm.value.id;
  }

  action.call($WebAPI, userStore.token, payloadData, (res: any) => {
    isSavingTerm.value = false;
    const payload = res?.data?.result;
    if (!payload || payload.errCode != 0 || !payload.result) {
      $Message?.({ type: "error", message: payload?.errMsg || "搜尋詞儲存失敗。" });
      return;
    }

    const updatedTerm = payload.result as SearchTermItem;
    const targetIndex = searchTerms.value.findIndex((item) => item.id === updatedTerm.id);
    if (targetIndex >= 0) {
      searchTerms.value[targetIndex] = updatedTerm;
    } else {
      searchTerms.value.unshift(updatedTerm);
    }

    isCreatingTerm.value = false;
    selectedTerm.value = updatedTerm;
    isTermDialogOpen.value = false;
    resetTermForm();
    $Message?.({ type: "success", message: targetIndex >= 0 ? "搜尋詞已更新。" : "搜尋詞已建立。" });
  });
}

watch(
  selectedTerm,
  (term) => {
    termForm.value = createTermForm(term);
  },
  { immediate: true }
);

onMounted(() => {
  loadTerms();
});
</script>

<style scoped>
.section-head,
.summary-inline,
.governance-layout,
.inspector-head,
.metric-row,
.dialog-actions {
  display: flex;
}

.section-head,
.inspector-head,
.metric-row {
  justify-content: space-between;
}

.section-head,
.summary-inline,
.inspector-head,
.dialog-actions {
  align-items: center;
}

.section-head h3,
.section-head p,
.inspector-head h3,
.inspector-head p,
.inspector-note h4 {
  margin: 0;
}

.summary-inline {
  gap: 14px;
  color: #6b7280;
}

.heat-score-cell {
  display: grid;
  justify-items: start;
}

.group-hint {
  padding: 14px 16px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  display: inline-block;
  max-width: 540px;
}

.term-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.term-search-input {
  width: min(360px, 100%);
}

.group-hint strong,
.group-hint p {
  margin: 0;
}

.group-hint p {
  margin-top: 6px;
  color: #6b7280;
}

.formula-note {
  display: grid;
  gap: 8px;
  margin-bottom: 16px;
  padding: 14px 16px;
  border-radius: 14px;
  background: #fffaf0;
  border: 1px solid #f5d7a1;
}

.formula-note h4,
.formula-note p {
  margin: 0;
}

.formula-note p {
  color: #6b7280;
  line-height: 1.6;
}

.governance-layout {
  margin-top: 16px;
}

.inspector-head p,
.kv-item span,
.editor-item label {
  color: #6b7280;
}

.term-dialog-body {
  display: grid;
  gap: 22px;
}

.kv-grid,
.editor-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.editor-grid {
  gap: 14px;
}

.kv-item {
  padding: 14px 16px;
  border-radius: 14px;
  background: #f8fafc;
}

.kv-item strong {
  display: block;
  margin-top: 6px;
}

.editor-item {
  display: grid;
  gap: 8px;
}

.display-term-input-wrap {
  width: 100%;
  position: relative;
}

.display-term-native-input {
  width: 100%;
  min-height: 32px;
  padding: 0 11px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  color: #303133;
  background: #fff;
  font-size: 14px;
  line-height: 32px;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.display-term-native-input:focus {
  border-color: #409eff;
  outline: none;
}

.editor-native-select {
  width: 100%;
  min-height: 32px;
  padding: 0 11px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  color: #303133;
  background: #fff;
  font-size: 14px;
  line-height: 32px;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.editor-native-select:focus {
  border-color: #409eff;
  outline: none;
}

.display-term-suggestions {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 20;
  max-height: 240px;
  overflow-y: auto;
  padding: 6px 0;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
}

.display-term-suggestion-item {
  display: block;
  width: 100%;
  padding: 9px 12px;
  border: 0;
  background: transparent;
  color: #303133;
  text-align: left;
  cursor: pointer;
}

.display-term-suggestion-item:hover {
  background: #f5f7fa;
}

.editor-item :deep(.el-select),
.editor-item :deep(.el-autocomplete),
.editor-item :deep(.el-autocomplete .el-input) {
  width: 100%;
}

.metric-stack {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.metric-row {
  margin-bottom: 8px;
}

.inspector-note {
  display: grid;
  gap: 10px;
}

.dialog-actions {
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 1100px) {
  .editor-grid,
  .kv-grid,
  .metric-stack {
    grid-template-columns: 1fr;
  }

  .term-toolbar {
    display: grid;
  }

  .dialog-actions {
    flex-wrap: wrap;
    justify-content: flex-start;
  }
}
</style>
