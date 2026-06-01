<template>
  <main-header />

  <el-scrollbar class="main-scrollbar">
    <section class="section-main-card card-fullsize">
      <div class="card-info governance-hero">
        <div class="hero-copy-wrap">
          <p class="eyebrow">搜尋治理 Dashboard</p>
          <h2>iFare 搜尋治理總覽</h2>
          <p class="hero-copy">
            從近 7 天與近 30 天的搜尋資料，快速找出零結果、高頻低結果與需要優先治理的搜尋詞。
          </p>
        </div>
        <div class="hero-actions">
          <el-button type="primary" @click="router.push({ name: 'SearchGovernance_Terms' })">
            前往搜尋詞
          </el-button>
          <el-button plain @click="router.push({ name: 'SearchGovernance_Aliases' })">
            前往別名
          </el-button>
          <el-button plain @click="refreshHotStats" :loading="isRefreshingHotStats">
            重算熱度統計
          </el-button>
          <el-button plain @click="syncTerms" :loading="isSyncingTerms">
            同步搜尋詞詞庫
          </el-button>
        </div>
      </div>
    </section>

    <section v-if="searchOverviewStats.length" class="stats-grid">
      <article v-for="item in searchOverviewStats" :key="item.key" class="section-main-card stat-card">
        <div class="card-info">
          <span class="stat-label">{{ item.label }}</span>
          <strong class="stat-value">{{ item.value }}</strong>
          <span class="stat-delta" :class="`tone-${item.tone}`">{{ item.delta }}</span>
        </div>
      </article>
    </section>

    <section v-else class="section-main-card card-fullsize empty-card">
      <div class="card-info">
        <h3>目前沒有搜尋治理統計資料</h3>
        <p>請確認後台 API 是否正常，或先執行熱度統計重算與搜尋詞同步。</p>
      </div>
    </section>

    <section v-if="searchTrend.length" class="section-main-card card-fullsize">
      <div class="card-info">
        <div class="section-head">
          <div>
            <h3>近 7 日搜尋趨勢</h3>
            <p>觀察近 7 天搜尋量變化。</p>
          </div>
        </div>
        <div class="trend-row">
          <div v-for="point in searchTrend" :key="point.label" class="trend-item">
            <div class="trend-bar-wrap">
              <div class="trend-bar" :style="{ height: `${Math.max(12, point.value)}%` }"></div>
            </div>
            <strong>{{ point.value }}</strong>
            <span>{{ point.label }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="queue-stack">
      <article class="section-main-card card-fullsize">
        <div class="card-info">
          <div class="section-head">
            <div>
              <h3>零結果搜尋待治理</h3>
              <p>近 7 天完全查不到結果的查詢，優先補別名與搜尋詞。</p>
            </div>
            <el-tag type="danger" effect="plain">{{ zeroResultQueue.length }} 筆</el-tag>
          </div>
          <el-table :data="zeroResultQueue" stripe style="width: 100%">
            <el-table-column prop="query" label="搜尋詞" min-width="180" />
            <el-table-column prop="searches7d" label="7日搜尋數" width="120" />
            <el-table-column prop="resultCount" label="結果數" width="90" />
            <el-table-column label="狀態" width="110">
              <template #default="{ row }">
                <el-tag :type="queueTagType(row.status)" size="small">{{ getQueueStatusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="owner" label="處理者" width="120" />
            <el-table-column prop="suggestion" label="建議動作" min-width="220" />
            <el-table-column label="操作" width="170" fixed="right">
              <template #default="{ row }">
                <div class="table-actions">
                  <el-button link type="primary" @click="openAliases(row)">前往別名</el-button>
                  <el-button link @click="openTerms()">前往搜尋詞</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!zeroResultQueue.length" description="目前沒有零結果搜尋待治理。" />
        </div>
      </article>

      <article class="section-main-card card-fullsize">
        <div class="card-info">
          <div class="section-head">
            <div>
              <h3>低結果搜尋待治理</h3>
              <p>有結果但結果偏少的搜尋，適合補別名與調整治理規則。</p>
            </div>
            <el-tag type="warning" effect="plain">{{ lowResultQueue.length }} 筆</el-tag>
          </div>
          <el-table :data="lowResultQueue" stripe style="width: 100%">
            <el-table-column prop="query" label="搜尋詞" min-width="180" />
            <el-table-column prop="searches7d" label="7日搜尋數" width="120" />
            <el-table-column prop="resultCount" label="結果數" width="90" />
            <el-table-column label="狀態" width="110">
              <template #default="{ row }">
                <el-tag :type="queueTagType(row.status)" size="small">{{ getQueueStatusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="suggestion" label="建議動作" min-width="220" />
            <el-table-column label="操作" width="170" fixed="right">
              <template #default="{ row }">
                <div class="table-actions">
                  <el-button link type="primary" @click="openTerms()">前往搜尋詞</el-button>
                  <el-button link @click="openAliases(row)">前往別名</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!lowResultQueue.length" description="目前沒有低結果搜尋待治理。" />
        </div>
      </article>

      <article class="section-main-card card-fullsize">
        <div class="card-info">
          <div class="section-head">
            <div>
              <h3>重點治理搜尋詞</h3>
              <p>先合併同名搜尋詞的熱度與搜尋數，再依 7 日熱度優先排序，避免不同來源重複出現。</p>
            </div>
            <el-tag type="success" effect="plain">{{ rankedTopTerms.length }} 筆</el-tag>
          </div>
          <div v-if="rankedTopTerms.length" class="term-list">
            <button
              v-for="term in rankedTopTerms"
              :key="term.key"
              type="button"
              class="term-list-item"
              @click="openTerms(term.primaryItem?.id)"
            >
              <div>
                <strong>{{ term.displayTerm }}</strong>
                <p>{{ term.note }}</p>
              </div>
              <div class="term-meta">
                <span>{{ term.aggregateHotScore7d }} 7日熱度</span>
                <span>{{ term.aggregateSearchCount30d }} 次搜尋</span>
                <el-tag size="small" :type="term.primaryItem?.status === 'active' ? 'success' : 'info'">
                  {{ getStatusLabel(term.primaryItem?.status || "") }}
                </el-tag>
              </div>
            </button>
          </div>
          <el-empty v-else description="目前沒有可顯示的重點治理搜尋詞。" />
        </div>
      </article>
    </section>
  </el-scrollbar>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, ref } from "vue";
import { ElButton, ElEmpty, ElScrollbar, ElTable, ElTableColumn, ElTag } from "element-plus";
import { useRouter } from "vue-router";
import MainHeader from "@/components/MainHeader.vue";
import type { SearchOverviewStat, SearchQueueItem, SearchTermItem, SearchTrendPoint } from "@/data/SearchGovernance";
import { useUserStore } from "@/stores/user";

interface DashboardTopTermGroup {
  key: string;
  displayTerm: string;
  aggregateHotScore7d: number;
  aggregateSearchCount30d: number;
  note: string;
  primaryItem: SearchTermItem | null;
  items: SearchTermItem[];
}

const router = useRouter();
const userStore = useUserStore();
const app = getCurrentInstance();
const $WebAPI = app?.appContext.config.globalProperties.$WebAPI;
const $Message = app?.appContext.config.globalProperties.$message;

const searchOverviewStats = ref<SearchOverviewStat[]>([]);
const searchTrend = ref<SearchTrendPoint[]>([]);
const searchQueue = ref<SearchQueueItem[]>([]);
const topTerms = ref<SearchTermItem[]>([]);
const isRefreshingHotStats = ref(false);
const isSyncingTerms = ref(false);

const zeroResultQueue = computed(() => searchQueue.value.filter((item) => item.resultCount === 0));
const lowResultQueue = computed(() => searchQueue.value.filter((item) => item.resultCount > 0));

const rankedTopTerms = computed<DashboardTopTermGroup[]>(() => {
  const groupMap = new Map<string, SearchTermItem[]>();

  topTerms.value.forEach((item) => {
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
        if (Number(b.hotScore7d || 0) !== Number(a.hotScore7d || 0)) {
          return Number(b.hotScore7d || 0) - Number(a.hotScore7d || 0);
        }
        if (Number(b.searchCount30d || 0) !== Number(a.searchCount30d || 0)) {
          return Number(b.searchCount30d || 0) - Number(a.searchCount30d || 0);
        }
        return a.id - b.id;
      });

      return {
        key,
        displayTerm: sortedItems[0]?.displayTerm || "",
        aggregateHotScore7d: sortedItems.reduce((sum, item) => sum + Number(item.hotScore7d || 0), 0),
        aggregateSearchCount30d: sortedItems.reduce((sum, item) => sum + Number(item.searchCount30d || 0), 0),
        note: sortedItems[0]?.note || "",
        primaryItem: sortedItems[0] || null,
        items: sortedItems,
      };
    })
    .sort((a, b) => {
      if ((a.primaryItem?.status || "") !== (b.primaryItem?.status || "")) {
        return a.primaryItem?.status === "active" ? -1 : 1;
      }
      if (Number(b.aggregateHotScore7d || 0) !== Number(a.aggregateHotScore7d || 0)) {
        return Number(b.aggregateHotScore7d || 0) - Number(a.aggregateHotScore7d || 0);
      }
      if (Number(b.aggregateSearchCount30d || 0) !== Number(a.aggregateSearchCount30d || 0)) {
        return Number(b.aggregateSearchCount30d || 0) - Number(a.aggregateSearchCount30d || 0);
      }
      return a.displayTerm.localeCompare(b.displayTerm, "zh-Hant");
    });
});

function queueTagType(status: string) {
  if (status === "resolved") return "success";
  if (status === "reviewing") return "warning";
  return "danger";
}

function getQueueStatusLabel(status: string) {
  if (status === "resolved") return "已處理";
  if (status === "reviewing") return "處理中";
  if (status === "pending") return "待處理";
  return status;
}

function getStatusLabel(status: string) {
  if (status === "active") return "啟用";
  if (status === "inactive") return "停用";
  return status;
}

function openTerms(focusId?: number) {
  router.push({
    name: "SearchGovernance_Terms",
    query: focusId ? { focus: focusId } : undefined,
  });
}

function openAliases(item: SearchQueueItem) {
  router.push({
    name: "SearchGovernance_Aliases",
    query: { term: item.query },
  });
}

function refreshHotStats() {
  if (!$WebAPI || !userStore.token || isRefreshingHotStats.value) return;

  isRefreshingHotStats.value = true;
  $WebAPI.RefreshSearchGovernanceHotStats(userStore.token, { windowDays: 30 }, (res: any) => {
    isRefreshingHotStats.value = false;
    const payload = res?.data?.result;
    if (!payload || payload.errCode != 0 || !payload.result) {
      $Message?.({ type: "error", message: payload?.errMsg || "重算熱度統計失敗。" });
      return;
    }

    const result = payload.result;
    $Message?.({
      type: "success",
      message: `已完成 ${result.startDate} 到 ${result.endDate} 的熱度重算，共更新 ${result.rowCount} 筆。`,
    });
    loadDashboard();
  });
}

function syncTerms() {
  if (!$WebAPI || !userStore.token || isSyncingTerms.value) return;

  isSyncingTerms.value = true;
  $WebAPI.SyncSearchGovernanceTerms(userStore.token, { pruneMissing: false }, (res: any) => {
    isSyncingTerms.value = false;
    const payload = res?.data?.result;
    if (!payload || payload.errCode != 0 || !payload.result) {
      $Message?.({ type: "error", message: payload?.errMsg || "同步搜尋詞詞庫失敗。" });
      return;
    }

    const result = payload.result;
    $Message?.({
      type: "success",
      message: `已同步 ${result.finalTermCount} 筆搜尋詞（來源 ${result.sourceTermCount} 筆）。`,
    });
    loadDashboard();
  });
}

function loadDashboard() {
  if (!$WebAPI || !userStore.token) return;

  $WebAPI.GetSearchGovernanceDashboard(userStore.token, (res: any) => {
    const payload = res?.data?.result;
    if (!payload || payload.errCode != 0 || !payload.result) {
      return;
    }

    searchOverviewStats.value = Array.isArray(payload.result.overviewStats) ? payload.result.overviewStats : [];
    searchTrend.value = Array.isArray(payload.result.trendPoints) ? payload.result.trendPoints : [];
    searchQueue.value = Array.isArray(payload.result.queueItems) ? payload.result.queueItems : [];
    topTerms.value = Array.isArray(payload.result.topTerms) ? payload.result.topTerms : [];
  });
}

onMounted(() => {
  loadDashboard();
});
</script>

<style scoped>
.governance-hero,
.section-head,
.hero-actions,
.stats-grid,
.trend-row,
.term-meta,
.table-actions {
  display: flex;
}

.governance-hero,
.section-head {
  justify-content: space-between;
  gap: 24px;
}

.governance-hero {
  align-items: flex-start;
  padding: 4px 0;
}

.hero-copy-wrap {
  min-width: 0;
}

.eyebrow {
  margin: 0 0 8px;
  color: #6b7280;
  font-size: 12px;
  letter-spacing: 0.08em;
}

h2,
h3,
.hero-copy,
.section-head p,
.term-list-item p {
  margin: 0;
}

h2 {
  font-size: 30px;
  line-height: 1.15;
}

.hero-copy {
  max-width: 720px;
  margin-top: 12px;
  color: #4b5563;
  line-height: 1.7;
}

.hero-actions {
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 12px;
}

.stats-grid {
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.stat-card {
  flex: 1 1 220px;
}

.stat-label {
  display: block;
  color: #6b7280;
  font-size: 13px;
}

.stat-value {
  display: block;
  margin: 10px 0 8px;
  font-size: 30px;
  line-height: 1;
}

.stat-delta {
  font-size: 13px;
  font-weight: 600;
}

.tone-success {
  color: #059669;
}

.tone-warning {
  color: #d97706;
}

.tone-danger {
  color: #dc2626;
}

.tone-default {
  color: #6b7280;
}

.empty-card h3 {
  font-size: 20px;
}

.empty-card p {
  margin-top: 8px;
  color: #6b7280;
}

.trend-row {
  gap: 16px;
  margin-top: 18px;
  align-items: flex-end;
}

.trend-item {
  min-width: 70px;
  text-align: center;
}

.trend-bar-wrap {
  height: 140px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.trend-bar {
  width: 28px;
  min-height: 12px;
  border-radius: 999px 999px 10px 10px;
  background: linear-gradient(180deg, #38bdf8 0%, #0f766e 100%);
}

.trend-item strong,
.trend-item span {
  display: block;
}

.trend-item strong {
  margin-top: 10px;
}

.trend-item span {
  margin-top: 6px;
  color: #6b7280;
  font-size: 12px;
  white-space: pre-line;
}

.queue-stack {
  display: grid;
  gap: 20px;
}

.section-head {
  margin-bottom: 16px;
  align-items: flex-start;
}

.section-head p {
  margin-top: 6px;
  color: #6b7280;
  line-height: 1.6;
}

.table-actions {
  gap: 10px;
  align-items: center;
}

.term-list {
  display: grid;
  gap: 12px;
}

.term-list-item {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 16px 18px;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: #fff;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.term-list-item:hover {
  border-color: #99f6e4;
  box-shadow: 0 16px 32px rgba(15, 118, 110, 0.08);
  transform: translateY(-1px);
}

.term-list-item p {
  margin-top: 6px;
  color: #6b7280;
}

.term-meta {
  align-items: center;
  gap: 12px;
  color: #4b5563;
  white-space: nowrap;
}

@media (max-width: 1100px) {
  .governance-hero,
  .section-head {
    flex-direction: column;
  }

  .hero-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .trend-row {
    flex-wrap: wrap;
  }

  .trend-item {
    min-width: 58px;
  }

  .term-list-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .term-meta {
    white-space: normal;
    flex-wrap: wrap;
  }
}
</style>
