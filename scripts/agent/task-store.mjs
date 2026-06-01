/**
 * task-store.mjs — JSON-backed task persistence for the AI maintenance runner.
 *
 * Cache file (docs/ai-agent-reports/_tasks-cache.json) holds the canonical local
 * copy. Excel is the user-facing source of truth (synced via excel-sync.mjs) but
 * this module never touches xlsx directly — it reads/writes JSON only.
 *
 * Public mirror (Dev/Dev Code/iFare_Backend/public/agent/tasks-latest.json) is
 * regenerated after every mutation so the Vue admin can read it statically.
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';

import {
  canTransition,
  formatTaskId,
  parseTaskIdDate,
  validateTask,
} from './task-state-machine.mjs';

function nowLocal() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function todayDate() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function readJsonFile(filePath, fallback) {
  if (!existsSync(filePath)) return fallback;
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJsonFile(filePath, payload) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

export function loadTasks(storeFile) {
  const data = readJsonFile(storeFile, { entries: [] });
  return Array.isArray(data.entries) ? data.entries : [];
}

export function persistTasks(tasks, options) {
  const { storeFile, publicMirror, maxPublicEntries = 50 } = options;
  const sorted = [...tasks].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  writeJsonFile(storeFile, {
    generatedAt: nowLocal(),
    counts: countByStatus(sorted),
    entries: sorted,
  });
  if (publicMirror) {
    writeJsonFile(publicMirror, {
      generatedAt: nowLocal(),
      counts: countByStatus(sorted),
      entries: sorted.slice(0, maxPublicEntries),
    });
  }
  return sorted;
}

export function getTask(tasks, id) {
  return tasks.find((t) => t.id === id) || null;
}

export function listTasks(tasks, filter = {}) {
  let result = [...tasks];
  if (filter.status) {
    const allow = new Set(Array.isArray(filter.status) ? filter.status : [filter.status]);
    result = result.filter((t) => allow.has(t.status));
  }
  if (filter.category) {
    const allow = new Set(Array.isArray(filter.category) ? filter.category : [filter.category]);
    result = result.filter((t) => allow.has(t.category));
  }
  if (filter.priority) {
    const allow = new Set(Array.isArray(filter.priority) ? filter.priority : [filter.priority]);
    result = result.filter((t) => allow.has(t.priority));
  }
  result.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  if (filter.limit) {
    result = result.slice(0, filter.limit);
  }
  return result;
}

export function nextTaskId(tasks, date = todayDate()) {
  let maxSeq = 0;
  for (const t of tasks) {
    const parsed = parseTaskIdDate(t.id);
    if (parsed && parsed.date === date && parsed.seq > maxSeq) {
      maxSeq = parsed.seq;
    }
  }
  return formatTaskId(date, maxSeq + 1);
}

export function createTask(input, tasks) {
  const now = nowLocal();
  const id = nextTaskId(tasks);
  const initialStatus = input.status || 'pending_review';
  const task = {
    id,
    title: input.title || '未命名任務',
    source: input.source || 'intake-text',
    category: input.category || 'meta',
    priority: input.priority || 'medium',
    status: initialStatus,
    requestText: input.requestText || '',
    summary: input.summary || '',
    nextAction: input.nextAction || 'manual',
    needsApproval: input.needsApproval !== false,
    syncToExcel: input.syncToExcel !== false,
    excelRowRef: null,
    auditIds: [],
    actor: input.actor || 'backend-admin',
    createdAt: now,
    updatedAt: now,
    history: [
      {
        at: now,
        from: null,
        to: initialStatus,
        actor: input.actor || 'backend-admin',
        note: input.createNote || '由 intake 建立',
      },
    ],
  };
  const validation = validateTask(task);
  if (!validation.ok) {
    const err = new Error(`invalid task payload: ${validation.errors.join('; ')}`);
    err.code = 'INVALID_TASK';
    throw err;
  }
  return task;
}

export function transition(task, toStatus, actor, note) {
  if (!task) {
    const err = new Error('task not found');
    err.code = 'TASK_NOT_FOUND';
    throw err;
  }
  if (!canTransition(task.status, toStatus)) {
    const err = new Error(`illegal transition: ${task.status} → ${toStatus}`);
    err.code = 'ILLEGAL_TRANSITION';
    throw err;
  }
  const now = nowLocal();
  return {
    ...task,
    status: toStatus,
    updatedAt: now,
    history: [
      ...(task.history || []),
      {
        at: now,
        from: task.status,
        to: toStatus,
        actor: actor || 'backend-admin',
        note: note || '',
      },
    ],
  };
}

export function updateTask(task, patch, actor) {
  if (!task) {
    const err = new Error('task not found');
    err.code = 'TASK_NOT_FOUND';
    throw err;
  }
  const allowedFields = ['title', 'category', 'priority', 'nextAction', 'needsApproval', 'syncToExcel', 'summary'];
  const sanitized = {};
  for (const key of allowedFields) {
    if (patch && Object.prototype.hasOwnProperty.call(patch, key)) {
      sanitized[key] = patch[key];
    }
  }
  if (Object.keys(sanitized).length === 0) return task;
  const now = nowLocal();
  const updated = {
    ...task,
    ...sanitized,
    updatedAt: now,
    history: [
      ...(task.history || []),
      {
        at: now,
        from: task.status,
        to: task.status,
        actor: actor || 'backend-admin',
        note: `欄位更新：${Object.keys(sanitized).join(', ')}`,
      },
    ],
  };
  const validation = validateTask(updated);
  if (!validation.ok) {
    const err = new Error(`invalid patch: ${validation.errors.join('; ')}`);
    err.code = 'INVALID_TASK';
    throw err;
  }
  return updated;
}

export function attachAuditId(task, auditId) {
  if (!task || !auditId) return task;
  const existing = Array.isArray(task.auditIds) ? task.auditIds : [];
  if (existing.includes(auditId)) return task;
  return { ...task, auditIds: [...existing, auditId] };
}

export function upsertTask(tasks, task) {
  const idx = tasks.findIndex((t) => t.id === task.id);
  if (idx === -1) return [...tasks, task];
  const copy = [...tasks];
  copy[idx] = task;
  return copy;
}

export function removeTask(tasks, id) {
  return tasks.filter((t) => t.id !== id);
}

export function countByStatus(tasks) {
  const counts = {
    new: 0,
    triaged: 0,
    pending_review: 0,
    approved: 0,
    running: 0,
    done: 0,
    failed: 0,
    blocked: 0,
  };
  for (const t of tasks) {
    if (Object.prototype.hasOwnProperty.call(counts, t.status)) {
      counts[t.status] += 1;
    }
  }
  return counts;
}
