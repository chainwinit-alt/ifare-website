<template>
  <main-header>
    <template #btnsRight>
      <el-button
        :icon="VideoPlay"
        size="large"
        type="primary"
        :loading="isBusy"
        @click="runReportFromRunner"
      >
        重新產生報告
      </el-button>
      <el-button :icon="Refresh" size="large" :loading="isLoading" @click="loadReport">
        重新整理
      </el-button>
    </template>
  </main-header>

  <el-scrollbar class="main-scrollbar">
    <div class="agent-layout">
      <section class="section-main-card card-fullsize">
        <div class="card-info agent-hero">
          <div>
            <span class="agent-kicker">AI 維護中心</span>
            <h2>今日專案狀態</h2>
            <p>資料來源：agent CLI 產出的 read-only 報告，不會寫回 Excel、不會改程式、不會部署。</p>
          </div>
          <div class="agent-status">
            <el-tag :type="loadError ? 'danger' : 'success'" size="large">
              {{ loadError ? '資料未載入' : 'read-only' }}
            </el-tag>
            <el-tag :type="runnerReady ? 'success' : 'info'" size="large">
              {{ runnerReady ? 'runner 已連線' : 'runner 未啟動' }}
            </el-tag>
            <el-switch
              v-model="autoRefreshEnabled"
              inline-prompt
              size="large"
              active-text="自動刷新"
              inactive-text="手動"
            />
            <span>{{ report?.generatedAt || '尚無資料' }}</span>
            <small>{{ autoRefreshLabel }}</small>
            <small>最後成功：{{ lastSuccessLabel }}</small>
            <el-button text size="small" @click="showGuideCard = true">
              查看使用指引
            </el-button>
          </div>
        </div>
      </section>

      <el-alert
        v-if="loadError"
        class="agent-alert"
        type="warning"
        :closable="false"
        show-icon
        :title="loadError"
      />

      <el-alert
        v-if="runnerError"
        class="agent-alert"
        type="info"
        :closable="false"
        show-icon
        :title="runnerError"
      />

      <section v-if="showGuideCard" class="section-main-card card-fullsize">
        <div class="card-info guide-card">
          <div class="guide-head">
            <div>
              <span class="guide-kicker">第一次使用</span>
              <h3>先看這裡，再開始用 AI 維護中心</h3>
              <p>這裡只讀資料與產報告，不會直接改 Excel 或程式。先看狀態，再按按鈕。</p>
            </div>
            <el-button :icon="Refresh" plain @click="hideGuide">
              我知道了
            </el-button>
          </div>

          <div class="guide-steps">
            <div class="guide-step">
              <span>1</span>
              <strong>先看上方狀態</strong>
              <p>確認 runner 是否連線、報告時間是否太舊、自動刷新是否開啟。</p>
            </div>
            <div class="guide-step">
              <span>2</span>
              <strong>再選一個動作</strong>
              <p>最常用的是「重新產生報告」，或直接按快速任務的白名單按鈕。</p>
            </div>
            <div class="guide-step">
              <span>3</span>
              <strong>看結果與產出位置</strong>
              <p>成功後會顯示執行結果，Word / Markdown 會出現在桌面報告資料夾。</p>
            </div>
          </div>

          <div class="guide-actions">
            <span>產出路徑：`C:\\Users\\emma.chung\\Desktop\\iFare-AI-Maintenance-Reports`</span>
            <el-button type="primary" plain @click="hideGuide">下次不再顯示</el-button>
          </div>
        </div>
      </section>

      <section class="section-main-card card-fullsize">
        <div class="card-info agent-panel run-panel" :class="`run-panel--${lastRun.status}`">
          <div class="panel-head">
            <h3>執行結果</h3>
            <p>按「重新產生報告」後，這裡會顯示是否成功、耗時、產出位置與終端輸出。</p>
          </div>

          <div class="run-summary">
            <el-tag :type="lastRunTagType" size="large">{{ lastRunLabel }}</el-tag>
            <strong>{{ lastRun.message }}</strong>
            <span v-if="lastRun.time">{{ lastRun.time }}</span>
            <span v-if="lastRun.durationMs">{{ lastRun.durationMs }}ms</span>
          </div>

          <div class="output-grid">
            <div v-for="item in outputLocations" :key="item.path" class="output-item">
              <span>{{ item.label }}</span>
              <code>{{ item.path }}</code>
            </div>
          </div>

          <div v-if="lastRun.stdoutTail || lastRun.stderrTail" class="run-log">
            <div v-if="lastRun.stdoutTail">
              <span>stdout</span>
              <pre>{{ lastRun.stdoutTail }}</pre>
            </div>
            <div v-if="lastRun.stderrTail">
              <span>stderr</span>
              <pre>{{ lastRun.stderrTail }}</pre>
            </div>
          </div>
        </div>
      </section>

      <section class="agent-grid">
        <div class="section-main-card card-fullsize">
          <div class="card-info agent-panel">
            <div class="panel-head">
              <h3>快速任務</h3>
              <p>一鍵執行常用白名單任務，不用再手動輸入句子。</p>
            </div>

            <div class="task-grid">
              <button
                v-for="task in quickTasks"
                :key="task.key"
                type="button"
                class="task-item"
                :class="`task-item--${task.key}`"
                @click="runQuickTask(task)"
              >
                <strong>{{ task.label }}</strong>
                <code>{{ task.command }}</code>
                <small>{{ task.description }}</small>
              </button>
            </div>
          </div>
        </div>

        <div class="section-main-card card-fullsize">
          <div class="card-info agent-panel">
            <div class="panel-head">
              <h3>資料新鮮度</h3>
              <p>這裡顯示報告最後更新時間、相對時間與是否過期。</p>
            </div>

            <div class="freshness-grid">
              <div class="freshness-item">
                <span>報告時間</span>
                <strong>{{ report?.generatedAt || '尚無資料' }}</strong>
              </div>
              <div class="freshness-item">
                <span>距今</span>
                <strong>{{ reportAgeLabel }}</strong>
              </div>
              <div class="freshness-item">
                <span>狀態</span>
                <strong>{{ reportFreshnessLabel }}</strong>
              </div>
              <div class="freshness-item">
                <span>自動刷新</span>
                <strong>{{ autoRefreshEnabled ? '開啟' : '關閉' }}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="agent-metrics">
        <div class="section-main-card metric-card" v-for="item in metrics" :key="item.label">
          <div class="card-info metric-card__inner">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
            <small>{{ item.caption }}</small>
          </div>
        </div>
      </section>

      <section class="agent-grid">
        <div class="section-main-card card-fullsize">
          <div class="card-info agent-panel">
            <div class="panel-head">
              <h3>高優先待辦</h3>
              <p>先列後臺優化與 PoC 高優先項目，方便每天快速收斂。</p>
            </div>

            <div class="pending-table">
              <div class="pending-row pending-row--head">
                <span>#</span>
                <span>區塊</span>
                <span>標題</span>
              </div>
              <div
                v-for="item in highPending"
                :key="`${item.source}-${item.id}`"
                class="pending-row"
              >
                <strong>{{ item.id }}</strong>
                <span>{{ item.source }} / {{ item.area }}</span>
                <span>{{ item.title }}</span>
              </div>
              <div v-if="highPending.length === 0" class="empty-state">
                目前沒有高優先待辦資料。
              </div>
            </div>
          </div>
        </div>

        <div class="section-main-card card-fullsize">
          <div class="card-info agent-panel">
            <div class="panel-head">
              <h3>跟 AI 說要做什麼</h3>
              <p>輸入任務後會由本機 runner 判斷意圖，只執行白名單內的維護動作。</p>
            </div>

            <el-input
              v-model="agentRequest"
              type="textarea"
              :rows="4"
              resize="none"
              placeholder="例如：幫我產生今天的維護報告"
            />

            <div class="intent-result">
              <span>建議動作</span>
              <strong>{{ matchedCommand.label }}</strong>
              <code>{{ matchedCommand.command }}</code>
              <p>{{ matchedCommand.description }}</p>
              <div class="intent-actions">
                <el-button
                  type="primary"
                  :loading="isIntakingTask"
                  @click="intakeFromInput"
                >
                  整理成任務
                </el-button>
                <el-button
                  :icon="VideoPlay"
                  :loading="isRunningTask"
                  @click="runAgentRequest"
                >
                  直接執行（不留任務卡）
                </el-button>
                <el-button :icon="CopyDocument" plain @click="copyCommand(matchedCommand.command)">
                  複製指令
                </el-button>
              </div>
              <p class="intent-hint">
                建議用「整理成任務」：agent 會先把句子分類成任務卡並等核准，可在下方收件匣追蹤。
              </p>
            </div>
          </div>
        </div>
      </section>

      <TaskInbox
        :tasks="tasks"
        :counts="taskCounts"
        :loading="isLoadingTasks"
        :syncing="isSyncingExcel"
        :runner-ready="runnerReady"
        @view="openTaskDetail"
        @approve="approveTask"
        @run="runTask"
        @block="blockTaskFromInbox"
        @refresh="loadTasks"
        @refresh-from-excel="refreshFromExcel"
      />

      <TaskDetailDrawer
        v-model="drawerVisible"
        :task="selectedTask"
        :runner-ready="runnerReady"
        :approving="taskBusy.approving"
        :running="taskBusy.running"
        :patching="taskBusy.patching"
        @approve="approveTask"
        @run="runTask"
        @block="blockTaskWithNote"
        @patch="patchTask"
      />

      <section class="section-main-card card-fullsize">
        <div class="card-info agent-panel">
            <div class="panel-head">
              <h3>Agent 指令</h3>
              <p>啟動 `npm run agent:runner` 後可在本頁一鍵重產；未啟動時仍可複製指令到專案根目錄執行。</p>
            </div>

          <div class="command-grid">
            <button
              v-for="command in suggestedCommands"
              :key="command.command"
              type="button"
              class="command-item"
              @click="copyCommand(command.command)"
            >
              <span>{{ command.label }}</span>
              <code>{{ command.command }}</code>
              <small>{{ command.description }}</small>
            </button>
          </div>
        </div>
      </section>

      <section class="section-main-card card-fullsize">
        <div class="card-info agent-panel">
          <div class="panel-head">
            <h3>最近操作紀錄</h3>
            <p>記錄 agent 指令執行結果，後續開放寫入 Excel 前會以這裡作為 audit log 基礎。</p>
          </div>

          <div class="audit-toolbar">
            <el-input
              v-model="auditSearch"
              clearable
              placeholder="搜尋 action / command / actor"
            />
            <el-select v-model="auditStatusFilter" placeholder="狀態篩選" style="width: 160px">
              <el-option label="全部" value="all" />
              <el-option label="成功" value="success" />
              <el-option label="失敗" value="failed" />
              <el-option label="執行中" value="running" />
            </el-select>
          </div>

          <div class="audit-list">
            <div v-for="entry in filteredAuditEntries" :key="entry.id" class="audit-row">
              <el-tag :type="entry.status === 'success' ? 'success' : entry.status === 'failed' ? 'danger' : 'info'">
                {{ entry.status }}
              </el-tag>
              <div>
                <strong>{{ entry.action }}</strong>
                <span>{{ entry.timestamp }} / {{ entry.actor || '-' }}</span>
                <code>{{ entry.command || '-' }}</code>
              </div>
              <small v-if="entry.durationMs">{{ entry.durationMs }}ms</small>
            </div>
            <div v-if="filteredAuditEntries.length === 0" class="empty-state">
              尚無操作紀錄。可先執行 `npm run agent:report` 或啟動 runner 後按「重新產生報告」。
            </div>
          </div>
        </div>
      </section>

      <section class="agent-grid">
        <div class="section-main-card card-fullsize">
          <div class="card-info agent-panel">
            <div class="panel-head">
              <h3>Excel 摘要</h3>
              <p>{{ report?.xlsx.trackingFile || '尚未載入追蹤檔資訊' }}</p>
            </div>

            <div class="sheet-list">
              <div v-for="sheet in report?.xlsx.summary || []" :key="sheet.name" class="sheet-item">
                <div>
                  <strong>{{ sheet.name }}</strong>
                  <span>待處理 {{ sheet.pending }} / 總計 {{ sheet.total }}</span>
                </div>
                <el-progress
                  :percentage="completionRate(sheet)"
                  :stroke-width="10"
                  :show-text="false"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="section-main-card card-fullsize">
          <div class="card-info agent-panel">
            <div class="panel-head">
              <h3>安全邊界</h3>
              <p>目前版本只允許讀取與產生報告。</p>
            </div>

            <div class="safety-grid">
              <div>
                <span>允許</span>
                <el-tag
                  v-for="action in report?.safety.allowedActions || []"
                  :key="action"
                  type="success"
                >
                  {{ action }}
                </el-tag>
              </div>
              <div>
                <span>禁止</span>
                <el-tag
                  v-for="action in report?.safety.blockedActions || []"
                  :key="action"
                  type="danger"
                >
                  {{ action }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="section-main-card card-fullsize">
        <div class="card-info agent-panel">
          <div class="panel-head">
            <h3>待決問題</h3>
            <p>這些問題決定是否能進入第二階段：寫回 Excel 與自動巡檢。</p>
          </div>

          <ol class="decision-list">
            <li v-for="item in report?.decisionsNeeded || fallbackDecisions" :key="item">
              {{ item }}
            </li>
          </ol>
        </div>
      </section>
    </div>
  </el-scrollbar>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import {
  ElAlert,
  ElButton,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElProgress,
  ElScrollbar,
  ElSwitch,
  ElSelect,
  ElOption,
  ElTag,
} from 'element-plus';
import { CopyDocument, Refresh, VideoPlay } from '@element-plus/icons-vue';
import MainHeader from '@/components/MainHeader.vue';
import { AGENT_RUNNER_URL } from '@/config/adminEnv';
import TaskInbox from './components/TaskInbox.vue';
import TaskDetailDrawer from './components/TaskDetailDrawer.vue';
import type { AgentTask, TaskCounts } from './components/agentTaskTypes';

interface AgentCommand {
  label: string;
  command: string;
  description: string;
}

interface SheetSummary {
  name: string;
  total: number;
  done: number;
  partial: number;
  pending: number;
}

interface PendingItem {
  id: string;
  area: string;
  sub?: string;
  cat?: string;
  title: string;
}

interface AgentReport {
  generatedAt: string;
  reportDate: string;
  agentVersion: string;
  readOnly: boolean;
  markdownReport?: string | null;
  wordReport?: string | null;
  git: {
    branchName: string;
    commitCount: number;
    changedFileCount: number;
    dirtyCount: number;
  };
  xlsx: {
    trackingFile: string;
    summary: SheetSummary[];
    backendHighPending: PendingItem[];
    pocHighPending: PendingItem[];
  };
  docs: {
    markdownCount: number;
  };
  safety: {
    denySkipCount: number;
    allowedActions: string[];
    blockedActions: string[];
  };
  suggestedCommands: AgentCommand[];
  decisionsNeeded: string[];
}

interface AuditEntry {
  id: string;
  timestamp: string;
  actor?: string;
  action: string;
  command?: string;
  status: 'running' | 'success' | 'failed' | string;
  durationMs?: number;
}

interface RunState {
  status: 'idle' | 'running' | 'success' | 'failed';
  message: string;
  time: string;
  durationMs?: number;
  stdoutTail?: string;
  stderrTail?: string;
}

const report = ref<AgentReport | null>(null);
const isLoading = ref(false);
const isRunningReport = ref(false);
const isRunningTask = ref(false);
const loadError = ref('');
const runnerError = ref('');
const runnerReady = ref(false);
const autoRefreshEnabled = ref(true);
const lastAutoRefreshAt = ref('');
const lastSuccessAt = ref('');
const GUIDE_STORAGE_KEY = 'ifare-admin-agent-guide-dismissed-v1';
const showGuideCard = ref(readGuideVisible());
const reportSignature = ref('');
const auditSignature = ref('');
const auditSearch = ref('');
const auditStatusFilter = ref<'all' | 'success' | 'failed' | 'running'>('all');
const agentRequest = ref('');
const auditEntries = ref<AuditEntry[]>([]);
const tasks = ref<AgentTask[]>([]);
const taskCounts = ref<TaskCounts | null>(null);
const isLoadingTasks = ref(false);
const isSyncingExcel = ref(false);
const isIntakingTask = ref(false);
const drawerVisible = ref(false);
const selectedTaskId = ref<string | null>(null);
const taskBusy = ref<{ approving: boolean; running: boolean; patching: boolean }>({
  approving: false,
  running: false,
  patching: false,
});
const lastRun = ref<RunState>({
  status: 'idle',
  message: '尚未從後台執行報告重產。',
  time: '',
});

let refreshTimer: number | undefined;
const visibilityHandler = () => {
  if (document.visibilityState === 'visible' && autoRefreshEnabled.value) {
    refreshAgentCenter();
  }
};

function readGuideVisible() {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(GUIDE_STORAGE_KEY) !== '1';
}

function hideGuide() {
  showGuideCard.value = false;
  try {
    window.localStorage.setItem(GUIDE_STORAGE_KEY, '1');
  } catch {
    // ignore storage errors
  }
}

const fallbackCommands: AgentCommand[] = [
  {
    label: '重新產生報告',
    command: 'npm run agent:report',
    description: '更新主管用 Word、Markdown 報告與後台 JSON。',
  },
  {
    label: 'Dry-run 預覽',
    command: 'npm run agent:report:dry',
    description: '只預覽，不寫檔。',
  },
  {
    label: '驗收 Agent',
    command: 'npm run agent:verify',
    description: '檢查 MVP CLI 是否可用。',
  },
];

const fallbackDecisions = [
  '報告要每日排程，還是維持手動觸發？',
  '第二階段是否允許人工確認後寫回 Excel？',
  '是否要加入 audit log？',
];

const reportUrl = computed(() => {
  const base = import.meta.env.BASE_URL || '/';
  return `${base.replace(/\/$/, '')}/agent/latest-report.json`;
});

const quickTasks = computed(() => [
  {
    key: 'report',
    label: '重產報告',
    command: 'npm run agent:report',
    description: '產出桌面 Word / Markdown / 後台 JSON。',
    message: '幫我重新產生今天的維護報告',
  },
  {
    key: 'dry',
    label: '預覽報告',
    command: 'npm run agent:report:dry',
    description: '只預覽，不寫檔。',
    message: '幫我做維護報告 dry-run 預覽',
  },
  {
    key: 'verify',
    label: '驗收檢查',
    command: 'npm run agent:verify',
    description: '檢查設定、xlsx、runner 與輸出。',
    message: '幫我驗收 agent',
  },
  {
    key: 'status',
    label: '查詢狀態',
    command: 'GET /audit',
    description: '讀最近執行紀錄與 runner 狀態。',
    message: '幫我查詢最近執行狀態',
  },
]);

const autoRefreshLabel = computed(() => {
  if (!autoRefreshEnabled.value) return '自動刷新已停用';
  return lastAutoRefreshAt.value ? `自動刷新：${lastAutoRefreshAt.value}` : '自動刷新中';
});

const lastSuccessLabel = computed(() => lastSuccessAt.value || '尚未成功刷新');

const reportAgeLabel = computed(() => {
  if (!report.value?.generatedAt) return '尚無資料';
  const raw = report.value.generatedAt.replace(' ', 'T');
  const generated = new Date(raw);
  if (Number.isNaN(generated.getTime())) return '無法判讀';
  const diffMs = Date.now() - generated.getTime();
  if (diffMs < 0) return '剛產生';
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '剛產生';
  if (diffMin < 60) return `${diffMin} 分鐘前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} 小時前`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} 天前`;
});

const reportFreshnessLabel = computed(() => {
  if (!report.value?.generatedAt) return '未知';
  const raw = report.value.generatedAt.replace(' ', 'T');
  const generated = new Date(raw);
  if (Number.isNaN(generated.getTime())) return '未知';
  const ageHours = (Date.now() - generated.getTime()) / 36e5;
  if (ageHours < 2) return '新鮮';
  if (ageHours < 24) return '可用';
  return '可能過期';
});

const suggestedCommands = computed(() => report.value?.suggestedCommands?.length ? report.value.suggestedCommands : fallbackCommands);
const isBusy = computed(() => isRunningReport.value || isRunningTask.value);

const outputLocations = computed(() => {
  const reportDate = report.value?.reportDate || new Date().toISOString().slice(0, 10);
  return [
    {
      label: '主管用 Word 報告',
      path: report.value?.wordReport || `~/Desktop/iFare-AI-Maintenance-Reports/${reportDate}.docx`,
    },
    {
      label: 'Markdown 報告',
      path: report.value?.markdownReport || `~/Desktop/iFare-AI-Maintenance-Reports/${reportDate}.md`,
    },
    {
      label: '後台摘要 JSON',
      path: 'Dev/Dev Code/iFare_Backend/public/agent/latest-report.json',
    },
    {
      label: 'Audit log',
      path: 'docs/ai-agent-reports/_audit.jsonl',
    },
    {
      label: '後台 audit JSON',
      path: 'Dev/Dev Code/iFare_Backend/public/agent/audit-latest.json',
    },
  ];
});

const lastRunLabel = computed(() => {
  if (lastRun.value.status === 'running') return '執行中';
  if (lastRun.value.status === 'success') return '成功';
  if (lastRun.value.status === 'failed') return '失敗';
  return '待執行';
});

const lastRunTagType = computed(() => {
  if (lastRun.value.status === 'success') return 'success';
  if (lastRun.value.status === 'failed') return 'danger';
  if (lastRun.value.status === 'running') return 'warning';
  return 'info';
});

const metrics = computed(() => [
  {
    label: 'Git commits',
    value: report.value?.git.commitCount ?? '-',
    caption: `分支：${report.value?.git.branchName || '-'}`,
  },
  {
    label: '待處理',
    value: totalPending.value,
    caption: 'Excel 三個主要 sheet',
  },
  {
    label: '高優先',
    value: highPending.value.length,
    caption: '後臺優化 + PoC',
  },
  {
    label: 'deny 命中',
    value: report.value?.safety.denySkipCount ?? '-',
    caption: '黑名單路徑略過',
  },
]);

const totalPending = computed(() => {
  const sheets = report.value?.xlsx.summary ?? [];
  return sheets.reduce((sum, sheet) => sum + sheet.pending, 0);
});

const highPending = computed(() => {
  const backend = report.value?.xlsx.backendHighPending ?? [];
  const poc = report.value?.xlsx.pocHighPending ?? [];
  return [
    ...backend.map((item) => ({ ...item, source: '後臺優化' })),
    ...poc.map((item) => ({ ...item, source: 'PoC' })),
  ].slice(0, 18);
});

const filteredAuditEntries = computed(() => {
  const keyword = auditSearch.value.trim().toLowerCase();
  return auditEntries.value.filter((entry) => {
    const statusOk = auditStatusFilter.value === 'all' || entry.status === auditStatusFilter.value;
    if (!statusOk) return false;
    if (!keyword) return true;
    return [entry.action, entry.command, entry.actor, entry.timestamp, entry.status]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(keyword));
  });
});

const matchedCommand = computed(() => {
  const text = agentRequest.value.trim().toLowerCase();
  if (!text) return suggestedCommands.value[0];
  if (/驗收|verify|檢查|測試/.test(text)) return findCommand('verify') ?? suggestedCommands.value[2] ?? suggestedCommands.value[0];
  if (/dry|預覽|不寫|不要寫/.test(text)) return findCommand('dry') ?? suggestedCommands.value[1] ?? suggestedCommands.value[0];
  if (/報告|report|產生|更新|今日/.test(text)) return findCommand('report') ?? suggestedCommands.value[0];
  return suggestedCommands.value[0];
});

function findCommand(keyword: string) {
  return suggestedCommands.value.find((command) => command.command.includes(keyword));
}

function completionRate(sheet: SheetSummary) {
  if (!sheet.total) return 0;
  return Math.round(((sheet.done + sheet.partial * 0.5) / sheet.total) * 100);
}

function runQuickTask(task: { message: string }) {
  return runAgentTask(task.message);
}

async function copyCommand(command: string) {
  try {
    await navigator.clipboard.writeText(command);
    ElMessage.success(`已複製：${command}`);
  } catch {
    ElMessage.warning('瀏覽器不允許複製，請手動選取指令。');
  }
}

async function loadReport() {
  isLoading.value = true;
  loadError.value = '';
  try {
    const response = await fetch(reportUrl.value, { cache: 'no-store' });
    if (!response.ok) throw new Error(`讀取 ${reportUrl.value} 失敗 (${response.status})`);
    const data = await response.json();
    const signature = JSON.stringify(data);
    if (signature !== reportSignature.value) {
      report.value = data;
      reportSignature.value = signature;
    }
    lastAutoRefreshAt.value = new Date().toLocaleString('zh-TW', { hour12: false });
    lastSuccessAt.value = lastAutoRefreshAt.value;
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : String(err);
  } finally {
    isLoading.value = false;
  }
}

async function checkRunner() {
  runnerError.value = '';
  try {
    const response = await fetch(`${AGENT_RUNNER_URL}/health`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`runner health ${response.status}`);
    const data = await response.json();
    runnerReady.value = Boolean(data.ok);
  } catch {
    runnerReady.value = false;
    runnerError.value = `本機 agent runner 未啟動；如需後台一鍵重產，請在專案根目錄執行：npm run agent:runner`;
  }
}

async function loadAudit() {
  try {
    const response = await fetch(`${AGENT_RUNNER_URL}/audit?limit=12`, { cache: 'no-store' });
    if (!response.ok) return;
    const data = await response.json();
    const entries = Array.isArray(data.entries) ? data.entries : [];
    const signature = JSON.stringify(entries);
    if (signature !== auditSignature.value) {
      auditEntries.value = entries;
      auditSignature.value = signature;
    }
    lastAutoRefreshAt.value = new Date().toLocaleString('zh-TW', { hour12: false });
    lastSuccessAt.value = lastAutoRefreshAt.value;
  } catch {
    try {
      const base = import.meta.env.BASE_URL || '/';
      const response = await fetch(`${base.replace(/\/$/, '')}/agent/audit-latest.json`, { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      const entries = Array.isArray(data.entries) ? data.entries : [];
      const signature = JSON.stringify(entries);
      if (signature !== auditSignature.value) {
        auditEntries.value = entries;
        auditSignature.value = signature;
      }
      lastAutoRefreshAt.value = new Date().toLocaleString('zh-TW', { hour12: false });
      lastSuccessAt.value = lastAutoRefreshAt.value;
    } catch {
      // keep the last successful audit list so the page stays useful during transient failures
    }
  }
}

async function loadTasks() {
  if (!runnerReady.value) return;
  isLoadingTasks.value = true;
  try {
    const response = await fetch(`${AGENT_RUNNER_URL}/agent/tasks`);
    if (!response.ok) return;
    const data = await response.json();
    if (data.ok) {
      tasks.value = Array.isArray(data.entries) ? data.entries : [];
      taskCounts.value = data.counts || null;
    }
  } catch {
    // runner offline – ignore
  } finally {
    isLoadingTasks.value = false;
  }
}

async function refreshAgentCenter() {
  await Promise.all([loadReport(), loadAudit(), checkRunner()]);
  if (runnerReady.value) await loadTasks();
}

async function runReportFromRunner() {
  await runAgentTask('幫我重新產生今天的維護報告');
}

async function runAgentRequest() {
  const message = agentRequest.value.trim() || '幫我產生今天的維護報告';
  await runAgentTask(message);
}

async function runAgentTask(message: string) {
  if (!runnerReady.value) {
    lastRun.value = {
      status: 'failed',
      message: '本機 agent runner 未啟動，無法從後台直接執行任務。',
      time: new Date().toLocaleString('zh-TW', { hour12: false }),
      stderrTail: '請在專案根目錄執行：npm run agent:runner',
    };
    ElMessage.warning('請先在專案根目錄執行 npm run agent:runner');
    return;
  }

  const isReportIntent = /報告|report|產生|重產|更新|今日|今天|維護|word|docx|主管/.test(message.toLowerCase());
  isRunningTask.value = true;
  isRunningReport.value = isReportIntent;
  lastRun.value = {
    status: 'running',
    message: `Agent 正在處理：${message}`,
    time: new Date().toLocaleString('zh-TW', { hour12: false }),
  };
  try {
    const response = await fetch(`${AGENT_RUNNER_URL}/agent-task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.message || data.error || data.stderrTail || 'agent task 執行失敗');
    }
    lastRun.value = {
      status: 'success',
      message: data.message || 'Agent 任務已完成。',
      time: new Date().toLocaleString('zh-TW', { hour12: false }),
      durationMs: data.durationMs,
      stdoutTail: data.stdoutTail,
      stderrTail: data.stderrTail,
    };
    ElMessage.success(data.message || 'Agent 任務已完成');
    if (data.task?.key === 'report') {
      await loadReport();
    }
    if (Array.isArray(data.audit)) {
      auditEntries.value = data.audit;
    }
    await loadAudit();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    lastRun.value = {
      status: 'failed',
      message,
      time: new Date().toLocaleString('zh-TW', { hour12: false }),
    };
    ElMessage.error(message);
  } finally {
    isRunningTask.value = false;
    isRunningReport.value = false;
    await checkRunner();
  }
}

const selectedTask = computed(() => {
  if (!selectedTaskId.value) return null;
  return tasks.value.find((t) => t.id === selectedTaskId.value) || null;
});

async function callRunner(method: string, path: string, body?: Record<string, unknown>) {
  const opts: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const response = await fetch(`${AGENT_RUNNER_URL}${path}`, opts);
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

function ensureRunnerOrWarn() {
  if (runnerReady.value) return true;
  ElMessage.warning('請先在專案根目錄執行 npm run agent:runner');
  return false;
}

async function intakeFromInput() {
  const message = agentRequest.value.trim();
  if (!message) {
    ElMessage.info('請先輸入要處理的內容');
    return;
  }
  if (!ensureRunnerOrWarn()) return;
  isIntakingTask.value = true;
  try {
    const { response, data } = await callRunner('POST', '/agent/intake', { message });
    if (!response.ok || !data.ok) {
      throw new Error(data.error || data.message || 'intake 失敗');
    }
    ElMessage.success(data.message || '已整理為任務卡');
    agentRequest.value = '';
    await loadTasks();
    await loadAudit();
    if (data.task?.id) {
      selectedTaskId.value = data.task.id;
      drawerVisible.value = true;
    }
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : String(err));
  } finally {
    isIntakingTask.value = false;
  }
}

function openTaskDetail(id: string) {
  selectedTaskId.value = id;
  drawerVisible.value = true;
}

async function approveTask(id: string) {
  if (!ensureRunnerOrWarn()) return;
  taskBusy.value.approving = true;
  try {
    const { response, data } = await callRunner('POST', `/agent/tasks/${id}/approve`, {});
    if (!response.ok || !data.ok) throw new Error(data.error || '核准失敗');
    ElMessage.success('已核准');
    await loadTasks();
    await loadAudit();
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : String(err));
  } finally {
    taskBusy.value.approving = false;
  }
}

async function runTask(id: string) {
  if (!ensureRunnerOrWarn()) return;
  taskBusy.value.running = true;
  try {
    const { response, data } = await callRunner('POST', `/agent/tasks/${id}/run`, {});
    if (!response.ok || !data.ok) {
      throw new Error(data.error || data.execution?.message || '執行失敗');
    }
    ElMessage.success(data.execution?.message || '任務執行完成');
    if (data.execution?.task?.key === 'report' || data.task?.nextAction === 'report') {
      await loadReport();
    }
    await loadTasks();
    await loadAudit();
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : String(err));
  } finally {
    taskBusy.value.running = false;
  }
}

async function blockTaskFromInbox(id: string) {
  if (!ensureRunnerOrWarn()) return;
  try {
    const result = await ElMessageBox.prompt('說明 blocked 原因', '標記 blocked', {
      confirmButtonText: '確認',
      cancelButtonText: '取消',
    });
    await blockTaskWithNote(id, result.value || '無說明');
  } catch {
    // cancelled
  }
}

async function blockTaskWithNote(id: string, note: string) {
  if (!ensureRunnerOrWarn()) return;
  try {
    const { response, data } = await callRunner('POST', `/agent/tasks/${id}/block`, { note });
    if (!response.ok || !data.ok) throw new Error(data.error || '無法標記 blocked');
    ElMessage.success('已標記 blocked');
    await loadTasks();
    await loadAudit();
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : String(err));
  }
}

async function patchTask(id: string, patch: Partial<AgentTask>) {
  if (!ensureRunnerOrWarn()) return;
  taskBusy.value.patching = true;
  try {
    const { response, data } = await callRunner('PATCH', `/agent/tasks/${id}`, { patch });
    if (!response.ok || !data.ok) throw new Error(data.error || '欄位更新失敗');
    ElMessage.success('欄位已更新');
    await loadTasks();
    await loadAudit();
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : String(err));
  } finally {
    taskBusy.value.patching = false;
  }
}

async function refreshFromExcel() {
  if (!ensureRunnerOrWarn()) return;
  isSyncingExcel.value = true;
  try {
    const { response, data } = await callRunner('POST', '/agent/tasks/refresh-from-excel', {});
    if (!response.ok || !data.ok) throw new Error(data.error || '從 Excel 同步失敗');
    ElMessage.success(`Excel 同步：匯入 ${data.imported}、更新 ${data.updated}、新增 ${data.added}`);
    await loadTasks();
    await loadAudit();
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : String(err));
  } finally {
    isSyncingExcel.value = false;
  }
}

onMounted(() => {
  refreshAgentCenter();
  refreshTimer = window.setInterval(() => {
    if (!autoRefreshEnabled.value) return;
    if (document.visibilityState !== 'visible') return;
    refreshAgentCenter();
  }, 30 * 1000);

  document.addEventListener('visibilitychange', visibilityHandler);
});

onBeforeUnmount(() => {
  if (refreshTimer) window.clearInterval(refreshTimer);
  document.removeEventListener('visibilitychange', visibilityHandler);
});
</script>

<style lang="scss" scoped>
.agent-layout {
  display: grid;
  gap: 18px;
}

.agent-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 20px;
  padding: 28px 32px;
}

.agent-kicker {
  display: inline-flex;
  margin-bottom: 8px;
  color: #ea5504;
  font-size: 13px;
  font-weight: 700;
}

.agent-hero h2,
.panel-head h3 {
  margin: 0 0 8px;
  color: #303133;
}

.agent-hero p,
.panel-head p {
  margin: 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.7;
}

.agent-status {
  display: grid;
  justify-items: end;
  gap: 8px;
  color: #909399;
  font-size: 13px;
}

.agent-alert {
  margin: 0 4px;
}

.agent-metrics,
.agent-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.agent-metrics {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.metric-card__inner,
.agent-panel {
  padding: 22px 24px;
}

.metric-card__inner {
  display: grid;
  gap: 6px;

  span,
  small {
    color: #909399;
    font-size: 12px;
  }

  strong {
    color: #303133;
    font-size: 28px;
    line-height: 1.1;
  }
}

.panel-head {
  margin-bottom: 16px;
}

.guide-card {
  display: grid;
  gap: 18px;
  padding: 26px 28px;
  border: 1px solid rgba(234, 85, 4, 0.12);
  background: linear-gradient(135deg, #fff9f5, #ffffff);
}

.guide-head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 16px;
  align-items: start;

  h3 {
    margin: 0 0 8px;
    color: #303133;
    font-size: 20px;
  }

  p {
    margin: 0;
    color: #606266;
    font-size: 14px;
    line-height: 1.7;
  }
}

.guide-kicker {
  display: inline-flex;
  margin-bottom: 8px;
  color: #ea5504;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.guide-steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.guide-step {
  display: grid;
  gap: 8px;
  padding: 16px;
  border: 1px solid rgba(48, 49, 51, 0.08);
  border-radius: 12px;
  background: #ffffff;

  span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 999px;
    background: #fff0e7;
    color: #ea5504;
    font-weight: 700;
  }

  strong {
    color: #303133;
    font-size: 15px;
  }

  p {
    margin: 0;
    color: #606266;
    font-size: 13px;
    line-height: 1.7;
  }
}

.guide-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding-top: 4px;
  border-top: 1px solid rgba(48, 49, 51, 0.08);

  span {
    color: #909399;
    font-size: 12px;
    line-height: 1.6;
    word-break: break-all;
  }
}

.task-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.task-item {
  display: grid;
  gap: 8px;
  min-height: 132px;
  padding: 16px;
  border: 1px solid rgba(48, 49, 51, 0.08);
  border-radius: 12px;
  background: #ffffff;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;

  &:hover,
  &:focus-visible {
    transform: translateY(-2px);
    border-color: rgba(234, 85, 4, 0.34);
    box-shadow: 0 14px 30px -24px rgba(23, 24, 24, 0.34);
    outline: none;
  }

  strong {
    color: #303133;
    font-size: 15px;
  }

  code {
    color: #ea5504;
    font-size: 12px;
    word-break: break-all;
  }

  small {
    color: #606266;
    line-height: 1.6;
  }
}

.task-item--report {
  background: linear-gradient(135deg, #fffaf6, #ffffff);
}

.task-item--dry {
  background: linear-gradient(135deg, #f7fbff, #ffffff);
}

.task-item--verify {
  background: linear-gradient(135deg, #f8fff4, #ffffff);
}

.task-item--status {
  background: linear-gradient(135deg, #f9f7ff, #ffffff);
}

.freshness-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.freshness-item {
  display: grid;
  gap: 6px;
  min-height: 92px;
  padding: 14px;
  border-radius: 12px;
  background: #f7f8fa;

  span {
    color: #909399;
    font-size: 12px;
    font-weight: 700;
  }

  strong {
    color: #303133;
    font-size: 14px;
    line-height: 1.5;
  }
}

.audit-toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 160px;
  gap: 12px;
  margin-bottom: 14px;
}

.pending-table {
  display: grid;
  gap: 8px;
}

.pending-row {
  display: grid;
  grid-template-columns: 52px 160px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid rgba(48, 49, 51, 0.08);
  border-radius: 10px;
  background: #ffffff;
  color: #606266;
  font-size: 13px;

  strong {
    color: #ea5504;
  }

  span:last-child {
    color: #303133;
  }
}

.pending-row--head {
  background: #f7f8fa;
  color: #909399;
  font-weight: 700;
}

.empty-state {
  padding: 20px;
  border-radius: 10px;
  background: #f7f8fa;
  color: #909399;
  text-align: center;
}

.intent-result {
  display: grid;
  gap: 8px;
  margin-top: 14px;
  padding: 14px;
  border-radius: 12px;
  background: #f7f8fa;

  span {
    color: #909399;
    font-size: 12px;
    font-weight: 700;
  }

  strong {
    color: #303133;
  }

  code {
    padding: 8px 10px;
    border-radius: 8px;
    background: #ffffff;
    color: #303133;
    font-family: Consolas, 'Liberation Mono', Menlo, monospace;
  }

  p {
    margin: 0;
    color: #606266;
    font-size: 13px;
  }
}

.intent-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.intent-hint {
  margin: 8px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.command-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.command-item {
  display: grid;
  gap: 8px;
  min-height: 132px;
  padding: 16px;
  border: 1px solid rgba(48, 49, 51, 0.08);
  border-radius: 12px;
  background: #ffffff;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:hover,
  &:focus-visible {
    border-color: rgba(234, 85, 4, 0.36);
    box-shadow: 0 14px 30px -24px rgba(23, 24, 24, 0.42);
  }

  span {
    color: #303133;
    font-weight: 700;
  }

  code {
    color: #ea5504;
    font-size: 13px;
    word-break: break-all;
  }

  small {
    color: #606266;
    line-height: 1.6;
  }
}

.sheet-list {
  display: grid;
  gap: 14px;
}

.sheet-item {
  display: grid;
  gap: 8px;

  > div {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    color: #606266;
    font-size: 13px;
  }

  strong {
    color: #303133;
  }
}

.safety-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  > div {
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
    gap: 8px;
    min-height: 132px;
    padding: 14px;
    border-radius: 12px;
    background: #f7f8fa;
  }

  span {
    width: 100%;
    color: #909399;
    font-size: 12px;
    font-weight: 700;
  }
}

.decision-list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding-left: 20px;
  color: #303133;
  line-height: 1.7;
}

.run-panel {
  border: 1px solid rgba(48, 49, 51, 0.08);
}

.run-panel--success {
  border-color: rgba(103, 194, 58, 0.28);
  background: linear-gradient(135deg, #f4fbef, #ffffff);
}

.run-panel--failed {
  border-color: rgba(245, 108, 108, 0.28);
  background: linear-gradient(135deg, #fdf2f2, #ffffff);
}

.run-panel--running {
  border-color: rgba(230, 162, 60, 0.32);
  background: linear-gradient(135deg, #fdf6ec, #ffffff);
}

.run-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 14px;
  margin-bottom: 16px;

  strong {
    color: #303133;
  }

  span {
    color: #909399;
    font-size: 13px;
  }
}

.output-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.output-item {
  display: grid;
  gap: 6px;
  padding: 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(48, 49, 51, 0.08);

  span {
    color: #909399;
    font-size: 12px;
    font-weight: 700;
  }

  code {
    color: #303133;
    font-size: 12px;
    word-break: break-all;
  }
}

.run-log {
  display: grid;
  gap: 10px;
  margin-top: 14px;

  span {
    display: inline-block;
    margin-bottom: 6px;
    color: #909399;
    font-size: 12px;
    font-weight: 700;
  }

  pre {
    max-height: 180px;
    margin: 0;
    overflow: auto;
    padding: 12px;
    border-radius: 10px;
    background: #1f2933;
    color: #e5e7eb;
    font-size: 12px;
    line-height: 1.6;
    white-space: pre-wrap;
  }
}

.audit-list {
  display: grid;
  gap: 10px;
}

.audit-row {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border: 1px solid rgba(48, 49, 51, 0.08);
  border-radius: 12px;
  background: #ffffff;

  > div {
    display: grid;
    gap: 4px;
    min-width: 0;
  }

  strong {
    color: #303133;
  }

  span,
  small {
    color: #909399;
    font-size: 12px;
  }

  code {
    color: #606266;
    font-size: 12px;
    word-break: break-all;
  }
}

@media (max-width: 1200px) {
  .agent-metrics,
  .command-grid,
  .guide-steps,
  .task-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .agent-hero,
  .agent-grid,
  .agent-metrics,
  .command-grid,
  .guide-steps,
  .task-grid,
  .output-grid,
  .safety-grid,
  .freshness-grid,
  .audit-toolbar {
    grid-template-columns: 1fr;
  }

  .agent-status {
    justify-items: start;
  }

  .pending-row {
    grid-template-columns: 44px minmax(0, 1fr);

    span:last-child {
      grid-column: 1 / -1;
    }
  }

  .audit-row {
    grid-template-columns: 1fr;
  }

  .guide-head,
  .guide-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
