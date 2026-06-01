<template>
  <main-header>
    <template #btnsRight>
      <el-button plain @click="startCreateAlias">新增別名</el-button>
      <el-button type="primary" @click="router.push({ name: 'SearchGovernance_Dashboard' })">
        返回 Dashboard
      </el-button>
    </template>
  </main-header>

  <el-scrollbar class="main-scrollbar">
    <section class="section-main-card card-fullsize">
      <div class="card-info section-head">
        <div>
          <h3>別名管理</h3>
          <p>管理前台搜尋詞的別名對應，將同義詞穩定映射到標準搜尋詞。</p>
        </div>
        <el-tag type="success" effect="plain">後台 API 已串接</el-tag>
      </div>
    </section>

    <section class="alias-grid">
      <article class="section-main-card card-fullsize">
        <div class="card-info">
          <div class="queue-banner">
            <div>
              <strong>建議操作</strong>
              <p>{{ recommendedAction }}</p>
            </div>
            <el-button plain @click="searchAliases[0] && selectAlias(searchAliases[0])">編輯範例</el-button>
          </div>

          <el-table :data="searchAliases" stripe style="width: 100%">
            <el-table-column prop="alias" label="別名" min-width="140" />
            <el-table-column prop="targetTerm" label="標準搜尋詞" min-width="160" />
            <el-table-column label="類型" width="110">
              <template #default="{ row }">
                {{ getTermTypeLabel(row.targetType) }}
              </template>
            </el-table-column>
            <el-table-column label="匹配模式" width="110">
              <template #default="{ row }">
                {{ getMatchModeLabel(row.matchMode) }}
              </template>
            </el-table-column>
            <el-table-column label="狀態" width="90">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
                  {{ getStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="來源" width="120">
              <template #default="{ row }">
                {{ getSourceKindLabel(row.source) }}
              </template>
            </el-table-column>
            <el-table-column prop="updatedBy" label="更新者" width="120" />
            <el-table-column prop="lastUpdated" label="最近更新" width="160" />
            <el-table-column label="操作" width="100" align="center">
              <template #default="{ row }">
                <el-button text type="primary" @click="selectAlias(row)">編輯</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </article>
    </section>
  </el-scrollbar>

  <el-dialog
    v-model="isAliasDialogOpen"
    :title="isCreatingAlias ? '新增別名' : selectedAlias?.alias || '編輯別名'"
    width="840px"
    append-to-body
    :z-index="4000"
    modal-class="search-governance-alias-modal"
    destroy-on-close
  >
    <div v-if="selectedAlias" class="alias-dialog-body">
      <div class="alias-head">
        <div>
          <h3>{{ isCreatingAlias ? "新增別名" : selectedAlias.alias }}</h3>
          <p class="alias-normalized">
            {{ isCreatingAlias ? "建立新的搜尋別名映射。" : selectedAlias.normalizedAlias }}
          </p>
        </div>
        <el-tag :type="selectedAlias.status === 'active' ? 'success' : 'info'">
          {{ isCreatingAlias ? "草稿" : getStatusLabel(selectedAlias.status) }}
        </el-tag>
      </div>

      <div class="detail-list">
        <div class="detail-item">
          <span>標準搜尋詞</span>
          <strong>{{ isCreatingAlias ? "建立後顯示" : selectedAlias.targetTerm }}</strong>
        </div>
        <div class="detail-item">
          <span>類型</span>
          <strong>{{ isCreatingAlias ? "選擇後顯示" : getTermTypeLabel(selectedAlias.targetType) }}</strong>
        </div>
        <div class="detail-item">
          <span>來源</span>
          <strong>{{ isCreatingAlias ? "手動建立" : getSourceKindLabel(selectedAlias.source) }}</strong>
        </div>
        <div class="detail-item">
          <span>最近更新</span>
          <strong>{{ isCreatingAlias ? "尚未建立" : selectedAlias.lastUpdated }}</strong>
        </div>
      </div>

      <div class="editor-grid">
        <div class="editor-item">
          <label>別名</label>
          <el-input v-model="aliasForm.alias" placeholder="輸入要新增的別名" />
        </div>
        <div class="editor-item">
          <label>標準搜尋詞</label>
          <div class="display-term-input-wrap">
            <input
              v-model="aliasForm.targetTermDisplay"
              class="display-term-native-input"
              placeholder="輸入或選擇標準搜尋詞"
              @input="syncAliasTargetTerm"
              @focus="showTermSuggestions = true"
              @blur="hideTermSuggestions"
            />
            <div v-if="showTermSuggestions && filteredTermOptions.length" class="display-term-suggestions">
              <button
                v-for="term in filteredTermOptions"
                :key="term.id"
                type="button"
                class="display-term-suggestion-item"
                @mousedown.prevent="selectAliasTerm(term)"
              >
                {{ term.displayTerm }}
              </button>
            </div>
          </div>
        </div>
        <div class="editor-item">
          <label>匹配模式</label>
          <select v-model="aliasForm.matchMode" class="editor-native-select">
            <option value="exact">完全相符</option>
            <option value="synonym">同義詞</option>
            <option value="contains">包含</option>
            <option value="prefix">前綴</option>
          </select>
        </div>
        <div class="editor-item">
          <label>狀態</label>
          <select v-model="aliasForm.status" class="editor-native-select">
            <option value="active">啟用</option>
            <option value="inactive">停用</option>
          </select>
        </div>
      </div>

      <div class="mapping-preview">
        <h4>備註</h4>
        <el-input
          v-model="aliasForm.note"
          type="textarea"
          :rows="4"
          resize="none"
          placeholder="補充這個別名的用途、來源或調整原因"
        />
      </div>

      <div class="mapping-preview">
        <h4>設定提醒</h4>
        <ul>
          <li>同一個別名應只指向一個標準搜尋詞，避免前台解析不一致。</li>
          <li>若是常見同義詞，建議使用「同義詞」匹配模式。</li>
          <li>停用後不會再參與搜尋映射，但資料仍會保留。</li>
        </ul>
      </div>
    </div>

    <template #footer>
      <div class="detail-actions">
        <el-button plain @click="resetAliasForm" :disabled="isSavingAlias">重設</el-button>
        <el-button plain @click="closeAliasDialog" :disabled="isSavingAlias">
          {{ isCreatingAlias ? "取消" : "關閉" }}
        </el-button>
        <el-button type="primary" @click="saveAlias" :loading="isSavingAlias">
          {{ isCreatingAlias ? "建立別名" : "儲存變更" }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, ref, watch } from "vue";
import { ElButton, ElDialog, ElInput, ElScrollbar, ElTable, ElTableColumn, ElTag } from "element-plus";
import { useRoute, useRouter } from "vue-router";
import MainHeader from "@/components/MainHeader.vue";
import type { SearchAliasItem, SearchTermItem } from "@/data/SearchGovernance";
import { useUserStore } from "@/stores/user";

type AliasFormState = {
  alias: string;
  termId: number;
  targetTermDisplay: string;
  matchMode: string;
  status: SearchAliasItem["status"];
  note: string;
};

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const app = getCurrentInstance();
const $WebAPI = app?.appContext.config.globalProperties.$WebAPI;
const $Message = app?.appContext.config.globalProperties.$message;

const searchAliases = ref<SearchAliasItem[]>([]);
const searchTerms = ref<SearchTermItem[]>([]);
const selectedAlias = ref<SearchAliasItem | null>(null);
const isAliasDialogOpen = ref(false);
const isCreatingAlias = ref(false);
const isSavingAlias = ref(false);
const showTermSuggestions = ref(false);
const aliasForm = ref<AliasFormState>(createAliasForm(selectedAlias.value));

const recommendedAction = computed(() => {
  const focusedTerm = String(route.query.term || "").trim();
  if (focusedTerm) {
    return `你是從搜尋詞「${focusedTerm}」進來的，可以直接檢查它目前有哪些別名與映射。`;
  }

  return "先確認別名是否映射到正確的標準搜尋詞，再決定匹配模式與啟用狀態。";
});

const filteredTermOptions = computed(() => {
  const keyword = aliasForm.value.targetTermDisplay.trim().toLowerCase();

  return searchTerms.value
    .filter((term) => !keyword || term.displayTerm.toLowerCase().includes(keyword))
    .sort((a, b) => a.displayTerm.localeCompare(b.displayTerm, "zh-Hant"))
    .slice(0, 8);
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

function getMatchModeLabel(matchMode: string) {
  const labels: Record<string, string> = {
    exact: "完全相符",
    synonym: "同義詞",
    contains: "包含",
    prefix: "前綴",
  };
  return labels[matchMode] || matchMode;
}

function createAliasForm(alias: SearchAliasItem | null): AliasFormState {
  const matchedTerm = searchTerms.value.find((item) => item.id === Number(alias?.termId || 0));

  return {
    alias: alias?.alias || "",
    termId: Number(alias?.termId || 0),
    targetTermDisplay: matchedTerm?.displayTerm || alias?.targetTerm || "",
    matchMode: alias?.matchMode || "exact",
    status: (alias?.status || "active") as SearchAliasItem["status"],
    note: alias?.note || "",
  };
}

function selectAlias(alias: SearchAliasItem) {
  isCreatingAlias.value = false;
  selectedAlias.value = alias;
  isAliasDialogOpen.value = true;
}

function startCreateAlias() {
  const initialTerm = searchTerms.value[0] || null;

  isCreatingAlias.value = true;
  selectedAlias.value = {
    id: 0,
    termId: initialTerm?.id || 0,
    alias: "",
    normalizedAlias: "",
    targetTerm: initialTerm?.displayTerm || "",
    targetType: initialTerm?.termType || "",
    matchMode: "synonym",
    status: "active",
    source: "manual",
    updatedBy: "",
    lastUpdated: "",
    note: "",
  };
  isAliasDialogOpen.value = true;
}

function closeAliasDialog() {
  isAliasDialogOpen.value = false;
  showTermSuggestions.value = false;
  if (isCreatingAlias.value) {
    isCreatingAlias.value = false;
    selectedAlias.value = searchAliases.value[0] || null;
  }
}

function resetAliasForm() {
  aliasForm.value = createAliasForm(selectedAlias.value);
}

function selectAliasTerm(term: SearchTermItem) {
  aliasForm.value.termId = term.id;
  aliasForm.value.targetTermDisplay = term.displayTerm;
  showTermSuggestions.value = false;
}

function syncAliasTargetTerm() {
  const normalized = aliasForm.value.targetTermDisplay.trim().toLowerCase();
  const matchedTerm = searchTerms.value.find((term) => term.displayTerm.trim().toLowerCase() === normalized);
  aliasForm.value.termId = matchedTerm?.id || 0;
}

function hideTermSuggestions() {
  window.setTimeout(() => {
    showTermSuggestions.value = false;
  }, 120);
}

function applyFocusedAlias() {
  const term = String(route.query.term || "").trim();
  if (!term) return false;
  const match = searchAliases.value.find((item) => item.targetTerm === term);
  if (match) {
    selectedAlias.value = match;
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

    if (selectedAlias.value) {
      aliasForm.value = createAliasForm(selectedAlias.value);
    }
  });
}

function loadAliases() {
  if (!$WebAPI || !userStore.token) {
    return;
  }

  $WebAPI.GetSearchGovernanceAliases(userStore.token, (res: any) => {
    const payload = res?.data?.result;
    if (!payload || payload.errCode != 0 || !Array.isArray(payload.result)) {
      return;
    }

    searchAliases.value = payload.result;
    selectedAlias.value = payload.result[0] || null;
    applyFocusedAlias();
  });
}

function saveAlias() {
  if (!selectedAlias.value) return;
  if (!$WebAPI || !userStore.token) {
    $Message?.({ type: "error", message: "別名 API 尚未準備完成。" });
    return;
  }

  const alias = aliasForm.value.alias.trim();
  if (!alias) {
    $Message?.({ type: "warning", message: "請輸入別名。" });
    return;
  }
  if (!aliasForm.value.termId) {
    $Message?.({ type: "warning", message: "請選擇標準搜尋詞。" });
    return;
  }

  isSavingAlias.value = true;
  const action = isCreatingAlias.value ? $WebAPI.CreateSearchGovernanceAlias : $WebAPI.UpdateSearchGovernanceAlias;
  const payloadData: any = {
    termId: aliasForm.value.termId,
    alias,
    matchMode: aliasForm.value.matchMode,
    status: aliasForm.value.status,
    note: aliasForm.value.note.trim(),
  };

  if (!isCreatingAlias.value) {
    payloadData.id = selectedAlias.value.id;
  }

  action.call($WebAPI, userStore.token, payloadData, (res: any) => {
    isSavingAlias.value = false;
    const payload = res?.data?.result;
    if (!payload || payload.errCode != 0 || !payload.result) {
      $Message?.({ type: "error", message: payload?.errMsg || "別名儲存失敗。" });
      return;
    }

    const updatedAlias = payload.result as SearchAliasItem;
    const targetIndex = searchAliases.value.findIndex((item) => item.id === updatedAlias.id);
    if (targetIndex >= 0) {
      searchAliases.value[targetIndex] = updatedAlias;
    } else {
      searchAliases.value.unshift(updatedAlias);
    }

    isCreatingAlias.value = false;
    selectedAlias.value = updatedAlias;
    isAliasDialogOpen.value = false;
    resetAliasForm();
    $Message?.({ type: "success", message: targetIndex >= 0 ? "別名已更新。" : "別名已建立。" });
  });
}

watch(
  selectedAlias,
  (alias) => {
    aliasForm.value = createAliasForm(alias);
  },
  { immediate: true }
);

onMounted(() => {
  loadTerms();
  loadAliases();
});
</script>

<style scoped>
.section-head,
.queue-banner,
.alias-head,
.detail-actions {
  display: flex;
}

.section-head,
.queue-banner,
.alias-head {
  justify-content: space-between;
  align-items: center;
}

.section-head h3,
.section-head p,
.queue-banner p,
.mapping-preview h4,
.alias-normalized {
  margin: 0;
}

.section-head p,
.queue-banner p,
.alias-normalized,
.detail-item span,
.editor-item label {
  color: #6b7280;
}

.alias-grid {
  margin-top: 16px;
}

.queue-banner {
  margin-bottom: 18px;
  padding: 16px 18px;
  border-radius: 16px;
  background: linear-gradient(135deg, #fff7ed 0%, #eff6ff 100%);
}

.alias-head {
  gap: 12px;
}

.alias-dialog-body {
  display: grid;
  gap: 22px;
}

.detail-list,
.editor-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.editor-grid {
  gap: 14px;
}

.detail-item {
  padding: 14px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
}

.detail-item strong {
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

.display-term-native-input,
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

.display-term-native-input:focus,
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

.mapping-preview {
  padding-top: 18px;
  border-top: 1px solid #e5e7eb;
}

.mapping-preview ul {
  margin: 10px 0 0;
  padding-left: 18px;
  color: #4b5563;
}

.detail-actions {
  gap: 12px;
  justify-content: flex-end;
}

@media (max-width: 1100px) {
  .detail-list,
  .editor-grid {
    grid-template-columns: 1fr;
  }
}
</style>
