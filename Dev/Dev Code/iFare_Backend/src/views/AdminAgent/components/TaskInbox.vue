<template>
  <section class="section-main-card card-fullsize task-inbox">
    <div class="card-info">
      <div class="inbox-head">
        <div>
          <span class="inbox-kicker">任務收件匣</span>
          <h3>從輸入框整理出來的維護任務</h3>
          <p>{{ headlineMessage }}</p>
        </div>
        <div class="inbox-actions">
          <el-select
            v-model="filter"
            size="default"
            class="inbox-filter"
          >
            <el-option label="全部" value="all" />
            <el-option label="等核准" value="pending_review" />
            <el-option label="已核准" value="approved" />
            <el-option label="執行中" value="running" />
            <el-option label="完成" value="done" />
            <el-option label="失敗" value="failed" />
            <el-option label="卡住 blocked" value="blocked" />
          </el-select>
          <el-button
            size="default"
            :icon="Refresh"
            :loading="loading"
            @click="emit('refresh')"
          >
            重新整理
          </el-button>
          <el-button
            size="default"
            plain
            :loading="syncing"
            @click="emit('refresh-from-excel')"
          >
            從 Excel 重新整理
          </el-button>
        </div>
      </div>

      <div class="inbox-counts">
        <span
          v-for="key in countOrder"
          :key="key"
          class="count-pill"
          :class="`count-pill--${key}`"
        >
          {{ statusLabel(key) }} · {{ counts?.[key] ?? 0 }}
        </span>
      </div>

      <div v-if="filteredTasks.length === 0" class="inbox-empty">
        <p>{{ emptyMessage }}</p>
      </div>

      <div v-else class="inbox-grid">
        <article
          v-for="task in filteredTasks"
          :key="task.id"
          class="inbox-card"
          :class="`inbox-card--${task.status}`"
        >
          <header>
            <span class="inbox-card-id">{{ task.id }}</span>
            <div class="inbox-card-tags">
              <el-tag size="small" :type="priorityTagType(task.priority)">
                {{ priorityLabel(task.priority) }}
              </el-tag>
              <el-tag size="small" type="info" effect="plain">
                {{ categoryLabel(task.category) }}
              </el-tag>
              <el-tag size="small" :type="statusTagType(task.status)" effect="dark">
                {{ statusLabel(task.status) }}
              </el-tag>
            </div>
          </header>

          <h4 class="inbox-card-title">{{ task.title }}</h4>
          <p class="inbox-card-summary">{{ task.summary }}</p>

          <p v-if="task.requestText" class="inbox-card-request">
            <span>原始輸入</span>
            <em>{{ truncate(task.requestText, 80) }}</em>
          </p>

          <footer>
            <small>建立：{{ task.createdAt }}</small>
            <small v-if="task.excelRowRef">已同步 Excel · 第 {{ task.excelRowRef.rowIndex + 1 }} 列</small>
            <small v-else>尚未同步 Excel</small>
            <div class="inbox-card-actions">
              <el-button size="small" plain @click="emit('view', task.id)">
                查看詳情
              </el-button>
              <el-button
                v-if="task.status === 'pending_review'"
                size="small"
                type="primary"
                :disabled="!runnerReady"
                @click="emit('approve', task.id)"
              >
                核准
              </el-button>
              <el-button
                v-if="task.status === 'approved' || (task.status === 'pending_review' && !task.needsApproval)"
                size="small"
                type="success"
                :disabled="!runnerReady"
                @click="emit('run', task.id)"
              >
                執行
              </el-button>
              <el-button
                v-if="!isTerminal(task.status)"
                size="small"
                plain
                :disabled="!runnerReady"
                @click="emit('block', task.id)"
              >
                標記 blocked
              </el-button>
            </div>
          </footer>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { ElButton, ElOption, ElSelect, ElTag } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';
import type {
  AgentTask,
  TaskCounts,
  TaskCategory,
  TaskPriority,
  TaskStatus,
} from './agentTaskTypes';
import {
  TASK_CATEGORY_LABEL,
  TASK_PRIORITY_LABEL,
  TASK_STATUS_LABEL,
} from './agentTaskTypes';

const props = defineProps<{
  tasks: AgentTask[];
  counts?: TaskCounts | null;
  loading?: boolean;
  syncing?: boolean;
  runnerReady?: boolean;
}>();

const emit = defineEmits<{
  (e: 'view', id: string): void;
  (e: 'approve', id: string): void;
  (e: 'run', id: string): void;
  (e: 'block', id: string): void;
  (e: 'refresh'): void;
  (e: 'refresh-from-excel'): void;
}>();

const filter = ref<TaskStatus | 'all'>('all');

const countOrder: TaskStatus[] = [
  'pending_review',
  'approved',
  'running',
  'done',
  'failed',
  'blocked',
];

const filteredTasks = computed(() => {
  if (filter.value === 'all') {
    return [...props.tasks].sort(sortByPriorityThenUpdated);
  }
  return props.tasks
    .filter((t) => t.status === filter.value)
    .sort(sortByPriorityThenUpdated);
});

const headlineMessage = computed(() => {
  const pending = props.counts?.pending_review ?? 0;
  const running = props.counts?.running ?? 0;
  if (pending === 0 && running === 0) {
    return '目前沒有等核准或執行中的任務。輸入需求後 agent 會整理成卡片放這裡。';
  }
  if (pending > 0 && running > 0) {
    return `有 ${pending} 件等核准，${running} 件正在執行。`;
  }
  if (pending > 0) {
    return `有 ${pending} 件等核准，請依優先級處理。`;
  }
  return `${running} 件正在執行中。`;
});

const emptyMessage = computed(() => {
  if (filter.value === 'all') return '目前沒有任何任務。';
  return `目前沒有「${statusLabel(filter.value as TaskStatus)}」狀態的任務。`;
});

function priorityWeight(p: TaskPriority) {
  return { critical: 0, high: 1, medium: 2, low: 3 }[p] ?? 2;
}

function sortByPriorityThenUpdated(a: AgentTask, b: AgentTask) {
  const dp = priorityWeight(a.priority) - priorityWeight(b.priority);
  if (dp !== 0) return dp;
  return a.updatedAt < b.updatedAt ? 1 : -1;
}

function truncate(text: string, max: number) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function categoryLabel(c: TaskCategory) {
  return TASK_CATEGORY_LABEL[c] || c;
}

function priorityLabel(p: TaskPriority) {
  return TASK_PRIORITY_LABEL[p] || p;
}

function statusLabel(s: TaskStatus) {
  return TASK_STATUS_LABEL[s] || s;
}

function priorityTagType(p: TaskPriority): '' | 'success' | 'warning' | 'info' | 'danger' {
  return ({
    critical: 'danger',
    high: 'warning',
    medium: '',
    low: 'info',
  } as const)[p];
}

function statusTagType(s: TaskStatus): '' | 'success' | 'warning' | 'info' | 'danger' {
  return ({
    new: 'info',
    triaged: 'info',
    pending_review: 'warning',
    approved: '',
    running: 'warning',
    done: 'success',
    failed: 'danger',
    blocked: 'danger',
  } as const)[s];
}

function isTerminal(s: TaskStatus) {
  return s === 'done' || s === 'failed';
}
</script>

<style lang="scss" scoped>
.task-inbox .card-info {
  padding: 24px 32px 28px;
  display: grid;
  gap: 16px;
}

.inbox-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 16px;

  h3 {
    margin: 6px 0 4px;
  }

  p {
    margin: 0;
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }
}

.inbox-kicker {
  font-size: 12px;
  letter-spacing: 0.08em;
  color: var(--el-color-primary);
  text-transform: uppercase;
}

.inbox-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.inbox-filter {
  width: 130px;
}

.inbox-counts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.count-pill {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
}

.count-pill--pending_review {
  background: var(--el-color-warning-light-8);
  color: var(--el-color-warning-dark-2);
}

.count-pill--running {
  background: var(--el-color-warning-light-8);
}

.count-pill--done {
  background: var(--el-color-success-light-8);
  color: var(--el-color-success-dark-2);
}

.count-pill--failed,
.count-pill--blocked {
  background: var(--el-color-danger-light-8);
  color: var(--el-color-danger-dark-2);
}

.inbox-empty {
  text-align: center;
  padding: 24px;
  color: var(--el-text-color-secondary);
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
}

.inbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}

.inbox-card {
  border: 1px solid var(--el-border-color);
  border-radius: 10px;
  padding: 14px 16px;
  display: grid;
  gap: 10px;
  background: var(--el-bg-color);

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }
}

.inbox-card--pending_review {
  border-color: var(--el-color-warning-light-5);
  background: var(--el-color-warning-light-9);
}

.inbox-card--running {
  border-color: var(--el-color-primary-light-5);
}

.inbox-card--done {
  opacity: 0.85;
}

.inbox-card--failed,
.inbox-card--blocked {
  border-color: var(--el-color-danger-light-5);
}

.inbox-card-id {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-family: monospace;
}

.inbox-card-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.inbox-card-title {
  margin: 0;
  font-size: 15px;
  line-height: 1.4;
}

.inbox-card-summary {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.inbox-card-request {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);

  span {
    display: inline-block;
    margin-right: 6px;
    color: var(--el-text-color-placeholder);
  }

  em {
    font-style: normal;
  }
}

.inbox-card footer {
  display: grid;
  gap: 6px;

  small {
    color: var(--el-text-color-secondary);
    font-size: 11px;
  }
}

.inbox-card-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 4px;
}
</style>
