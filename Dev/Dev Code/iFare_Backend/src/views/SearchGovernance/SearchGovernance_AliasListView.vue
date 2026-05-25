<template>
  <main-header>
    <template #btnsRight>
      <el-button plain @click="startCreateAlias">新增別名</el-button>
      <el-button type="primary" @click="router.push({ name: 'SearchGovernance_Dashboard' })">
        返回總覽
      </el-button>
    </template>
  </main-header>
  <el-scrollbar class="main-scrollbar">
    <section class="section-main-card card-fullsize">
      <div class="card-info section-head">
        <div>
          <h3>別名管理</h3>
          <p>將使用者語言對應到標準搜尋詞與政策名稱。</p>
        </div>
        <el-tag type="success" effect="plain">即時 API 流程</el-tag>
      </div>
    </section>

    <section class="alias-grid">
      <article class="section-main-card card-fullsize">
        <div class="card-info">
          <div class="queue-banner">
            <div>
              <strong>建議下一步</strong>
              <p>{{ recommendedAction }}</p>
            </div>
            <el-button plain @click="searchAliases[0] && selectAlias(searchAliases[0])">編輯範例</el-button>
          </div>

          <el-table :data="searchAliases" stripe style="width: 100%">
            <el-table-column prop="alias" label="別名" min-width="140" />
            <el-table-column prop="targetTerm" label="目標詞" min-width="140" />
            <el-table-column label="目標類型" width="100">
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
            <el-table-column label="來源" width="100">
              <template #default="{ row }">
                {{ getSourceKindLabel(row.source) }}
              </template>
            </el-table-column>
            <el-table-column prop="updatedBy" label="更新者" width="120" />
            <el-table-column prop="lastUpdated" label="更新時間" width="160" />
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
          <p class="alias-normalized">{{ isCreatingAlias ? "建立新的別名對應。" : selectedAlias.normalizedAlias }}</p>
        </div>
        <el-tag :type="selectedAlias.status === 'active' ? 'success' : 'info'">
          {{ isCreatingAlias ? "草稿" : getStatusLabel(selectedAlias.status) }}
        </el-tag>
      </div>

      <div class="detail-list">
        <div class="detail-item">
          <span>目標類型</span>
          <strong>{{ isCreatingAlias ? "待選擇目標詞" : getTermTypeLabel(selectedAlias.targetType) }}</strong>
        </div>
        <div class="detail-item">
          <span>來源</span>
          <strong>{{ isCreatingAlias ? "人工建立" : getSourceKindLabel(selectedAlias.source) }}</strong>
        </div>
        <div class="detail-item">
          <span>更新者</span>
          <strong>{{ isCreatingAlias ? "目前使用者" : selectedAlias.updatedBy }}</strong>
        </div>
        <div class="detail-item">
          <span>最後更新</span>
          <strong>{{ isCreatingAlias ? "待建立" : selectedAlias.lastUpdated }}</strong>
        </div>
      </div>

      <div class="editor-grid">
        <div class="editor-item">
          <label>別名</label>
          <el-input v-model="aliasForm.alias" placeholder="使用者輸入的別名" />
        </div>
        <div class="editor-item">
          <label>目標詞</label>
          <el-select v-model="aliasForm.termId" placeholder="選擇標準搜尋詞" filterable>
            <el-option
              v-for="term in searchTerms"
              :key="term.id"
              :label="term.displayTerm"
              :value="term.id"
            />
          </el-select>
        </div>
        <div class="editor-item">
          <label>匹配模式</label>
          <el-select v-model="aliasForm.matchMode" placeholder="選擇匹配模式">
            <el-option label="完全相同" value="exact" />
            <el-option label="同義詞" value="synonym" />
            <el-option label="包含" value="contains" />
            <el-option label="前綴" value="prefix" />
          </el-select>
        </div>
        <div class="editor-item">
          <label>狀態</label>
          <el-select v-model="aliasForm.status" placeholder="選擇狀態">
            <el-option label="啟用" value="active" />
            <el-option label="停用" value="inactive" />
          </el-select>
        </div>
      </div>

      <div class="mapping-preview">
        <h4>建立原因</h4>
        <el-input
          v-model="aliasForm.note"
          type="textarea"
          :rows="4"
          resize="none"
          placeholder="說明這個別名的意圖對應或上線備註。"
        />
      </div>

      <div class="mapping-preview">
        <h4>建議檢查項目</h4>
        <ul>
          <li>先檢查這個別名是否來自零結果查詢或高點擊政策名稱。</li>
          <li>同一個搜尋意圖群組只保留一個主要目標詞。</li>
          <li>啟用後再確認建議詞與排序是否符合預期。</li>
        </ul>
      </div>
    </div>
    <template #footer>
      <div class="detail-actions">
        <el-button plain @click="resetAliasForm" :disabled="isSavingAlias">重設</el-button>
        <el-button plain @click="closeAliasDialog" :disabled="isSavingAlias">{{ isCreatingAlias ? "取消" : "關閉" }}</el-button>
        <el-button type="primary" @click="saveAlias" :loading="isSavingAlias">{{ isCreatingAlias ? "建立別名" : "儲存變更" }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, ref, watch } from "vue";
import { ElButton, ElDialog, ElInput, ElOption, ElScrollbar, ElSelect, ElTable, ElTableColumn, ElTag } from "element-plus";
import { useRoute, useRouter } from "vue-router";
import MainHeader from "@/components/MainHeader.vue";
import type { SearchAliasItem, SearchTermItem } from "@/data/SearchGovernance";
import { useUserStore } from "@/stores/user";

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
const aliasForm = ref(createAliasForm(selectedAlias.value));

const recommendedAction = computed(() => {
  if (route.query.term) {
    return `請檢查與「${String(route.query.term)}」相關的別名，判斷是否需要擴充成更完整的意圖對應。`;
  }

  return "建議先從零結果查詢與高頻口語詞開始，逐一對應到單一標準搜尋詞。";
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

function getMatchModeLabel(matchMode: string) {
  const labels: Record<string, string> = {
    exact: "完全相同",
    synonym: "同義詞",
    contains: "包含",
    prefix: "前綴",
  };
  return labels[matchMode] || matchMode;
}

function createAliasForm(alias: SearchAliasItem | null) {
  return {
    alias: alias?.alias || "",
    termId: Number(alias?.termId || 0),
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
  isCreatingAlias.value = true;
  selectedAlias.value = {
    id: 0,
    termId: searchTerms.value[0]?.id || 0,
    alias: "",
    normalizedAlias: "",
    targetTerm: "",
    targetType: "",
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
  if (isCreatingAlias.value) {
    isCreatingAlias.value = false;
    selectedAlias.value = searchAliases.value[0] || null;
  }
}

function resetAliasForm() {
  aliasForm.value = createAliasForm(selectedAlias.value);
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
    $Message?.({ type: "error", message: "搜尋治理 API 目前不可用。" });
    return;
  }

  const alias = aliasForm.value.alias.trim();
  if (!alias) {
    $Message?.({ type: "warning", message: "請輸入別名。" });
    return;
  }
  if (!aliasForm.value.termId) {
    $Message?.({ type: "warning", message: "請選擇目標搜尋詞。" });
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

  action.call(
    $WebAPI,
    userStore.token,
    payloadData,
    (res: any) => {
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
    }
  );
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

.editor-item :deep(.el-select) {
  width: 100%;
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
