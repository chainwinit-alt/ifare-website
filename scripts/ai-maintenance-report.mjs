#!/usr/bin/env node
/**
 * ai-maintenance-report.mjs - iFare AI 維運助理 MVP CLI（階段一）
 *
 * 用途：產出每日維護報告到 docs/ai-agent-reports/YYYY-MM-DD.md
 *
 * 設計原則：
 *   - read-only：只讀 xlsx / git log / docs；不寫回 xlsx、不改 code、不 commit
 *   - 規則式：不打 LLM API，純規則統計（後續再加 LLM 摘要）
 *   - 跨平台：Windows / macOS 都能跑（路徑用 path.resolve）
 *   - 不打外部：不對 i-fare.org.tw / API / DB 發任何 request
 *
 * 用法：
 *   npm run agent:report
 *   npm run agent:report:dry
 *   node scripts/ai-maintenance-report.mjs --since=14
 *
 * 對應規劃文件：docs/AI_AGENT_MAINTENANCE_PLAN.md §3 階段一
 * 驗收標準：docs/AI_AGENT_MAINTENANCE_PLAN.md §8 PoC 驗收
 */

import XLSX from 'xlsx-js-style';
import { execFileSync } from 'node:child_process';
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(REPO_ROOT, 'docs', 'agent.config.json');

const DEFAULT_CONFIG = {
  version: 1,
  agentVersion: '1.0.0-mvp',
  report: {
    outputDir: 'docs/ai-agent-reports',
    backendPublicJson: 'Dev/Dev Code/iFare_Backend/public/agent/latest-report.json',
    backendAuditJson: 'Dev/Dev Code/iFare_Backend/public/agent/audit-latest.json',
    filenamePattern: 'YYYY-MM-DD.md',
    wordFilenamePattern: 'YYYY-MM-DD.docx',
    retentionDays: 90,
  },
  audit: {
    logFile: 'docs/ai-agent-reports/_audit.jsonl',
    backendPublicJson: 'Dev/Dev Code/iFare_Backend/public/agent/audit-latest.json',
    maxPublicEntries: 30,
  },
  readPaths: ['docs/**/*.md', 'docs/**/*.xlsx', 'scripts/**/*.mjs'],
  denyPaths: [
    '.env',
    '.env.*',
    '**/.env',
    '**/.env.*',
    '**/appsettings*.json',
    '**/secrets/**',
    '**/*.key',
    '**/*.pem',
    '**/node_modules/**',
  ],
  git: {
    logSinceDays: 7,
    ignorePaths: ['*.lock', 'node_modules/**', '.nuxt/**', '.output/**', 'dist/**'],
  },
  xlsx: {
    trackingFile: 'docs/iFare_問題追蹤與AI維運規劃.xlsx',
    sheets: ['後臺優化', 'UIUX問題追蹤清單', 'PoC研究', '統計摘要'],
  },
};

const XLSX_COLS = {
  backend: { id: 0, area: 2, sub: 3, cat: 5, pri: 6, title: 7, status: 13 },
  uiux: { id: 0, area: 2, sub: 3, cat: 5, pri: 6, title: 7, status: 13 },
  poc: { id: 0, area: 2, sub: 3, pri: 6, title: 7, status: 13 },
};

function readConfig() {
  if (!existsSync(CONFIG_PATH)) return normalizeConfig(DEFAULT_CONFIG);

  const raw = readFileSync(CONFIG_PATH, 'utf8');
  const parsed = JSON.parse(raw);
  return normalizeConfig({
    ...DEFAULT_CONFIG,
    ...parsed,
    report: { ...DEFAULT_CONFIG.report, ...(parsed.report ?? {}) },
    git: { ...DEFAULT_CONFIG.git, ...(parsed.git ?? {}) },
    xlsx: { ...DEFAULT_CONFIG.xlsx, ...(parsed.xlsx ?? {}) },
  });
}

function normalizeConfig(config) {
  return {
    ...config,
    agentVersion: config.agentVersion ?? DEFAULT_CONFIG.agentVersion,
    report: {
      ...config.report,
      outputDir: resolveRepoPath(config.report.outputDir),
      backendPublicJson: config.report.backendPublicJson ? resolveRepoPath(config.report.backendPublicJson) : null,
      backendAuditJson: config.report.backendAuditJson ? resolveRepoPath(config.report.backendAuditJson) : null,
    },
    audit: {
      ...DEFAULT_CONFIG.audit,
      ...(config.audit ?? {}),
      logFile: resolveRepoPath(config.audit?.logFile ?? DEFAULT_CONFIG.audit.logFile),
      backendPublicJson: config.audit?.backendPublicJson ? resolveRepoPath(config.audit.backendPublicJson) : null,
    },
    xlsx: {
      ...config.xlsx,
      trackingFile: resolveRepoPath(config.xlsx.trackingFile),
    },
    readPaths: config.readPaths ?? DEFAULT_CONFIG.readPaths,
    denyPaths: config.denyPaths ?? DEFAULT_CONFIG.denyPaths,
    denyMatchers: compileMatchers(config.denyPaths ?? DEFAULT_CONFIG.denyPaths),
    gitIgnoreMatchers: compileMatchers(config.git?.ignorePaths ?? DEFAULT_CONFIG.git.ignorePaths),
  };
}

const CONFIG = readConfig();

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const sinceArg = args.find((a) => a.startsWith('--since='));
const sinceDays = sinceArg ? parsePositiveInt(sinceArg.split('=')[1], CONFIG.git.logSinceDays) : CONFIG.git.logSinceDays;

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

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeRelPath(p) {
  const abs = resolveRepoPath(p);
  const rel = path.relative(REPO_ROOT, abs) || '.';
  if (rel.startsWith('..') || path.isAbsolute(rel)) return abs.split(path.sep).join('/');
  return rel.split(path.sep).join('/');
}

function escapeRegExp(char) {
  return char.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}

function globToRegExp(glob) {
  const pattern = glob.split(path.sep).join('/');
  let re = '^';
  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];
    const next = pattern[i + 1];
    const afterNext = pattern[i + 2];

    if (char === '*' && next === '*' && afterNext === '/') {
      re += '(?:.*/)?';
      i += 2;
    } else if (char === '*' && next === '*') {
      re += '.*';
      i += 1;
    } else if (char === '*') {
      re += '[^/]*';
    } else if (char === '?') {
      re += '[^/]';
    } else {
      re += escapeRegExp(char);
    }
  }
  re += '$';
  return new RegExp(re, 'i');
}

function compileMatchers(patterns) {
  return patterns.map((pattern) => globToRegExp(pattern));
}

function matchesAny(relPath, matchers) {
  const normalized = relPath.split(path.sep).join('/');
  return matchers.some((matcher) => matcher.test(normalized));
}

function isDenied(p) {
  return matchesAny(normalizeRelPath(p), CONFIG.denyMatchers);
}

function isGitIgnored(p) {
  return matchesAny(normalizeRelPath(p), CONFIG.gitIgnoreMatchers);
}

function redactSecrets(value) {
  return String(value)
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [REDACTED]')
    .replace(/\b(password|passwd|token|secret|api[_-]?key|securitykey)\s*[:=]\s*([^\s;,'"]+)/gi, '$1=[REDACTED]')
    .replace(/\b[A-Za-z0-9+/=_-]{40,}\b/g, '[REDACTED]');
}

function clean(value, maxLen = 80) {
  if (value === null || value === undefined) return '';
  return redactSecrets(value).replace(/[\r\n]+/g, ' ').replace(/\|/g, '/').trim().slice(0, maxLen);
}

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function nowLocal() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function runCommand(command, commandArgs) {
  try {
    const stdout = execFileSync(command, commandArgs, {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    return { ok: true, stdout };
  } catch (err) {
    const stderr = err?.stderr ? String(err.stderr) : '';
    return {
      ok: false,
      stdout: '',
      error: clean(stderr || err?.message || `執行 ${command} 失敗`, 180),
    };
  }
}

function readAuditEntries(limit = 30) {
  if (!existsSync(CONFIG.audit.logFile)) return [];
  return readFileSync(CONFIG.audit.logFile, 'utf8')
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
  if (!CONFIG.audit.backendPublicJson) return;
  const entries = readAuditEntries(CONFIG.audit.maxPublicEntries || 30);
  mkdirSync(path.dirname(CONFIG.audit.backendPublicJson), { recursive: true });
  writeFileSync(CONFIG.audit.backendPublicJson, `${JSON.stringify({ generatedAt: nowLocal(), entries }, null, 2)}\n`, 'utf8');
}

function appendAudit(entry) {
  mkdirSync(path.dirname(CONFIG.audit.logFile), { recursive: true });
  appendFileSync(CONFIG.audit.logFile, `${JSON.stringify({
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    timestamp: nowLocal(),
    actor: process.env.USERNAME || process.env.USER || 'local-user',
    source: 'agent-cli',
    ...entry,
  })}\n`, 'utf8');
  syncPublicAudit();
}

function collectGitLog() {
  const result = runCommand('git', [
    'log',
    `--since=${sinceDays} days ago`,
    '--date=short',
    '--pretty=format:%H|%an|%ad|%s',
  ]);

  if (!result.ok) {
    return { commits: [], totalCount: 0, error: result.error };
  }

  const commits = result.stdout
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [hash, author, date, ...rest] = line.split('|');
      return {
        hash: hash.slice(0, 7),
        author: clean(author, 40),
        date: clean(date, 12),
        subject: clean(rest.join('|'), 100),
      };
    });

  return { commits, totalCount: commits.length, error: null };
}

function collectChangedFiles() {
  const result = runCommand('git', ['log', `--since=${sinceDays} days ago`, '--name-only', '--pretty=format:']);
  if (!result.ok) return { files: [], deniedCount: 0, error: result.error };

  const files = new Set();
  let deniedCount = 0;
  for (const line of result.stdout.split('\n')) {
    const file = line.trim();
    if (!file) continue;
    if (isDenied(file)) {
      deniedCount++;
      continue;
    }
    if (isGitIgnored(file)) continue;
    files.add(file);
  }

  return { files: Array.from(files).sort(), deniedCount, error: null };
}

function collectGitState() {
  const branch = runCommand('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
  const status = runCommand('git', ['status', '--porcelain']);
  const errors = [];
  if (!branch.ok) errors.push(`branch: ${branch.error}`);
  if (!status.ok) errors.push(`status: ${status.error}`);

  const dirtyLines = status.ok
    ? status.stdout
        .split('\n')
        .filter(Boolean)
        .filter((line) => {
          const file = line.slice(3).replace(/^"|"$/g, '');
          return !isDenied(file) && !isGitIgnored(file);
        })
    : [];

  return {
    branchName: branch.ok ? branch.stdout.trim() : 'unknown',
    dirtyLines,
    errors,
  };
}

function readSheetRows(ws) {
  if (!ws?.['!ref']) return [];
  const range = XLSX.utils.decode_range(ws['!ref']);
  const rows = [];
  for (let r = 2; r <= range.e.r; r++) rows.push(r);
  return rows;
}

function collectXlsxStats() {
  if (!existsSync(CONFIG.xlsx.trackingFile)) {
    return { error: `xlsx 不存在：${normalizeRelPath(CONFIG.xlsx.trackingFile)}` };
  }

  const wb = XLSX.readFile(CONFIG.xlsx.trackingFile, { cellStyles: false });
  const sheetStatus = CONFIG.xlsx.sheets.map((name) => ({ name, exists: Boolean(wb.Sheets[name]?.['!ref']) }));
  const result = {
    sheetStatus,
    backend: { total: 0, done: 0, partial: 0, pending: 0, highPending: [] },
    uiux: { total: 0, done: 0, partial: 0, pending: 0 },
    poc: { total: 0, done: 0, partial: 0, pending: 0, highPending: [] },
  };

  const backendSheet = wb.Sheets['後臺優化'];
  if (backendSheet?.['!ref']) {
    const C = XLSX_COLS.backend;
    for (const r of readSheetRows(backendSheet)) {
      const get = (c) => backendSheet[XLSX.utils.encode_cell({ r, c })]?.v ?? '';
      const status = String(get(C.status)).trim();
      if (!status) continue;
      result.backend.total++;
      if (status === '已修正') result.backend.done++;
      else if (status === '部分修正') result.backend.partial++;
      else if (status === '待處理') {
        result.backend.pending++;
        if (String(get(C.pri)).trim() === '高') {
          result.backend.highPending.push({
            id: clean(get(C.id), 8),
            area: clean(get(C.area), 20),
            sub: clean(get(C.sub), 20),
            cat: clean(get(C.cat), 12),
            title: clean(get(C.title), 60),
          });
        }
      }
    }
  }

  const uiuxSheet = wb.Sheets['UIUX問題追蹤清單'];
  if (uiuxSheet?.['!ref']) {
    const C = XLSX_COLS.uiux;
    for (const r of readSheetRows(uiuxSheet)) {
      const status = String(uiuxSheet[XLSX.utils.encode_cell({ r, c: C.status })]?.v ?? '').trim();
      if (!status) continue;
      result.uiux.total++;
      if (status === '已修正') result.uiux.done++;
      else if (status === '部分修正') result.uiux.partial++;
      else if (status === '待處理') result.uiux.pending++;
    }
  }

  const pocSheet = wb.Sheets['PoC研究'];
  if (pocSheet?.['!ref']) {
    const C = XLSX_COLS.poc;
    for (const r of readSheetRows(pocSheet)) {
      const get = (c) => pocSheet[XLSX.utils.encode_cell({ r, c })]?.v ?? '';
      const status = String(get(C.status)).trim();
      if (!status) continue;
      result.poc.total++;
      if (status === '已修正') result.poc.done++;
      else if (status === '部分修正') result.poc.partial++;
      else if (status === '待處理') {
        result.poc.pending++;
        if (String(get(C.pri)).trim() === '高') {
          result.poc.highPending.push({
            id: clean(get(C.id), 8),
            area: clean(get(C.area), 20),
            sub: clean(get(C.sub), 20),
            title: clean(get(C.title), 60),
          });
        }
      }
    }
  }

  return result;
}

function collectDocsIndex() {
  const docsRoot = path.join(REPO_ROOT, 'docs');
  if (!existsSync(docsRoot)) return { files: [], deniedCount: 0, skippedLargeCount: 0 };

  const files = [];
  let deniedCount = 0;
  let skippedLargeCount = 0;
  const maxFileBytes = 5 * 1024 * 1024;

  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const rel = normalizeRelPath(full);
      if (isDenied(rel)) {
        deniedCount++;
        continue;
      }
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
      const st = statSync(full);
      if (st.size > maxFileBytes) {
        skippedLargeCount++;
        continue;
      }
      files.push({
        name: rel,
        sizeKB: Math.round(st.size / 1024),
        mtime: st.mtime.toISOString().slice(0, 10),
      });
    }
  }

  walk(docsRoot);
  files.sort((a, b) => a.name.localeCompare(b.name));
  return { files, deniedCount, skippedLargeCount };
}

function renderReport({ gitLog, changedFiles, gitState, xlsxStats, docsIndex, denySkipCount, outputFile, taskSummary }) {
  const lines = [];
  const date = today();
  const dirtyLines = [...gitState.dirtyLines];

  if (outputFile) {
    const outputRel = normalizeRelPath(outputFile);
    const alreadyListed = dirtyLines.some((line) => line.includes(outputRel));
    if (!alreadyListed) dirtyLines.push(`M ${outputRel} (本次 report 產生)`);
  }

  lines.push(`# iFare 維護報告 ${date}`);
  lines.push('');
  lines.push(`> 自動產生於 ${nowLocal()}；本報告 **read-only**，不修改任何資料。`);
  lines.push('');

  lines.push('## 1. 近期完成（git log）');
  lines.push('');
  if (gitLog.error) {
    lines.push(`⚠️ git log 讀取失敗：${gitLog.error}`);
  } else if (gitLog.commits.length === 0) {
    lines.push(`過去 ${sinceDays} 天沒有 commit 紀錄。`);
  } else {
    lines.push(`過去 ${sinceDays} 天共 **${gitLog.totalCount}** 個 commit：`);
    lines.push('');
    for (const c of gitLog.commits.slice(0, 30)) {
      lines.push(`- \`${c.hash}\` (${c.date} ${c.author}) — ${c.subject}`);
    }
    if (gitLog.commits.length > 30) {
      lines.push(`- _...還有 ${gitLog.commits.length - 30} 個 commit_`);
    }
  }
  lines.push('');

  lines.push('## 2. 進行中');
  lines.push('');
  lines.push(`目前所在分支：\`${gitState.branchName}\``);
  if (gitState.errors.length > 0) {
    lines.push(`⚠️ git 狀態讀取警告：${gitState.errors.join('；')}`);
  }
  if (dirtyLines.length === 0) {
    lines.push('Working tree 乾淨。');
  } else {
    lines.push(`Working tree 有 **${dirtyLines.length}** 個未 commit 異動：`);
    lines.push('');
    for (const dirtyLine of dirtyLines.slice(0, 30)) {
      lines.push(`- ${clean(dirtyLine, 140)}`);
    }
    if (dirtyLines.length > 30) {
      lines.push(`- _...還有 ${dirtyLines.length - 30} 個檔案_`);
    }
  }
  lines.push('');

  lines.push('## 3. 待處理重點');
  lines.push('');
  if (xlsxStats.error) {
    lines.push(`⚠️ ${xlsxStats.error}`);
  } else {
    const missingSheets = xlsxStats.sheetStatus.filter((sheet) => !sheet.exists);
    if (missingSheets.length > 0) {
      lines.push(`⚠️ xlsx 缺少 sheet：${missingSheets.map((sheet) => sheet.name).join('、')}`);
      lines.push('');
    }

    const { backend, uiux, poc } = xlsxStats;
    lines.push('| Sheet | 總計 | 已修正 | 部分修正 | 待處理 |');
    lines.push('|---|---:|---:|---:|---:|');
    lines.push(`| 後臺優化 | ${backend.total} | ${backend.done} | ${backend.partial} | **${backend.pending}** |`);
    lines.push(`| UIUX 問題追蹤 | ${uiux.total} | ${uiux.done} | ${uiux.partial} | **${uiux.pending}** |`);
    lines.push(`| PoC 研究 | ${poc.total} | ${poc.done} | ${poc.partial} | **${poc.pending}** |`);
    lines.push('');

    if (backend.highPending.length > 0) {
      lines.push(`### 後臺優化高優先 待處理（${backend.highPending.length} 項）`);
      lines.push('');
      lines.push('| # | 區塊 | 分類 | 標題 |');
      lines.push('|---|---|---|---|');
      for (const item of backend.highPending.slice(0, 20)) {
        lines.push(`| ${item.id} | ${item.area}/${item.sub} | ${item.cat} | ${item.title} |`);
      }
      if (backend.highPending.length > 20) {
        lines.push(`| ... | _還有 ${backend.highPending.length - 20} 項_ | | |`);
      }
      lines.push('');
    }

    if (poc.highPending.length > 0) {
      lines.push(`### PoC 高優先 待處理（${poc.highPending.length} 項）`);
      lines.push('');
      lines.push('| # | 區塊 | 標題 |');
      lines.push('|---|---|---|');
      for (const item of poc.highPending.slice(0, 10)) {
        lines.push(`| ${item.id} | ${item.area}/${item.sub} | ${item.title} |`);
      }
      lines.push('');
    }
  }

  lines.push('## 3.5 任務看板摘要（AI 維護中心收件匣）');
  lines.push('');
  if (!taskSummary || !taskSummary.available) {
    lines.push(`_${taskSummary?.reason || '尚未啟用任務工作台'}_`);
  } else {
    const counts = taskSummary.counts || {};
    lines.push(`目前任務總數：**${taskSummary.total}**（cache 產生於 ${taskSummary.generatedAt || '未知'}）`);
    lines.push('');
    lines.push('| 狀態 | 件數 |');
    lines.push('|---|---:|');
    const labels = {
      pending_review: '等核准',
      approved: '已核准',
      running: '執行中',
      done: '完成',
      failed: '失敗',
      blocked: '卡住',
      new: '新建',
      triaged: '已整理',
    };
    for (const key of ['pending_review', 'approved', 'running', 'done', 'failed', 'blocked', 'triaged', 'new']) {
      const v = counts[key] || 0;
      if (v > 0) lines.push(`| ${labels[key] || key} | ${v} |`);
    }
    lines.push('');
    if (Array.isArray(taskSummary.recent) && taskSummary.recent.length > 0) {
      lines.push('最近 10 筆任務：');
      lines.push('');
      lines.push('| ID | 標題 | 分類 | 優先級 | 狀態 | 更新時間 |');
      lines.push('|---|---|---|---|---|---|');
      for (const r of taskSummary.recent) {
        lines.push(`| ${r.id} | ${clean(r.title, 40)} | ${r.category} | ${r.priority} | ${r.status} | ${r.updatedAt} |`);
      }
      lines.push('');
    }
  }
  lines.push('');

  lines.push('## 4. 風險與異常');
  lines.push('');
  if (gitLog.error || changedFiles.error || gitState.errors.length > 0) {
    lines.push('- [agent] git 資訊讀取不完整，請確認本機可執行 `git`。');
  } else {
    lines.push('_（雛形版尚未實作自動掃描；後續階段三會加 build / type-check / hardcoded URL / v-html 掃描）_');
  }
  lines.push('');

  lines.push('## 5. 環境健康（Smoke Test 摘要）');
  lines.push('');
  lines.push('_（雛形版尚未串接；後續會讀後台 localStorage 的 Smoke Test 結果或 /Health/Smoke 頁紀錄）_');
  lines.push('');

  lines.push('## 6. 建議任務（可寫回 xlsx）');
  lines.push('');
  lines.push('_（雛形版尚未有建議規則；後續階段三會根據巡檢結果自動產生建議任務）_');
  lines.push('');

  lines.push('## 7. 不確定 / 需要決策');
  lines.push('');
  lines.push('- 請見 `docs/AI_AGENT_MAINTENANCE_PLAN.md` §13「待決問題」5 項，需主管 / 團隊回覆後才能進階段二。');
  lines.push('');

  lines.push('## 8. 元資料');
  lines.push('');
  lines.push(`- 報告產生時間：${nowLocal()}`);
  lines.push(`- Agent 版本：${CONFIG.agentVersion}`);
  lines.push(`- 設定檔：${normalizeRelPath(CONFIG_PATH)}`);
  lines.push(`- 報告產生主機：${process.platform} (Node ${process.version})`);
  lines.push(`- 讀取 docs/*.md：${docsIndex.files.length} 個`);
  lines.push(`- git 異動檔案數（過去 ${sinceDays} 天）：${changedFiles.files.length}`);
  lines.push(`- denyPaths 黑名單命中數：${denySkipCount}`);
  lines.push(`- 大檔略過數：${docsIndex.skippedLargeCount}`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('> 本報告由 `scripts/ai-maintenance-report.mjs` 產生；read-only，不會修改任何資料。');
  lines.push('> 規劃文件：[`docs/AI_AGENT_MAINTENANCE_PLAN.md`](./../AI_AGENT_MAINTENANCE_PLAN.md)');

  return lines.join('\n');
}

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date()) {
  const year = Math.max(date.getFullYear(), 1980);
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { dosTime, dosDate };
}

function createZip(files) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const { dosTime, dosDate } = dosDateTime();

  for (const file of files) {
    const name = Buffer.from(file.name, 'utf8');
    const data = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data, 'utf8');
    const crc = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(dosTime, 10);
    local.writeUInt16LE(dosDate, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    localParts.push(local, name, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(dosTime, 12);
    central.writeUInt16LE(dosDate, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, name);

    offset += local.length + name.length + data.length;
  }

  const centralOffset = offset;
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(centralOffset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, ...centralParts, end]);
}

function wordRun(text, bold = false) {
  const escaped = escapeXml(text);
  const parts = escaped.split('\n');
  const body = parts.map((part, index) => `${index > 0 ? '<w:br/>' : ''}<w:t xml:space="preserve">${part}</w:t>`).join('');
  return `<w:r>${bold ? '<w:rPr><w:b/></w:rPr>' : ''}${body}</w:r>`;
}

function wordParagraph(text, style = 'Normal', bold = false) {
  const pPr = style === 'Normal' ? '' : `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>`;
  return `<w:p>${pPr}${wordRun(text, bold)}</w:p>`;
}

function wordBullet(text) {
  return `<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr>${wordRun(text)}</w:p>`;
}

function wordTable(rows) {
  const body = rows
    .map((row, rowIndex) => {
      const cells = row
        .map((cell) => (
          `<w:tc><w:tcPr><w:tcW w:w="2400" w:type="dxa"/></w:tcPr>${wordParagraph(String(cell ?? ''), 'Normal', rowIndex === 0)}</w:tc>`
        ))
        .join('');
      return `<w:tr>${cells}</w:tr>`;
    })
    .join('');
  return `<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="0" w:type="auto"/><w:tblLook w:val="04A0"/></w:tblPr>${body}</w:tbl>`;
}

function renderDocxDocumentXml({ gitLog, changedFiles, gitState, xlsxStats, docsIndex, denySkipCount, markdownOutputFile, wordOutputFile }) {
  const parts = [];
  const date = today();
  const dirtyCount = gitState.dirtyLines.length + (markdownOutputFile ? 1 : 0) + (wordOutputFile ? 1 : 0);

  parts.push(wordParagraph(`iFare 維護報告 ${date}`, 'Title'));
  parts.push(wordParagraph(`產生時間：${nowLocal()}`));
  parts.push(wordParagraph(`分支：${gitState.branchName}`));
  parts.push(wordParagraph('主管摘要', 'Heading1'));
  parts.push(wordBullet(`過去 ${sinceDays} 天 commit 數：${gitLog.totalCount ?? 0}`));
  parts.push(wordBullet(`工作區未提交項目：${dirtyCount}`));
  parts.push(wordBullet(`git 異動檔案數：${changedFiles.files.length}`));
  parts.push(wordBullet(`文件掃描數：${docsIndex.files.length}`));
  parts.push(wordBullet(`安全黑名單略過數：${denySkipCount}`));

  parts.push(wordParagraph('待處理狀態', 'Heading1'));
  if (xlsxStats.error) {
    parts.push(wordParagraph(`Excel 讀取異常：${xlsxStats.error}`));
  } else {
    parts.push(wordTable([
      ['Sheet', '總計', '已修正', '部分修正', '待處理'],
      ['後臺優化', xlsxStats.backend.total, xlsxStats.backend.done, xlsxStats.backend.partial, xlsxStats.backend.pending],
      ['UIUX 問題追蹤', xlsxStats.uiux.total, xlsxStats.uiux.done, xlsxStats.uiux.partial, xlsxStats.uiux.pending],
      ['PoC 研究', xlsxStats.poc.total, xlsxStats.poc.done, xlsxStats.poc.partial, xlsxStats.poc.pending],
    ]));

    const backendHigh = xlsxStats.backend.highPending.slice(0, 12);
    if (backendHigh.length > 0) {
      parts.push(wordParagraph('後臺優化高優先待辦', 'Heading2'));
      parts.push(wordTable([
        ['#', '區塊', '分類', '標題'],
        ...backendHigh.map((item) => [item.id, `${item.area}/${item.sub}`, item.cat, item.title]),
      ]));
    }

    const pocHigh = xlsxStats.poc.highPending.slice(0, 8);
    if (pocHigh.length > 0) {
      parts.push(wordParagraph('PoC 高優先待辦', 'Heading2'));
      parts.push(wordTable([
        ['#', '區塊', '標題'],
        ...pocHigh.map((item) => [item.id, `${item.area}/${item.sub}`, item.title]),
      ]));
    }
  }

  parts.push(wordParagraph('近期 Commit', 'Heading1'));
  if (gitLog.error) {
    parts.push(wordParagraph(`git log 讀取失敗：${gitLog.error}`));
  } else if (gitLog.commits.length === 0) {
    parts.push(wordParagraph(`過去 ${sinceDays} 天沒有 commit。`));
  } else {
    for (const commit of gitLog.commits.slice(0, 12)) {
      parts.push(wordBullet(`${commit.date} ${commit.hash} ${commit.author} - ${commit.subject}`));
    }
  }

  parts.push(wordParagraph('產出檔案', 'Heading1'));
  if (wordOutputFile) parts.push(wordBullet(`Word 報告：${normalizeRelPath(wordOutputFile)}`));
  if (markdownOutputFile) parts.push(wordBullet(`Markdown 報告：${normalizeRelPath(markdownOutputFile)}`));
  if (CONFIG.report.backendPublicJson) parts.push(wordBullet(`後台摘要 JSON：${normalizeRelPath(CONFIG.report.backendPublicJson)}`));
  if (CONFIG.audit.backendPublicJson) parts.push(wordBullet(`後台 audit JSON：${normalizeRelPath(CONFIG.audit.backendPublicJson)}`));

  parts.push(wordParagraph('安全邊界', 'Heading1'));
  parts.push(wordBullet('本報告只讀取專案、Excel 與 git 資訊。'));
  parts.push(wordBullet('不寫回 Excel、不修改程式、不 commit、不 push、不部署、不呼叫正式站 API。'));

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${parts.join('\n')}
    <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
  </w:body>
</w:document>`;
}

function renderDocxStylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="120"/></w:pPr><w:rPr><w:rFonts w:ascii="Microsoft JhengHei" w:eastAsia="Microsoft JhengHei"/><w:sz w:val="22"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="240"/></w:pPr><w:rPr><w:b/><w:sz w:val="36"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:before="360" w:after="160"/></w:pPr><w:rPr><w:b/><w:sz w:val="28"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:before="240" w:after="120"/></w:pPr><w:rPr><w:b/><w:sz w:val="24"/></w:rPr></w:style>
  <w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4"/><w:left w:val="single" w:sz="4"/><w:bottom w:val="single" w:sz="4"/><w:right w:val="single" w:sz="4"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr></w:style>
</w:styles>`;
}

function renderNumberingXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl></w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
</w:numbering>`;
}

function createDocxReport(input) {
  const generatedIso = new Date().toISOString();
  return createZip([
    {
      name: '[Content_Types].xml',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`,
    },
    {
      name: '_rels/.rels',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`,
    },
    {
      name: 'word/_rels/document.xml.rels',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
</Relationships>`,
    },
    {
      name: 'word/document.xml',
      data: renderDocxDocumentXml(input),
    },
    {
      name: 'word/styles.xml',
      data: renderDocxStylesXml(),
    },
    {
      name: 'word/numbering.xml',
      data: renderNumberingXml(),
    },
    {
      name: 'docProps/core.xml',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>iFare 維護報告 ${escapeXml(today())}</dc:title>
  <dc:creator>iFare AI Maintenance Agent</dc:creator>
  <cp:lastModifiedBy>iFare AI Maintenance Agent</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${generatedIso}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${generatedIso}</dcterms:modified>
</cp:coreProperties>`,
    },
    {
      name: 'docProps/app.xml',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>iFare AI Maintenance Agent</Application>
</Properties>`,
    },
  ]);
}

function collectTaskSummary() {
  const cacheRel = CONFIG.task?.storeFile;
  if (!cacheRel) return { available: false, reason: 'task.storeFile 未設定' };
  const cacheFile = resolveRepoPath(cacheRel);
  if (!existsSync(cacheFile)) {
    return { available: false, reason: '尚未建立任務 cache（首次 intake 後會產生）' };
  }
  try {
    const data = JSON.parse(readFileSync(cacheFile, 'utf8'));
    const entries = Array.isArray(data.entries) ? data.entries : [];
    const counts = data.counts || {};
    const recent = entries
      .slice()
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
      .slice(0, 10)
      .map((t) => ({
        id: t.id,
        title: t.title,
        category: t.category,
        priority: t.priority,
        status: t.status,
        updatedAt: t.updatedAt,
      }));
    return {
      available: true,
      generatedAt: data.generatedAt || null,
      total: entries.length,
      counts,
      recent,
    };
  } catch (err) {
    return { available: false, reason: `cache 解析失敗：${err.message}` };
  }
}

function buildBackendSummary({ gitLog, changedFiles, gitState, xlsxStats, docsIndex, denySkipCount, outputFile, wordOutputFile, taskSummary }) {
  const dirtyLines = [...gitState.dirtyLines];
  if (outputFile) {
    const outputRel = normalizeRelPath(outputFile);
    const alreadyListed = dirtyLines.some((line) => line.includes(outputRel));
    if (!alreadyListed) dirtyLines.push(`M ${outputRel} (本次 report 產生)`);
  }
  if (wordOutputFile) {
    const outputRel = normalizeRelPath(wordOutputFile);
    const alreadyListed = dirtyLines.some((line) => line.includes(outputRel));
    if (!alreadyListed) dirtyLines.push(`M ${outputRel} (本次 Word report 產生)`);
  }

  const sheetSummary = xlsxStats.error
    ? []
    : [
        {
          name: '後臺優化',
          total: xlsxStats.backend.total,
          done: xlsxStats.backend.done,
          partial: xlsxStats.backend.partial,
          pending: xlsxStats.backend.pending,
        },
        {
          name: 'UIUX 問題追蹤',
          total: xlsxStats.uiux.total,
          done: xlsxStats.uiux.done,
          partial: xlsxStats.uiux.partial,
          pending: xlsxStats.uiux.pending,
        },
        {
          name: 'PoC 研究',
          total: xlsxStats.poc.total,
          done: xlsxStats.poc.done,
          partial: xlsxStats.poc.partial,
          pending: xlsxStats.poc.pending,
        },
      ];

  return {
    schemaVersion: 1,
    generatedAt: nowLocal(),
    reportDate: today(),
    agentVersion: CONFIG.agentVersion,
    readOnly: true,
    configPath: normalizeRelPath(CONFIG_PATH),
    markdownReport: outputFile ? normalizeRelPath(outputFile) : null,
    wordReport: wordOutputFile ? normalizeRelPath(wordOutputFile) : null,
    git: {
      sinceDays,
      branchName: gitState.branchName,
      commitCount: gitLog.totalCount,
      commits: gitLog.commits.slice(0, 12),
      changedFileCount: changedFiles.files.length,
      dirtyCount: dirtyLines.length,
      dirtyLines: dirtyLines.slice(0, 20).map((line) => clean(line, 160)),
      errors: [...(gitLog.error ? [gitLog.error] : []), ...(changedFiles.error ? [changedFiles.error] : []), ...gitState.errors],
    },
    xlsx: {
      trackingFile: normalizeRelPath(CONFIG.xlsx.trackingFile),
      sheetStatus: xlsxStats.sheetStatus ?? [],
      summary: sheetSummary,
      backendHighPending: xlsxStats.backend?.highPending?.slice(0, 20) ?? [],
      pocHighPending: xlsxStats.poc?.highPending?.slice(0, 10) ?? [],
      error: xlsxStats.error ?? null,
    },
    docs: {
      markdownCount: docsIndex.files.length,
      skippedLargeCount: docsIndex.skippedLargeCount,
      deniedCount: docsIndex.deniedCount,
    },
    tasks: taskSummary || { available: false, reason: 'taskSummary 未傳入' },
    safety: {
      denySkipCount,
      denyPathCount: CONFIG.denyPaths.length,
      allowedActions: ['read-project', 'read-xlsx', 'read-git-log', 'write-report'],
      blockedActions: ['write-xlsx', 'modify-code', 'commit', 'push', 'deploy', 'call-production-api'],
    },
    suggestedCommands: [
      {
        label: '重新產生報告',
        command: 'npm run agent:report',
        description: '讀取專案、Excel 與 git log，更新 Word、Markdown 與後台 JSON。',
      },
      {
        label: 'Dry-run 預覽',
        command: 'npm run agent:report:dry',
        description: '只在終端機印出報告，不寫入檔案。',
      },
      {
        label: '驗收 Agent',
        command: 'npm run agent:verify',
        description: '檢查設定檔、xlsx sheet、denyPaths 與 dry-run 行為。',
      },
    ],
    decisionsNeeded: [
      '報告要每日排程，還是維持手動觸發？',
      '後台 AI 維護中心是否只開給管理者？目前實作為管理者限定。',
      '第二階段是否允許人工確認後寫回 Excel？',
      '是否要加入 audit log：docs/ai-agent-reports/_audit.jsonl？',
      '事件通知是否需要 LINE / Email？',
    ],
  };
}

async function main() {
  console.log(`[ai-maintenance-report] start (${isDryRun ? 'dry-run' : 'write'}, since=${sinceDays} days)`);

  const t0 = Date.now();
  const gitLog = collectGitLog();
  const changedFiles = collectChangedFiles();
  const gitState = collectGitState();
  const xlsxStats = collectXlsxStats();
  const docsIndex = collectDocsIndex();
  const denySkipCount = changedFiles.deniedCount + docsIndex.deniedCount;

  const outputFile = isDryRun ? null : path.join(CONFIG.report.outputDir, `${today()}.md`);
  const wordOutputFile = isDryRun ? null : path.join(CONFIG.report.outputDir, `${today()}.docx`);
  const taskSummary = collectTaskSummary();
  const report = renderReport({ gitLog, changedFiles, gitState, xlsxStats, docsIndex, denySkipCount, outputFile, taskSummary });
  console.log(`[ai-maintenance-report] collected in ${Date.now() - t0}ms`);

  if (isDryRun) {
    console.log('\n------ DRY-RUN OUTPUT ------\n');
    console.log(report);
    return;
  }

  if (!existsSync(CONFIG.report.outputDir)) {
    mkdirSync(CONFIG.report.outputDir, { recursive: true });
  }
  writeFileSync(outputFile, report, 'utf8');
  console.log(`[ai-maintenance-report] wrote ${outputFile}`);
  writeFileSync(wordOutputFile, createDocxReport({
    gitLog,
    changedFiles,
    gitState,
    xlsxStats,
    docsIndex,
    denySkipCount,
    markdownOutputFile: outputFile,
    wordOutputFile,
  }));
  console.log(`[ai-maintenance-report] wrote ${wordOutputFile}`);

  if (CONFIG.report.backendPublicJson) {
    const backendSummary = buildBackendSummary({ gitLog, changedFiles, gitState, xlsxStats, docsIndex, denySkipCount, outputFile, wordOutputFile, taskSummary });
    mkdirSync(path.dirname(CONFIG.report.backendPublicJson), { recursive: true });
    writeFileSync(CONFIG.report.backendPublicJson, `${JSON.stringify(backendSummary, null, 2)}\n`, 'utf8');
    console.log(`[ai-maintenance-report] wrote ${CONFIG.report.backendPublicJson}`);
  }

  appendAudit({
    action: 'report.write',
    command: `node scripts/ai-maintenance-report.mjs${sinceArg ? ` ${sinceArg}` : ''}`,
    status: 'success',
    durationMs: Date.now() - t0,
    outputFiles: [
      normalizeRelPath(wordOutputFile),
      normalizeRelPath(outputFile),
      CONFIG.report.backendPublicJson ? normalizeRelPath(CONFIG.report.backendPublicJson) : null,
      CONFIG.audit.backendPublicJson ? normalizeRelPath(CONFIG.audit.backendPublicJson) : null,
    ].filter(Boolean),
  });

  console.log(`[ai-maintenance-report] done in ${Date.now() - t0}ms total`);
}

main().catch((err) => {
  console.error('[ai-maintenance-report] FATAL', err);
  process.exit(1);
});
