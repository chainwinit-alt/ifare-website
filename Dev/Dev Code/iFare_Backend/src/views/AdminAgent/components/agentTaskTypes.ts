export type TaskStatus =
  | 'new'
  | 'triaged'
  | 'pending_review'
  | 'approved'
  | 'running'
  | 'done'
  | 'failed'
  | 'blocked';

export type TaskCategory =
  | 'backend-optimization'
  | 'uiux'
  | 'poc'
  | 'report-ops'
  | 'meta';

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export type TaskNextAction = 'report' | 'dryRun' | 'verify' | 'status' | 'manual';

export interface TaskHistoryEntry {
  at: string;
  from: TaskStatus | null;
  to: TaskStatus;
  actor: string;
  note: string;
}

export interface AgentTask {
  id: string;
  title: string;
  source: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  requestText: string;
  summary: string;
  nextAction: TaskNextAction;
  needsApproval: boolean;
  syncToExcel: boolean;
  excelRowRef: { sheet: string; rowIndex: number } | null;
  auditIds: string[];
  actor: string;
  createdAt: string;
  updatedAt: string;
  history: TaskHistoryEntry[];
}

export interface TaskCounts {
  new: number;
  triaged: number;
  pending_review: number;
  approved: number;
  running: number;
  done: number;
  failed: number;
  blocked: number;
}

export interface TaskListPayload {
  generatedAt: string;
  counts: TaskCounts;
  entries: AgentTask[];
}

export const TASK_CATEGORY_LABEL: Record<TaskCategory, string> = {
  'backend-optimization': '後台優化',
  uiux: 'UI/UX',
  poc: 'PoC',
  'report-ops': '報告產出',
  meta: '雜項',
};

export const TASK_PRIORITY_LABEL: Record<TaskPriority, string> = {
  critical: '緊急',
  high: '高',
  medium: '中',
  low: '低',
};

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  new: '新建',
  triaged: '已整理',
  pending_review: '待核准',
  approved: '已核准',
  running: '執行中',
  done: '完成',
  failed: '失敗',
  blocked: '卡住',
};

export const TASK_NEXT_ACTION_LABEL: Record<TaskNextAction, string> = {
  report: '重新產生維護報告',
  dryRun: '預覽報告（不寫檔）',
  verify: '驗收檢查',
  status: '查詢執行紀錄',
  manual: '需人工處理',
};
