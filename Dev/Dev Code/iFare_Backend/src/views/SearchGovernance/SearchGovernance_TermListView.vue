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
          <p>管理分組後的搜尋詞詞庫、權重、啟用狀態與治理備註。</p>
        </div>
        <div class="summary-inline">
          <span>{{ filteredGroupedTerms.length }} 組</span>
          <span>{{ activeTerms }} 啟用中</span>
          <span>{{ inactiveTerms }} 停用中</span>
          <span>{{ totalAliases }} 個別名</span>
        </div>
      </div>
    </section>

    <section class="governance-layout">
      <article class="section-main-card card-fullsize">
        <div class="card-info">
          <div class="term-toolbar">
            <div class="group-hint">
              <strong>依顯示詞分組</strong>
              <p>展開群組後，可比較相同名稱但不同類型與來源的搜尋詞。</p>
            </div>
            <el-input
              v-model="searchKeyword"
              class="term-search-input"
              clearable
              placeholder="搜尋顯示詞、正規詞、類型或來源"
            />
          </div>
          <el-table :data="filteredGroupedTerms" stripe style="width: 100%">
            <el-table-column type="expand" width="54">
              <template #default="{ row }">
                <div class="child-table-wrap">
                  <el-table :data="row.items" stripe style="width: 100%">
                    <el-table-column label="類型" width="100">
                      <template #default="{ row: childRow }">
                        {{ getTermTypeLabel(childRow.termType) }}
                      </template>
                    </el-table-column>
                    <el-table-column label="來源" min-width="150">
                      <template #default="{ row: childRow }">
                        {{ getSourceKindLabel(childRow.sourceKind) }}
                      </template>
                    </el-table-column>
                    <el-table-column label="狀態" width="100">
                      <template #default="{ row: childRow }">
                        <el-tag :type="childRow.status === 'active' ? 'success' : 'info'" size="small">
                          {{ getStatusLabel(childRow.status) }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="manualBoost" label="手動加權" width="90" />
                    <el-table-column prop="hotScore7d" label="7日熱度" width="90" />
                    <el-table-column prop="searchCount30d" label="30日搜尋數" width="120" />
                    <el-table-column prop="aliasCount" label="別名數" width="80" />
                    <el-table-column prop="lastUpdated" label="更新時間" width="160" />
                    <el-table-column label="操作" width="100" align="center">
                      <template #default="{ row: childRow }">
                        <el-button text type="primary" @click="selectTerm(childRow)">編輯</el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="displayTerm" label="顯示詞" min-width="180" />
            <el-table-column prop="aggregateSearchCount30d" label="30日搜尋數" width="120" />
            <el-table-column prop="itemCount" label="筆數" width="90" />
            <el-table-column label="啟用" width="90">
              <template #default="{ row }">
                <span>{{ row.activeCount }}/{{ row.itemCount }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="typeSummary" label="類型" min-width="140" />
            <el-table-column prop="sourceSummary" label="來源" min-width="180" />
            <el-table-column prop="latestUpdated" label="最近更新" width="160" />
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
          <span>正規詞</span>
          <strong>{{ isCreatingTerm ? "儲存後產生" : selectedTerm.normalizedTerm }}</strong>
        </div>
        <div class="kv-item">
          <span>最後更新</span>
          <strong>{{ isCreatingTerm ? "待建立" : selectedTerm.lastUpdated }}</strong>
        </div>
      </div>

      <div class="editor-grid">
        <div class="editor-item">
          <label>顯示詞</label>
          <el-input v-model="termForm.displayTerm" placeholder="標準顯示詞" />
        </div>
        <div class="editor-item">
          <label>類型</label>
          <el-select v-model="termForm.termType" placeholder="選擇類型">
            <el-option label="關鍵字" value="keyword" />
            <el-option label="政策" value="policy" />
            <el-option label="政策標題" value="policy_title" />
            <el-option label="趨勢" value="trend" />
            <el-option label="對象" value="recipient" />
            <el-option label="身分別" value="identity" />
            <el-option label="所得別" value="income" />
          </el-select>
        </div>
        <div class="editor-item">
          <label>來源</label>
          <el-select v-model="termForm.sourceKind" placeholder="選擇來源">
            <el-option label="程式關鍵字" value="code_keyword" />
            <el-option label="政策擷取" value="policy_extract" />
            <el-option label="iFare 政策" value="ifare_policy" />
            <el-option label="人工建立" value="manual" />
            <el-option label="Google 趨勢關聯字" value="google_trends_related_query" />
          </el-select>
        </div>
        <div class="editor-item">
          <label>狀態</label>
          <el-select v-model="termForm.status" placeholder="選擇狀態">
            <el-option label="啟用" value="active" />
            <el-option label="停用" value="inactive" />
          </el-select>
        </div>
        <div class="editor-item">
          <label>手動加權</label>
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
          <el-progress :percentage="isCreatingTerm ? 0 : selectedTerm.hotScore7d" :stroke-width="10" />
        </div>
        <div>
          <div class="metric-row">
            <span>別名覆蓋數</span>
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
          placeholder="說明這個搜尋詞的治理原因。"
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
          查看別名
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
import { ElButton, ElDialog, ElInput, ElInputNumber, ElOption, ElProgress, ElScrollbar, ElSelect, ElTable, ElTableColumn, ElTag } from "element-plus";
import { useRoute, useRouter } from "vue-router";
import MainHeader from "@/components/MainHeader.vue";
import type { SearchTermItem } from "@/data/SearchGovernance";
import { useUserStore } from "@/stores/user";

interface SearchTermGroup {
  key: string;
  displayTerm: string;
  itemCount: number;
  activeCount: number;
  aggregateSearchCount30d: number;
  typeSummary: string;
  sourceSummary: string;
  latestUpdated: string;
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
const termForm = ref(createTermForm(selectedTerm.value));

const activeTerms = computed(() => searchTerms.value.filter((item) => item.status === "active").length);
const inactiveTerms = computed(() => searchTerms.value.length - activeTerms.value);
const totalAliases = computed(() => searchTerms.value.reduce((sum, item) => sum + item.aliasCount, 0));
const groupedTerms = computed<SearchTermGroup[]>(() => {
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
        return b.searchCount30d - a.searchCount30d;
      });
      const typeSummary = Array.from(new Set(sortedItems.map((item) => getTermTypeLabel(item.termType)))).join("、");
      const sourceSummary = Array.from(new Set(sortedItems.map((item) => getSourceKindLabel(item.sourceKind)))).join("、");
      const aggregateSearchCount30d = sortedItems.reduce((sum, item) => sum + item.searchCount30d, 0);

      return {
        key,
        displayTerm: sortedItems[0]?.displayTerm || "",
        itemCount: sortedItems.length,
        activeCount: sortedItems.filter((item) => item.status === "active").length,
        aggregateSearchCount30d,
        typeSummary,
        sourceSummary,
        latestUpdated: sortedItems.find((item) => item.lastUpdated)?.lastUpdated || "",
        items: sortedItems,
      };
    })
    .sort((a, b) => {
      if (b.aggregateSearchCount30d !== a.aggregateSearchCount30d) {
        return b.aggregateSearchCount30d - a.aggregateSearchCount30d;
      }

      if (a.displayTerm.length !== b.displayTerm.length) {
        return a.displayTerm.length - b.displayTerm.length;
      }

      return a.displayTerm.localeCompare(b.displayTerm);
    });
});

const normalizedSearchKeyword = computed(() => searchKeyword.value.trim().toLowerCase());

const filteredGroupedTerms = computed<SearchTermGroup[]>(() => {
  const keyword = normalizedSearchKeyword.value;
  if (!keyword) {
    return groupedTerms.value;
  }

  return groupedTerms.value
    .map((group) => {
      const filteredItems = group.items.filter((item) => {
        const haystacks = [
          item.displayTerm,
          item.normalizedTerm,
          item.termType,
          item.sourceKind,
          item.status,
        ];

        return haystacks.some((value) => String(value || "").toLowerCase().includes(keyword));
      });

      if (!filteredItems.length) {
        return null;
      }

      const typeSummary = Array.from(new Set(filteredItems.map((item) => getTermTypeLabel(item.termType)))).join("、");
      const sourceSummary = Array.from(new Set(filteredItems.map((item) => getSourceKindLabel(item.sourceKind)))).join("、");

      return {
        ...group,
        itemCount: filteredItems.length,
        activeCount: filteredItems.filter((item) => item.status === "active").length,
        aggregateSearchCount30d: filteredItems.reduce((sum, item) => sum + item.searchCount30d, 0),
        typeSummary,
        sourceSummary,
        latestUpdated: filteredItems.find((item) => item.lastUpdated)?.lastUpdated || "",
        items: filteredItems,
      };
    })
    .filter((group): group is SearchTermGroup => Boolean(group));
});

function getStatusLabel(status: string) {
  return status === "active" ? "啟用" : status === "inactive" ? "停用" : status;
}

function getTermTypeLabel(termType: string) {
  const labels: Record<string, string> = {
    keyword: "關鍵字",
    policy: "政策",
    policy_title: "政策標題",
    trend: "趨勢",
    recipient: "對象",
    identity: "身分別",
    income: "所得別",
  };
  return labels[termType] || termType;
}

function getSourceKindLabel(sourceKind: string) {
  const labels: Record<string, string> = {
    code_keyword: "程式關鍵字",
    policy_extract: "政策擷取",
    ifare_policy: "iFare 政策",
    manual: "人工建立",
    google_trends_related_query: "Google 趨勢關聯字",
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
    baseWeight: Number(term?.baseWeight || 0),
    note: term?.note || "",
  };
}

function selectTerm(term: SearchTermItem) {
  isCreatingTerm.value = false;
  selectedTerm.value = term;
  isTermDialogOpen.value = true;
}

function openGroupEditor(group: SearchTermGroup) {
  if (group.items[0]) {
    selectTerm(group.items[0]);
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
    $Message?.({ type: "error", message: "搜尋治理 API 目前不可用。" });
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

.child-table-wrap {
  padding: 4px 12px 12px;
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

.editor-item :deep(.el-select) {
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
  .term-toolbar,
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
