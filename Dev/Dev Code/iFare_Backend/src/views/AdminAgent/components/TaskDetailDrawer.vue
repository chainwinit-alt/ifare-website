<template>
  <el-drawer
    v-model="visible"
    :title="task?.title || '任務詳情'"
    direction="rtl"
    size="520px"
  >
    <div v-if="task" class="task-detail">
      <section class="detail-block">
        <h4>任務概要</h4>
        <dl>
          <dt>ID</dt><dd><code>{{ task.id }}</code></dd>
          <dt>狀態</dt>
          <dd>
            <el-tag :type="statusTagType(task.status)" effect="dark" size="small">
              {{ statusLabel(task.status) }}
            </el-tag>
          </dd>
          <dt>分類</dt>
          <dd>
            <el-select v-model="editForm.category" size="small" :disabled="!canEdit">
              <el-option
                v-for="opt in categoryOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </dd>
          <dt>優先級</dt>
          <dd>
            <el-select v-model="editForm.priority" size="small" :disabled="!canEdit">
              <el-option
                v-for="opt in priorityOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </dd>
          <dt>建議動作</dt>
          <dd>
            <el-select v-model="editForm.nextAction" size="small" :disabled="!canEdit">
              <el-option
                v-for="opt in nextActionOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </dd>
          <dt>需人工核准</dt>
          <dd>
            <el-switch v-model="editForm.needsApproval" :disabled="!canEdit" />
          </dd>
          <dt>同步到 Excel</dt>
          <dd>{{ task.syncToExcel ? '是' : '否' }}<span v-if="task.excelRowRef"> · 第 {{ task.excelRowRef.rowIndex + 1 }} 列</span></dd>
          <dt>建立時間</dt><dd>{{ task.createdAt }}</dd>
          <dt>最後更新</dt><dd>{{ task.updatedAt }}</dd>
          <dt>觸發者</dt><dd>{{ task.actor }}</dd>
        </dl>
        <div v-if="canEdit && hasEdits" class="detail-edit-actions">
          <el-button size="small" plain @click="resetEdits">取消編輯</el-button>
          <el-button size="small" type="primary" :loading="patching" @click="submitPatch">
            儲存欄位變更
          </el-button>
        </div>
      </section>

      <section class="detail-block">
        <h4>原始輸入</h4>
        <p class="request-text">{{ task.requestText || '—' }}</p>
      </section>

      <section class="detail-block">
        <h4>整理摘要</h4>
        <p>{{ task.summary || '—' }}</p>
      </section>

      <section class="detail-block">
        <h4>狀態軌跡（{{ task.history?.length || 0 }} 筆）</h4>
        <ul class="timeline">
          <li v-for="(h, idx) in (task.history || []).slice().reverse()" :key="idx">
            <div class="timeline-head">
              <span class="timeline-time">{{ h.at }}</span>
              <span class="timeline-actor">{{ h.actor }}</span>
            </div>
            <div class="timeline-body">
              <span v-if="h.from">{{ statusLabel(h.from) }} → </span>
              <strong>{{ statusLabel(h.to) }}</strong>
              <em v-if="h.note">「{{ h.note }}」</em>
            </div>
          </li>
        </ul>
      </section>

      <section v-if="task.auditIds?.length" class="detail-block">
        <h4>關聯 audit log ({{ task.auditIds.length }})</h4>
        <ul class="audit-list">
          <li v-for="aid in task.auditIds" :key="aid"><code>{{ aid }}</code></li>
        </ul>
      </section>
    </div>

    <template #footer>
      <div v-if="task" class="detail-footer">
        <el-button
          v-if="task.status === 'pending_review'"
          type="primary"
          :disabled="!runnerReady"
          :loading="approving"
          @click="emit('approve', task.id)"
        >
          核准
        </el-button>
        <el-button
          v-if="task.status === 'approved' || (task.status === 'pending_review' && !task.needsApproval)"
          type="success"
          :disabled="!runnerReady"
          :loading="running"
          @click="emit('run', task.id)"
        >
          執行
        </el-button>
        <el-button
          v-if="!isTerminal(task.status)"
          plain
          :disabled="!runnerReady"
          @click="onBlock"
        >
          標記 blocked
        </el-button>
        <el-button text @click="visible = false">關閉</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import {
  ElButton,
  ElDrawer,
  ElMessageBox,
  ElOption,
  ElSelect,
  ElSwitch,
  ElTag,
} from 'element-plus';
import type {
  AgentTask,
  TaskCategory,
  TaskNextAction,
  TaskPriority,
  TaskStatus,
} from './agentTaskTypes';
import {
  TASK_CATEGORY_LABEL,
  TASK_NEXT_ACTION_LABEL,
  TASK_PRIORITY_LABEL,
  TASK_STATUS_LABEL,
} from './agentTaskTypes';

const props = defineProps<{
  modelValue: boolean;
  task: AgentTask | null;
  runnerReady?: boolean;
  approving?: boolean;
  running?: boolean;
  patching?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'approve', id: string): void;
  (e: 'run', id: string): void;
  (e: 'block', id: string, note: string): void;
  (e: 'patch', id: string, patch: Partial<AgentTask>): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const editForm = reactive({
  category: 'meta' as TaskCategory,
  priority: 'medium' as TaskPriority,
  nextAction: 'manual' as TaskNextAction,
  needsApproval: true,
});

watch(
  () => props.task,
  (t) => {
    if (!t) return;
    editForm.category = t.category;
    editForm.priority = t.priority;
    editForm.nextAction = t.nextAction;
    editForm.needsApproval = t.needsApproval;
  },
  { immediate: true },
);

const canEdit = computed(() => {
  if (!props.task) return false;
  return !isTerminal(props.task.status);
});

const hasEdits = computed(() => {
  if (!props.task) return false;
  return (
    editForm.category !== props.task.category ||
    editForm.priority !== props.task.priority ||
    editForm.nextAction !== props.task.nextAction ||
    editForm.needsApproval !== props.task.needsApproval
  );
});

const categoryOptions = (Object.keys(TASK_CATEGORY_LABEL) as TaskCategory[]).map((value) => ({
  value,
  label: TASK_CATEGORY_LABEL[value],
}));

const priorityOptions = (Object.keys(TASK_PRIORITY_LABEL) as TaskPriority[]).map((value) => ({
  value,
  label: TASK_PRIORITY_LABEL[value],
}));

const nextActionOptions = (Object.keys(TASK_NEXT_ACTION_LABEL) as TaskNextAction[]).map((value) => ({
  value,
  label: TASK_NEXT_ACTION_LABEL[value],
}));

function statusLabel(s: TaskStatus) {
  return TASK_STATUS_LABEL[s] || s;
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

function resetEdits() {
  if (!props.task) return;
  editForm.category = props.task.category;
  editForm.priority = props.task.priority;
  editForm.nextAction = props.task.nextAction;
  editForm.needsApproval = props.task.needsApproval;
}

function submitPatch() {
  if (!props.task) return;
  const patch: Partial<AgentTask> = {};
  if (editForm.category !== props.task.category) patch.category = editForm.category;
  if (editForm.priority !== props.task.priority) patch.priority = editForm.priority;
  if (editForm.nextAction !== props.task.nextAction) patch.nextAction = editForm.nextAction;
  if (editForm.needsApproval !== props.task.needsApproval) patch.needsApproval = editForm.needsApproval;
  if (Object.keys(patch).length === 0) return;
  emit('patch', props.task.id, patch);
}

async function onBlock() {
  if (!props.task) return;
  try {
    const { value } = await ElMessageBox.prompt('請說明 blocked 原因（會記錄在 history）', '標記 blocked', {
      confirmButtonText: '確認',
      cancelButtonText: '取消',
      inputPlaceholder: '例如：等資料庫團隊回覆',
    });
    emit('block', props.task.id, value || '無說明');
  } catch {
    // user cancelled
  }
}
</script>

<style lang="scss" scoped>
.task-detail {
  display: grid;
  gap: 18px;
  padding: 0 12px 12px;
}

.detail-block {
  display: grid;
  gap: 8px;

  h4 {
    margin: 0;
    font-size: 14px;
    color: var(--el-text-color-primary);
  }
}

.detail-block dl {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 6px 12px;
  margin: 0;

  dt {
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }

  dd {
    margin: 0;
    font-size: 13px;
    word-break: break-word;
  }
}

.detail-edit-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 6px;
}

.request-text {
  background: var(--el-fill-color-light);
  padding: 10px 12px;
  border-radius: 6px;
  margin: 0;
  font-size: 13px;
  white-space: pre-wrap;
}

.timeline {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 8px;

  li {
    border-left: 2px solid var(--el-border-color);
    padding-left: 10px;
  }
}

.timeline-head {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.timeline-body {
  font-size: 13px;

  em {
    font-style: normal;
    color: var(--el-text-color-secondary);
    margin-left: 6px;
  }
}

.audit-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 4px;

  li code {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.detail-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
