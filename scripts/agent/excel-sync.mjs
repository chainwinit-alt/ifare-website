/**
 * excel-sync.mjs — task ↔ Excel bridge for AI maintenance.
 *
 * Reads/writes a dedicated workbook `docs/iFare_AI任務看板.xlsx` (path configurable
 * via agent.config.json → task.excelFile). The main tracking workbook
 * (iFare_問題追蹤與AI維運規劃.xlsx) is intentionally left untouched so the user's
 * hand-edited sheets are never re-serialised.
 *
 * Uses the pure `xlsx` package (NOT `xlsx-js-style`) which avoids the theme1.xml
 * bloat that has historically grown the main file to 13–26 MB. We never write
 * cell styles — only values.
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
  unlinkSync,
  openSync,
  closeSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import XLSX from 'xlsx';

import {
  STATUSES,
  CATEGORIES,
  PRIORITIES,
  NEXT_ACTIONS,
  SOURCES,
} from './task-state-machine.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');

const HEADERS = [
  'task_id',
  'title',
  'category',
  'priority',
  'status',
  'source',
  'needsApproval',
  'nextAction',
  'requestText',
  'summary',
  'createdAt',
  'updatedAt',
  'actor',
  'excelSyncedAt',
];

const COLUMN_INDEX = Object.fromEntries(HEADERS.map((h, i) => [h, i]));

function nowLocal() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function resolveRepoPath(p) {
  return path.isAbsolute(p) ? path.normalize(p) : path.resolve(REPO_ROOT, p);
}

function readConfig(configPath) {
  if (!existsSync(configPath)) {
    throw new Error(`agent.config.json not found at ${configPath}`);
  }
  return JSON.parse(readFileSync(configPath, 'utf8'));
}

function resolveTaskFile(config) {
  const rel = config?.task?.excelFile;
  if (!rel) throw new Error('config.task.excelFile is missing');
  return resolveRepoPath(rel);
}

function readOrCreateWorkbook(filePath) {
  if (existsSync(filePath)) {
    return XLSX.readFile(filePath, { cellStyles: false, bookVBA: false });
  }
  const wb = XLSX.utils.book_new();
  return wb;
}

async function withFileLock(lockPath, op, { retries = 3, retryDelayMs = 200 } = {}) {
  if (!lockPath) return op();
  mkdirSync(path.dirname(lockPath), { recursive: true });
  let lastErr;
  for (let attempt = 0; attempt < retries; attempt += 1) {
    let fd;
    try {
      fd = openSync(lockPath, 'wx');
    } catch (err) {
      if (err.code === 'EEXIST') {
        lastErr = err;
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
        continue;
      }
      throw err;
    }
    try {
      return await op();
    } finally {
      closeSync(fd);
      try { unlinkSync(lockPath); } catch { /* ignore */ }
    }
  }
  throw new Error(`could not acquire excel-sync lock: ${lastErr?.message || 'busy'}`);
}

function ensureSheet(workbook, sheetName) {
  if (workbook.SheetNames.includes(sheetName)) {
    const sheet = workbook.Sheets[sheetName];
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
    const headerCell = sheet[XLSX.utils.encode_cell({ r: 0, c: 0 })];
    if (!headerCell || headerCell.v !== HEADERS[0] || range.e.c < HEADERS.length - 1) {
      XLSX.utils.sheet_add_aoa(sheet, [HEADERS], { origin: 'A1' });
    }
    return sheet;
  }
  const sheet = XLSX.utils.aoa_to_sheet([HEADERS]);
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  return sheet;
}

function sheetToRows(sheet) {
  if (!sheet) return [];
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });
  return rows;
}

function findRowIndex(rows, taskId) {
  for (let i = 1; i < rows.length; i += 1) {
    if (rows[i] && rows[i][COLUMN_INDEX.task_id] === taskId) return i;
  }
  return -1;
}

function taskToRow(task) {
  return [
    task.id,
    task.title,
    task.category,
    task.priority,
    task.status,
    task.source,
    task.needsApproval ? 'TRUE' : 'FALSE',
    task.nextAction,
    task.requestText || '',
    task.summary || '',
    task.createdAt,
    task.updatedAt,
    task.actor || '',
    nowLocal(),
  ];
}

function normalizeCell(value) {
  if (value == null) return '';
  return String(value).trim();
}

function rowToTaskCandidate(row, sheetName, rowIndex) {
  const get = (key) => normalizeCell(row[COLUMN_INDEX[key]]);
  const id = get('task_id');
  if (!id) return null;
  const status = STATUSES.includes(get('status')) ? get('status') : 'blocked';
  const category = CATEGORIES.includes(get('category')) ? get('category') : 'meta';
  const priority = PRIORITIES.includes(get('priority')) ? get('priority') : 'medium';
  const nextAction = NEXT_ACTIONS.includes(get('nextAction')) ? get('nextAction') : 'manual';
  const source = SOURCES.includes(get('source')) ? get('source') : 'manual';
  const needsApprovalRaw = get('needsApproval').toUpperCase();
  const needsApproval = needsApprovalRaw === 'FALSE' ? false : true;
  const now = nowLocal();
  const createdAt = get('createdAt') || now;
  const updatedAt = get('updatedAt') || now;
  return {
    id,
    title: get('title') || '未命名任務',
    source,
    category,
    priority,
    status,
    requestText: get('requestText'),
    summary: get('summary'),
    nextAction,
    needsApproval,
    syncToExcel: true,
    excelRowRef: { sheet: sheetName, rowIndex },
    auditIds: [],
    actor: get('actor') || 'backend-admin',
    createdAt,
    updatedAt,
    history: [
      {
        at: now,
        from: null,
        to: status,
        actor: 'excel-import',
        note: '由 Excel 重新整理載入',
      },
    ],
  };
}

export async function writeTaskToExcel(task, options) {
  const config = readConfig(options.configPath);
  const taskFile = resolveTaskFile(config);
  const sheetName = options.sheetName || config?.task?.excelSheet || 'tasks';
  const maxBytes = (options.maxSizeMB || config?.task?.maxExcelSizeMB || 5) * 1024 * 1024;
  const lockFile = options.lockFile;

  return withFileLock(lockFile, async () => {
    mkdirSync(path.dirname(taskFile), { recursive: true });
    const sizeBefore = existsSync(taskFile) ? statSync(taskFile).size : 0;
    const workbook = readOrCreateWorkbook(taskFile);
    const sheet = ensureSheet(workbook, sheetName);
    const rows = sheetToRows(sheet);
    if (rows.length === 0) rows.push(HEADERS);

    const existingIdx = findRowIndex(rows, task.id);
    const newRow = taskToRow(task);
    let targetIndex;
    if (existingIdx === -1) {
      rows.push(newRow);
      targetIndex = rows.length - 1;
    } else {
      rows[existingIdx] = newRow;
      targetIndex = existingIdx;
    }

    const newSheet = XLSX.utils.aoa_to_sheet(rows);
    workbook.Sheets[sheetName] = newSheet;
    XLSX.writeFile(workbook, taskFile, { bookSST: true, compression: true });

    const sizeAfter = statSync(taskFile).size;
    const oversized = sizeAfter > maxBytes;

    return {
      ok: true,
      skipped: false,
      excelRowRef: { sheet: sheetName, rowIndex: targetIndex },
      sizeBefore,
      sizeAfter,
      oversized,
    };
  });
}

export async function readTasksFromExcel(options) {
  const config = readConfig(options.configPath);
  const taskFile = resolveTaskFile(config);
  const sheetName = options.sheetName || config?.task?.excelSheet || 'tasks';

  if (!existsSync(taskFile)) {
    return { ok: true, entries: [], note: 'task xlsx not present yet' };
  }

  try {
    const workbook = XLSX.readFile(taskFile, { cellStyles: false, bookVBA: false });
    if (!workbook.SheetNames.includes(sheetName)) {
      return { ok: true, entries: [], note: 'sheet not present yet' };
    }
    const rows = sheetToRows(workbook.Sheets[sheetName]);
    const entries = [];
    for (let i = 1; i < rows.length; i += 1) {
      const candidate = rowToTaskCandidate(rows[i], sheetName, i);
      if (candidate) entries.push(candidate);
    }
    return { ok: true, entries };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
