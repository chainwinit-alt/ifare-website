#!/usr/bin/env node
/**
 * ai-maintenance-runner.mjs - local-only agent runner for the backend AI center.
 *
 * This is intentionally small and locked down:
 * - binds to 127.0.0.1 by default
 * - exposes only a fixed allowlist of actions
 * - never accepts arbitrary shell commands from the browser
 */

import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

import { classifyMessage } from './agent/intake-classifier.mjs';
import {
  attachAuditId,
  countByStatus,
  createTask,
  getTask,
  listTasks,
  loadTasks,
  persistTasks,
  transition,
  updateTask,
  upsertTask,
} from './agent/task-store.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(REPO_ROOT, 'docs', 'agent.config.json');

const DEFAULT_CONFIG = {
  runner: {
    host: '127.0.0.1',
    port: 4873,
    allowedOrigins: [
      'http://127.0.0.1:5173',
      'http://localhost:5173',
      'http://127.0.0.1:4173',
      'http://localhost:4173',
    ],
  },
  audit: {
    logFile: 'docs/ai-agent-reports/_audit.jsonl',
    backendPublicJson: 'Dev/Dev Code/iFare_Backend/public/agent/audit-latest.json',
    maxPublicEntries: 30,
  },
  task: {
    storeFile: 'docs/ai-agent-reports/_tasks-cache.json',
    publicMirror: 'Dev/Dev Code/iFare_Backend/public/agent/tasks-latest.json',
    excelSheet: 'AI 任務看板',
    autoApproveActions: ['report', 'dryRun', 'verify', 'status'],
    maxPublicEntries: 50,
    maxExcelSizeMB: 5,
    lockFile: 'docs/ai-agent-reports/_tasks-write.lock',
  },
};

function readConfig() {
  if (!existsSync(CONFIG_PATH)) return DEFAULT_CONFIG;
  const parsed = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
  return {
    ...DEFAULT_CONFIG,
    ...parsed,
    runner: { ...DEFAULT_CONFIG.runner, ...(parsed.runner ?? {}) },
    audit: { ...DEFAULT_CONFIG.audit, ...(parsed.audit ?? {}) },
    task: { ...DEFAULT_CONFIG.task, ...(parsed.task ?? {}) },
  };
}

const CONFIG = readConfig();
const HOST = process.env.AGENT_RUNNER_HOST || CONFIG.runner.host || '127.0.0.1';
const PORT = Number.parseInt(process.env.AGENT_RUNNER_PORT || String(CONFIG.runner.port || 4873), 10);
const allowedOrigins = new Set(CONFIG.runner.allowedOrigins || []);
let isRunning = false;

const TASKS = {
  report: {
    key: 'report',
    label: '重新產生維護報告',
    command: 'node scripts/ai-maintenance-report.mjs',
    script: path.join('scripts', 'ai-maintenance-report.mjs'),
    args: [],
    writesFiles: true,
  },
  dryRun: {
    key: 'dryRun',
    label: '預覽維護報告',
    command: 'node scripts/ai-maintenance-report.mjs --dry-run',
    script: path.join('scripts', 'ai-maintenance-report.mjs'),
    args: ['--dry-run'],
    writesFiles: false,
  },
  verify: {
    key: 'verify',
    label: '驗收 agent',
    command: 'node scripts/ai-maintenance-verify.mjs',
    script: path.join('scripts', 'ai-maintenance-verify.mjs'),
    args: [],
    writesFiles: false,
  },
  status: {
    key: 'status',
    label: '查詢執行狀態',
    command: 'GET /audit',
    writesFiles: false,
  },
};

function expandConfiguredPath(p) {
  const value = String(p ?? '');
  if (value === '~') return homedir();
  if (value.startsWith('~/') || value.startsWith('~\\')) return path.join(homedir(), value.slice(2));
  if (/^%USERPROFILE%(\\|\/|$)/i.test(value)) return value.replace(/^%USERPROFILE%/i, homedir());
  if (/^\$HOME(\\|\/|$)/.test(value)) return value.replace(/^\$HOME/, homedir());
  return value;
}

function resolveRepoPath(p) {
  const expanded = expandConfiguredPath(p);
  return path.isAbsolute(expanded) ? path.normalize(expanded) : path.resolve(REPO_ROOT, expanded);
}

function displayPath(p) {
  const abs = resolveRepoPath(p);
  const rel = path.relative(REPO_ROOT, abs) || '.';
  if (rel.startsWith('..') || path.isAbsolute(rel)) return abs.split(path.sep).join('/');
  return rel.split(path.sep).join('/');
}

function nowLocal() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function jsonResponse(res, statusCode, body, origin = '') {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  };
  if (origin && allowedOrigins.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }
  res.writeHead(statusCode, headers);
  res.end(`${JSON.stringify(body, null, 2)}\n`);
}

function optionsResponse(res, origin = '') {
  const headers = {
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '600',
  };
  if (origin && allowedOrigins.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }
  res.writeHead(204, headers);
  res.end();
}

function normalizeOutput(text, maxLen = 5000) {
  return String(text || '')
    .replace(/\b(Bearer\s+)[A-Za-z0-9._~+/=-]+/gi, '$1[REDACTED]')
    .replace(/\b(password|passwd|token|secret|api[_-]?key|securitykey)\s*[:=]\s*([^\s;,'"]+)/gi, '$1=[REDACTED]')
    .slice(-maxLen);
}

function auditPaths() {
  return {
    logFile: resolveRepoPath(CONFIG.audit.logFile),
    publicJson: CONFIG.audit.backendPublicJson ? resolveRepoPath(CONFIG.audit.backendPublicJson) : null,
  };
}

function readAuditEntries(limit = 30) {
  const { logFile } = auditPaths();
  if (!existsSync(logFile)) return [];
  return readFileSync(logFile, 'utf8')
    .split('\n')
    .filter(Boolean)
    .slice(-limit)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .reverse();
}

function syncPublicAudit() {
  const { publicJson } = auditPaths();
  if (!publicJson) return;
  const entries = readAuditEntries(CONFIG.audit.maxPublicEntries || 30);
  mkdirSync(path.dirname(publicJson), { recursive: true });
  writeFileSync(publicJson, `${JSON.stringify({ generatedAt: nowLocal(), entries }, null, 2)}\n`, 'utf8');
}

function appendAudit(entry) {
  const { logFile } = auditPaths();
  mkdirSync(path.dirname(logFile), { recursive: true });
  const id = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  appendFileSync(logFile, `${JSON.stringify({
    id,
    timestamp: nowLocal(),
    actor: entry.actor || 'backend-admin',
    source: 'agent-runner',
    ...entry,
  })}\n`, 'utf8');
  syncPublicAudit();
  return id;
}

function reportOutputFiles() {
  const outputDir = resolveRepoPath(CONFIG.report?.outputDir || 'docs/ai-agent-reports');
  const date = today();
  const files = [
    path.join(outputDir, `${date}.docx`),
    path.join(outputDir, `${date}.md`),
    CONFIG.report?.backendPublicJson ? resolveRepoPath(CONFIG.report.backendPublicJson) : null,
    CONFIG.audit?.backendPublicJson ? resolveRepoPath(CONFIG.audit.backendPublicJson) : null,
  ].filter(Boolean);
  return files.map((file) => displayPath(file));
}

function availableTasks() {
  return Object.values(TASKS).map((task) => ({
    key: task.key,
    label: task.label,
    command: task.command,
    writesFiles: task.writesFiles,
  }));
}

function taskStorePaths() {
  return {
    storeFile: resolveRepoPath(CONFIG.task.storeFile),
    publicMirror: CONFIG.task.publicMirror ? resolveRepoPath(CONFIG.task.publicMirror) : null,
    maxPublicEntries: CONFIG.task.maxPublicEntries || 50,
  };
}

function readTaskCache() {
  return loadTasks(taskStorePaths().storeFile);
}

function writeTaskCache(tasks) {
  return persistTasks(tasks, taskStorePaths());
}

function autoApproveSet() {
  return new Set(CONFIG.task.autoApproveActions || []);
}

async function syncTaskToExcelSafe(task, actor) {
  if (!task.syncToExcel) return { ok: true, skipped: true };
  try {
    const mod = await import('./agent/excel-sync.mjs');
    return await mod.writeTaskToExcel(task, {
      configPath: CONFIG_PATH,
      maxSizeMB: CONFIG.task.maxExcelSizeMB,
      lockFile: resolveRepoPath(CONFIG.task.lockFile),
      sheetName: CONFIG.task.excelSheet,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    appendAudit({
      action: 'task.excel.failed',
      status: 'failed',
      actor: actor || 'backend-admin',
      taskId: task.id,
      stderrTail: normalizeOutput(message, 1000),
    });
    return { ok: false, skipped: false, error: message };
  }
}

function resolveTaskFromMessage(message) {
  const text = String(message || '').trim().toLowerCase();
  if (!text) return TASKS.report;
  if (/驗收|verify|測試|檢查|health|check/.test(text)) return TASKS.verify;
  if (/dry|預覽|不寫|不要寫|preview/.test(text)) return TASKS.dryRun;
  if (/狀態|紀錄|audit|log|進度|成功|失敗|history/.test(text)) return TASKS.status;
  if (/報告|report|產生|重產|更新|今日|今天|維護|word|docx|主管/.test(text)) return TASKS.report;
  return null;
}

function readRequestBody(req, maxBytes = 8192) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
      if (Buffer.byteLength(body) > maxBytes) {
        reject(new Error('request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

async function readJsonBody(req) {
  const raw = await readRequestBody(req);
  if (!raw.trim()) return {};
  return JSON.parse(raw);
}

function runNodeScript(scriptPath, args = []) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const child = spawn(process.execPath, [scriptPath, ...args], {
      cwd: REPO_ROOT,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('close', (code) => {
      resolve({
        ok: code === 0,
        code,
        durationMs: Date.now() - startedAt,
        stdout: normalizeOutput(stdout),
        stderr: normalizeOutput(stderr),
      });
    });
    child.on('error', (err) => {
      resolve({
        ok: false,
        code: -1,
        durationMs: Date.now() - startedAt,
        stdout: normalizeOutput(stdout),
        stderr: normalizeOutput(err.message),
      });
    });
  });
}

async function executeTask(task, message = '') {
  if (!task) {
    return {
      statusCode: 422,
      body: {
        ok: false,
        error: 'unsupported task',
        message: '目前只支援：重新產生報告、預覽報告、驗收 agent、查詢執行紀錄。',
        availableTasks: availableTasks(),
      },
    };
  }

  if (task.key === 'status') {
    return {
      statusCode: 200,
      body: {
        ok: true,
        task: { key: task.key, label: task.label },
        command: task.command,
        running: isRunning,
        message: isRunning ? 'agent 目前正在執行任務。' : 'agent 目前沒有執行中的任務。',
        availableTasks: availableTasks(),
        audit: readAuditEntries(12),
      },
    };
  }

  if (isRunning) {
    return {
      statusCode: 409,
      body: { ok: false, error: 'agent runner is already running a task' },
    };
  }

  isRunning = true;
  appendAudit({
    action: `${task.key}.run.start`,
    command: task.command,
    status: 'running',
    request: normalizeOutput(message, 500),
  });

  let result;
  try {
    result = await runNodeScript(task.script, task.args);
  } finally {
    isRunning = false;
  }

  const outputFiles = task.key === 'report' ? reportOutputFiles() : [];
  appendAudit({
    action: `${task.key}.run.finish`,
    command: task.command,
    status: result.ok ? 'success' : 'failed',
    durationMs: result.durationMs,
    exitCode: result.code,
    stdoutTail: result.stdout,
    stderrTail: result.stderr,
    outputFiles,
  });

  return {
    statusCode: result.ok ? 200 : 500,
    body: {
      ok: result.ok,
      task: { key: task.key, label: task.label },
      command: task.command,
      durationMs: result.durationMs,
      exitCode: result.code,
      stdoutTail: result.stdout,
      stderrTail: result.stderr,
      outputFiles,
      message: result.ok ? `${task.label}已完成。` : `${task.label}執行失敗。`,
      audit: readAuditEntries(10),
    },
  };
}

async function handleRunReport(res, origin) {
  const result = await executeTask(TASKS.report, '重新產生今天的維護報告');
  jsonResponse(res, result.statusCode, result.body, origin);
}

async function handleAgentTask(req, res, origin) {
  try {
    const body = await readJsonBody(req);
    const message = typeof body.message === 'string' ? body.message : '';
    const task = resolveTaskFromMessage(message);
    const result = await executeTask(task, message);
    jsonResponse(res, result.statusCode, result.body, origin);
  } catch (err) {
    jsonResponse(res, 400, {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }, origin);
  }
}

async function handleTaskIntake(req, res, origin) {
  try {
    const body = await readJsonBody(req);
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (!message) {
      jsonResponse(res, 400, { ok: false, error: 'message is required' }, origin);
      return;
    }
    const actor = typeof body.actor === 'string' ? body.actor : 'backend-admin';
    const classified = classifyMessage(message);
    const tasks = readTaskCache();
    let task = createTask({
      ...classified,
      nextAction: classified.suggestedAction,
      source: 'intake-text',
      requestText: normalizeOutput(message, 1000),
      actor,
    }, tasks);

    const auditId = appendAudit({
      action: 'task.created',
      status: 'success',
      actor,
      taskId: task.id,
      request: normalizeOutput(message, 500),
      stdoutTail: `${task.category} / ${task.priority} / next=${task.nextAction}`,
    });
    task = attachAuditId(task, auditId);
    const next = upsertTask(tasks, task);

    const excelResult = await syncTaskToExcelSafe(task, actor);
    let finalTask = task;
    if (excelResult.ok && excelResult.excelRowRef) {
      finalTask = { ...task, excelRowRef: excelResult.excelRowRef };
    }
    writeTaskCache(upsertTask(next, finalTask));

    jsonResponse(res, 200, {
      ok: true,
      task: finalTask,
      classification: classified,
      excelSync: excelResult,
      counts: countByStatus(readTaskCache()),
      message: '已整理為任務卡，狀態：pending_review。',
    }, origin);
  } catch (err) {
    jsonResponse(res, 500, {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }, origin);
  }
}

function handleTaskList(url, res, origin) {
  const tasks = readTaskCache();
  const status = url.searchParams.get('status') || undefined;
  const category = url.searchParams.get('category') || undefined;
  const priority = url.searchParams.get('priority') || undefined;
  const limit = Math.min(Number.parseInt(url.searchParams.get('limit') || '0', 10) || 0, 200);
  const filter = {};
  if (status) filter.status = status.split(',');
  if (category) filter.category = category.split(',');
  if (priority) filter.priority = priority.split(',');
  if (limit) filter.limit = limit;
  const entries = listTasks(tasks, filter);
  jsonResponse(res, 200, {
    ok: true,
    counts: countByStatus(tasks),
    entries,
  }, origin);
}

function handleTaskGet(taskId, res, origin) {
  const tasks = readTaskCache();
  const task = getTask(tasks, taskId);
  if (!task) {
    jsonResponse(res, 404, { ok: false, error: 'task not found', taskId }, origin);
    return;
  }
  jsonResponse(res, 200, { ok: true, task }, origin);
}

async function performTransition(taskId, toStatus, actor, note, action) {
  const tasks = readTaskCache();
  const task = getTask(tasks, taskId);
  if (!task) {
    return { statusCode: 404, body: { ok: false, error: 'task not found', taskId } };
  }
  let next;
  try {
    next = transition(task, toStatus, actor, note);
  } catch (err) {
    const code = err.code === 'ILLEGAL_TRANSITION' ? 409 : 400;
    return { statusCode: code, body: { ok: false, error: err.message, taskId } };
  }
  const auditId = appendAudit({
    action,
    status: 'success',
    actor: actor || 'backend-admin',
    taskId: next.id,
    request: normalizeOutput(note || '', 500),
  });
  let finalTask = attachAuditId(next, auditId);
  const excelResult = await syncTaskToExcelSafe(finalTask, actor);
  if (excelResult.ok && excelResult.excelRowRef) {
    finalTask = { ...finalTask, excelRowRef: excelResult.excelRowRef };
  }
  writeTaskCache(upsertTask(tasks, finalTask));
  return {
    statusCode: 200,
    body: { ok: true, task: finalTask, excelSync: excelResult },
  };
}

async function handleTaskApprove(req, res, origin, taskId) {
  try {
    const body = await readJsonBody(req).catch(() => ({}));
    const actor = typeof body.actor === 'string' ? body.actor : 'backend-admin';
    const note = typeof body.note === 'string' ? body.note : '人工核准';
    const result = await performTransition(taskId, 'approved', actor, note, 'task.approved');
    jsonResponse(res, result.statusCode, result.body, origin);
  } catch (err) {
    jsonResponse(res, 500, { ok: false, error: err instanceof Error ? err.message : String(err) }, origin);
  }
}

async function handleTaskBlock(req, res, origin, taskId) {
  try {
    const body = await readJsonBody(req).catch(() => ({}));
    const actor = typeof body.actor === 'string' ? body.actor : 'backend-admin';
    const note = typeof body.note === 'string' ? body.note : '標記為 blocked';
    const result = await performTransition(taskId, 'blocked', actor, note, 'task.blocked');
    jsonResponse(res, result.statusCode, result.body, origin);
  } catch (err) {
    jsonResponse(res, 500, { ok: false, error: err instanceof Error ? err.message : String(err) }, origin);
  }
}

async function handleTaskRun(req, res, origin, taskId) {
  try {
    const body = await readJsonBody(req).catch(() => ({}));
    const actor = typeof body.actor === 'string' ? body.actor : 'backend-admin';
    let tasks = readTaskCache();
    let task = getTask(tasks, taskId);
    if (!task) {
      jsonResponse(res, 404, { ok: false, error: 'task not found', taskId }, origin);
      return;
    }
    const auto = autoApproveSet();
    if (task.status === 'pending_review' && auto.has(task.nextAction)) {
      task = transition(task, 'approved', actor, '白名單動作自動核准');
      const approveAuditId = appendAudit({
        action: 'task.approved',
        status: 'success',
        actor,
        taskId: task.id,
        request: '白名單動作自動核准',
      });
      task = attachAuditId(task, approveAuditId);
      tasks = upsertTask(tasks, task);
      writeTaskCache(tasks);
    }
    if (task.status !== 'approved') {
      jsonResponse(res, 409, {
        ok: false,
        error: `task is not approved (current: ${task.status})`,
        taskId,
      }, origin);
      return;
    }
    task = transition(task, 'running', actor, '開始執行');
    const runStartAuditId = appendAudit({
      action: 'task.running',
      status: 'running',
      actor,
      taskId: task.id,
      command: TASKS[task.nextAction]?.command || task.nextAction,
    });
    task = attachAuditId(task, runStartAuditId);
    tasks = upsertTask(tasks, task);
    writeTaskCache(tasks);

    const runnerTask = TASKS[task.nextAction];
    if (!runnerTask || runnerTask.key === 'status') {
      task = transition(task, 'failed', actor, '非可執行動作（manual 或 status 不會跑腳本）');
      const failedAuditId = appendAudit({
        action: 'task.failed',
        status: 'failed',
        actor,
        taskId: task.id,
        stderrTail: `nextAction=${task.nextAction} 不會執行腳本`,
      });
      task = attachAuditId(task, failedAuditId);
      tasks = upsertTask(tasks, task);
      const excelResultFail = await syncTaskToExcelSafe(task, actor);
      if (excelResultFail.ok && excelResultFail.excelRowRef) {
        task = { ...task, excelRowRef: excelResultFail.excelRowRef };
      }
      writeTaskCache(upsertTask(tasks, task));
      jsonResponse(res, 422, {
        ok: false,
        task,
        error: '此任務沒有可執行的白名單動作（需人工處理或重設 nextAction）。',
      }, origin);
      return;
    }

    const exec = await executeTask(runnerTask, task.requestText);
    const finishStatus = exec.body.ok ? 'done' : 'failed';
    task = transition(task, finishStatus, actor, exec.body.message || `${runnerTask.label}${exec.body.ok ? '完成' : '失敗'}`);
    const finishAuditId = appendAudit({
      action: finishStatus === 'done' ? 'task.done' : 'task.failed',
      status: finishStatus === 'done' ? 'success' : 'failed',
      actor,
      taskId: task.id,
      command: runnerTask.command,
      durationMs: exec.body.durationMs,
      exitCode: exec.body.exitCode,
      outputFiles: exec.body.outputFiles || [],
      stdoutTail: exec.body.stdoutTail,
      stderrTail: exec.body.stderrTail,
    });
    task = attachAuditId(task, finishAuditId);
    tasks = upsertTask(tasks, task);
    const excelResult = await syncTaskToExcelSafe(task, actor);
    if (excelResult.ok && excelResult.excelRowRef) {
      task = { ...task, excelRowRef: excelResult.excelRowRef };
    }
    writeTaskCache(upsertTask(tasks, task));

    jsonResponse(res, exec.statusCode, {
      ok: exec.body.ok,
      task,
      execution: exec.body,
      excelSync: excelResult,
    }, origin);
  } catch (err) {
    jsonResponse(res, 500, { ok: false, error: err instanceof Error ? err.message : String(err) }, origin);
  }
}

async function handleTaskPatch(req, res, origin, taskId) {
  try {
    const body = await readJsonBody(req).catch(() => ({}));
    const actor = typeof body.actor === 'string' ? body.actor : 'backend-admin';
    const tasks = readTaskCache();
    const task = getTask(tasks, taskId);
    if (!task) {
      jsonResponse(res, 404, { ok: false, error: 'task not found', taskId }, origin);
      return;
    }
    let updated;
    try {
      updated = updateTask(task, body.patch || {}, actor);
    } catch (err) {
      jsonResponse(res, 400, { ok: false, error: err.message }, origin);
      return;
    }
    const auditId = appendAudit({
      action: 'task.updated',
      status: 'success',
      actor,
      taskId: updated.id,
      request: normalizeOutput(JSON.stringify(body.patch || {}), 500),
    });
    updated = attachAuditId(updated, auditId);
    const excelResult = await syncTaskToExcelSafe(updated, actor);
    if (excelResult.ok && excelResult.excelRowRef) {
      updated = { ...updated, excelRowRef: excelResult.excelRowRef };
    }
    writeTaskCache(upsertTask(tasks, updated));
    jsonResponse(res, 200, { ok: true, task: updated, excelSync: excelResult }, origin);
  } catch (err) {
    jsonResponse(res, 500, { ok: false, error: err instanceof Error ? err.message : String(err) }, origin);
  }
}

function mergeExcelTaskIntoCache(excelTask, cacheTask, actor) {
  if (!cacheTask) return excelTask;
  const now = excelTask.updatedAt || cacheTask.updatedAt;
  const fieldsFromExcel = ['title', 'category', 'priority', 'status', 'nextAction', 'needsApproval', 'requestText', 'summary', 'actor'];
  const patch = {};
  const changed = [];
  for (const key of fieldsFromExcel) {
    if (excelTask[key] !== undefined && excelTask[key] !== cacheTask[key]) {
      patch[key] = excelTask[key];
      changed.push(key);
    }
  }
  if (changed.length === 0) return cacheTask;
  const noteParts = changed.map((k) => `${k}: ${JSON.stringify(cacheTask[k])} → ${JSON.stringify(patch[k])}`);
  return {
    ...cacheTask,
    ...patch,
    updatedAt: now,
    history: [
      ...(cacheTask.history || []),
      {
        at: now,
        from: cacheTask.status,
        to: patch.status || cacheTask.status,
        actor: actor || 'excel-import',
        note: `Excel 同步：${noteParts.join('; ')}`,
      },
    ],
  };
}

async function handleRefreshFromExcel(req, res, origin) {
  try {
    const body = await readJsonBody(req).catch(() => ({}));
    const actor = typeof body.actor === 'string' ? body.actor : 'backend-admin';
    const mod = await import('./agent/excel-sync.mjs').catch((err) => {
      throw new Error(`excel-sync 模組未就緒：${err.message}`);
    });
    const result = await mod.readTasksFromExcel({
      configPath: CONFIG_PATH,
      sheetName: CONFIG.task.excelSheet,
    });
    if (!result.ok) {
      appendAudit({
        action: 'task.refreshed-from-excel',
        status: 'failed',
        actor,
        stderrTail: normalizeOutput(result.error || '', 500),
      });
      jsonResponse(res, 500, { ok: false, error: result.error }, origin);
      return;
    }
    const tasks = readTaskCache();
    let merged = tasks;
    let updatedCount = 0;
    let addedCount = 0;
    for (const excelTask of result.entries) {
      const existing = getTask(merged, excelTask.id);
      if (existing) {
        const next = mergeExcelTaskIntoCache(excelTask, existing, actor);
        if (next !== existing) {
          merged = upsertTask(merged, next);
          updatedCount += 1;
        }
      } else {
        merged = upsertTask(merged, excelTask);
        addedCount += 1;
      }
    }
    writeTaskCache(merged);
    const auditId = appendAudit({
      action: 'task.refreshed-from-excel',
      status: 'success',
      actor,
      stdoutTail: `imported=${result.entries.length} updated=${updatedCount} added=${addedCount}`,
    });
    jsonResponse(res, 200, {
      ok: true,
      imported: result.entries.length,
      updated: updatedCount,
      added: addedCount,
      auditId,
      counts: countByStatus(merged),
    }, origin);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    appendAudit({
      action: 'task.refreshed-from-excel',
      status: 'failed',
      actor: 'backend-admin',
      stderrTail: normalizeOutput(message, 500),
    });
    jsonResponse(res, 500, { ok: false, error: message }, origin);
  }
}

const server = createServer(async (req, res) => {
  const origin = req.headers.origin || '';
  const url = new URL(req.url || '/', `http://${HOST}:${PORT}`);

  if (req.method === 'OPTIONS') {
    optionsResponse(res, origin);
    return;
  }

  if (origin && !allowedOrigins.has(origin)) {
    jsonResponse(res, 403, { ok: false, error: 'origin not allowed' });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/health') {
    jsonResponse(res, 200, {
      ok: true,
      name: 'ifare-ai-maintenance-runner',
      host: HOST,
      port: PORT,
      running: isRunning,
      repoRoot: REPO_ROOT,
      time: nowLocal(),
      availableTasks: availableTasks(),
    }, origin);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/audit') {
    const limit = Math.min(Number.parseInt(url.searchParams.get('limit') || '30', 10) || 30, 100);
    jsonResponse(res, 200, {
      ok: true,
      entries: readAuditEntries(limit),
    }, origin);
    return;
  }

  if (req.method === 'POST' && url.pathname === '/run-report') {
    await handleRunReport(res, origin);
    return;
  }

  if (req.method === 'POST' && url.pathname === '/agent-task') {
    await handleAgentTask(req, res, origin);
    return;
  }

  if (req.method === 'POST' && url.pathname === '/agent/intake') {
    await handleTaskIntake(req, res, origin);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/agent/tasks') {
    handleTaskList(url, res, origin);
    return;
  }

  if (req.method === 'POST' && url.pathname === '/agent/tasks/refresh-from-excel') {
    await handleRefreshFromExcel(req, res, origin);
    return;
  }

  const taskActionMatch = url.pathname.match(/^\/agent\/tasks\/([^/]+)\/(approve|run|block)$/);
  if (req.method === 'POST' && taskActionMatch) {
    const [, taskId, action] = taskActionMatch;
    if (action === 'approve') await handleTaskApprove(req, res, origin, taskId);
    else if (action === 'run') await handleTaskRun(req, res, origin, taskId);
    else if (action === 'block') await handleTaskBlock(req, res, origin, taskId);
    return;
  }

  const taskIdMatch = url.pathname.match(/^\/agent\/tasks\/([^/]+)$/);
  if (taskIdMatch) {
    const taskId = taskIdMatch[1];
    if (req.method === 'GET') {
      handleTaskGet(taskId, res, origin);
      return;
    }
    if (req.method === 'PATCH') {
      await handleTaskPatch(req, res, origin, taskId);
      return;
    }
  }

  jsonResponse(res, 404, {
    ok: false,
    error: 'not found',
    endpoints: [
      'GET /health',
      'GET /audit?limit=30',
      'POST /run-report',
      'POST /agent-task',
      'POST /agent/intake',
      'GET /agent/tasks',
      'GET /agent/tasks/:id',
      'PATCH /agent/tasks/:id',
      'POST /agent/tasks/:id/approve',
      'POST /agent/tasks/:id/run',
      'POST /agent/tasks/:id/block',
      'POST /agent/tasks/refresh-from-excel',
    ],
  }, origin);
});

server.listen(PORT, HOST, () => {
  console.log(`[ai-maintenance-runner] listening on http://${HOST}:${PORT}`);
  console.log('[ai-maintenance-runner] legacy endpoints: GET /health, GET /audit, POST /run-report, POST /agent-task');
  console.log('[ai-maintenance-runner] task endpoints: POST /agent/intake, GET /agent/tasks, GET|PATCH /agent/tasks/:id,');
  console.log('[ai-maintenance-runner]                 POST /agent/tasks/:id/{approve,run,block}, POST /agent/tasks/refresh-from-excel');
});
