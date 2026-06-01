/**
 * task-state-machine.mjs — task lifecycle rules.
 *
 * Pure functions. No I/O. Imported by task-store and runner.
 */

export const STATUSES = Object.freeze([
  'new',
  'triaged',
  'pending_review',
  'approved',
  'running',
  'done',
  'failed',
  'blocked',
]);

export const CATEGORIES = Object.freeze([
  'backend-optimization',
  'uiux',
  'poc',
  'report-ops',
  'meta',
]);

export const PRIORITIES = Object.freeze(['critical', 'high', 'medium', 'low']);

export const SOURCES = Object.freeze(['intake-text', 'report-derived', 'manual']);

export const NEXT_ACTIONS = Object.freeze([
  'report',
  'dryRun',
  'verify',
  'status',
  'manual',
]);

const TERMINAL_STATUSES = new Set(['done', 'failed']);

export const ALLOWED_TRANSITIONS = Object.freeze({
  new: ['triaged', 'pending_review', 'blocked'],
  triaged: ['pending_review', 'blocked'],
  pending_review: ['approved', 'blocked'],
  approved: ['running', 'blocked'],
  running: ['done', 'failed', 'blocked'],
  done: ['pending_review'],
  failed: ['pending_review', 'blocked'],
  blocked: ['pending_review', 'triaged'],
});

export function canTransition(from, to) {
  if (!STATUSES.includes(from) || !STATUSES.includes(to)) return false;
  if (from === to) return false;
  return (ALLOWED_TRANSITIONS[from] || []).includes(to);
}

export function isTerminal(status) {
  return TERMINAL_STATUSES.has(status);
}

const ID_PATTERN = /^TASK-\d{4}-\d{2}-\d{2}-\d{3}$/;

export function validateTask(task) {
  const errors = [];
  if (!task || typeof task !== 'object') {
    return { ok: false, errors: ['task must be an object'] };
  }
  if (typeof task.id !== 'string' || !ID_PATTERN.test(task.id)) {
    errors.push('id must match TASK-YYYY-MM-DD-NNN');
  }
  if (typeof task.title !== 'string' || !task.title.trim()) {
    errors.push('title is required');
  } else if (task.title.length > 80) {
    errors.push('title must be 80 chars or less');
  }
  if (!SOURCES.includes(task.source)) {
    errors.push(`source must be one of: ${SOURCES.join(', ')}`);
  }
  if (!CATEGORIES.includes(task.category)) {
    errors.push(`category must be one of: ${CATEGORIES.join(', ')}`);
  }
  if (!PRIORITIES.includes(task.priority)) {
    errors.push(`priority must be one of: ${PRIORITIES.join(', ')}`);
  }
  if (!STATUSES.includes(task.status)) {
    errors.push(`status must be one of: ${STATUSES.join(', ')}`);
  }
  if (!NEXT_ACTIONS.includes(task.nextAction)) {
    errors.push(`nextAction must be one of: ${NEXT_ACTIONS.join(', ')}`);
  }
  if (typeof task.needsApproval !== 'boolean') {
    errors.push('needsApproval must be boolean');
  }
  if (typeof task.syncToExcel !== 'boolean') {
    errors.push('syncToExcel must be boolean');
  }
  if (task.requestText != null && typeof task.requestText !== 'string') {
    errors.push('requestText must be string when present');
  }
  if (!Array.isArray(task.history)) {
    errors.push('history must be array');
  }
  if (!Array.isArray(task.auditIds)) {
    errors.push('auditIds must be array');
  }
  if (typeof task.createdAt !== 'string' || typeof task.updatedAt !== 'string') {
    errors.push('createdAt/updatedAt must be strings');
  }
  return { ok: errors.length === 0, errors };
}

export function parseTaskIdDate(id) {
  const match = /^TASK-(\d{4}-\d{2}-\d{2})-(\d{3})$/.exec(String(id || ''));
  if (!match) return null;
  return { date: match[1], seq: Number.parseInt(match[2], 10) };
}

export function formatTaskId(dateStr, seq) {
  return `TASK-${dateStr}-${String(seq).padStart(3, '0')}`;
}
