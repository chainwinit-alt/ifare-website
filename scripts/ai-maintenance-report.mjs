#!/usr/bin/env node
/**
 * ai-maintenance-report.mjs — iFare AI 維運助理 MVP 雛形（階段一）
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
 *   node scripts/ai-maintenance-report.mjs                # 產出今天的報告
 *   node scripts/ai-maintenance-report.mjs --dry-run      # 只印到 stdout，不寫檔
 *   node scripts/ai-maintenance-report.mjs --since=14     # git log 抓 14 天（預設 7）
 *
 * 對應規劃文件：docs/AI_AGENT_MAINTENANCE_PLAN.md §3 階段一
 * 驗收標準：docs/AI_AGENT_MAINTENANCE_PLAN.md §8 PoC 驗收
 */

import XLSX from 'xlsx-js-style';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

// ───────────────────────────────────────────────────────────
// 設定（後續可抽到 docs/agent.config.json）
// ───────────────────────────────────────────────────────────
const CONFIG = {
  version: '1.0.0-mvp',
  report: {
    outputDir: path.join(REPO_ROOT, 'docs', 'ai-agent-reports'),
  },
  xlsx: {
    file: path.join(REPO_ROOT, 'docs', 'iFare_問題追蹤與AI維運規劃.xlsx'),
    sheets: ['後臺優化', 'UIUX問題追蹤清單', 'PoC研究', '統計摘要'],
  },
  git: {
    defaultSinceDays: 7,
    ignorePatterns: [/\.lock$/, /node_modules\//, /\.nuxt\//, /\.output\//],
  },
  docs: {
    dir: path.join(REPO_ROOT, 'docs'),
  },
  // 黑名單：絕對不可讀（雛形階段先 hard-code）
  denyPaths: [
    /(^|\/)\.env(\.|$)/,
    /appsettings.*\.json$/i,
    /\/secrets\//i,
    /\.key$/i,
    /\.pem$/i,
  ],
  // xlsx 後台 sheet 欄位 index（同 scripts/list-backend-pending.mjs）
  xlsxBackendCols: { id: 0, area: 2, sub: 3, type: 4, cat: 5, pri: 6, title: 7, status: 13 },
  xlsxUiuxCols: { id: 0, area: 2, sub: 3, cat: 5, pri: 6, title: 7, status: 13 },
  xlsxPocCols: { id: 0, area: 2, sub: 3, pri: 6, title: 7, status: 13 },
};

// ───────────────────────────────────────────────────────────
// CLI args
// ───────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const sinceArg = args.find((a) => a.startsWith('--since='));
const sinceDays = sinceArg ? parseInt(sinceArg.split('=')[1], 10) : CONFIG.git.defaultSinceDays;

// ───────────────────────────────────────────────────────────
// 共用工具
// ───────────────────────────────────────────────────────────

/** 把字串 sanitize：去掉換行、限制長度 */
function clean(s, maxLen = 80) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/[\r\n]+/g, ' ').trim().slice(0, maxLen);
}

/** 今天的日期字串（YYYY-MM-DD） */
function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** ISO 時間 */
function nowIso() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

/** 安全執行 shell command，失敗回 fallback */
function safeExec(cmd, fallback = '') {
  try {
    return execSync(cmd, { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (err) {
    return fallback;
  }
}

/** 檢查路徑是否在 denyPaths 黑名單內 */
function isDenied(p) {
  return CONFIG.denyPaths.some((re) => re.test(p));
}

// ───────────────────────────────────────────────────────────
// 收集：git log（過去 N 天）
// ───────────────────────────────────────────────────────────
function collectGitLog() {
  const fmt = '%H|%an|%ad|%s';
  const out = safeExec(`git log --since="${sinceDays} days ago" --date=short --pretty=format:"${fmt}"`);
  if (!out) return { commits: [], totalCount: 0 };

  const commits = out
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [hash, author, date, ...rest] = line.split('|');
      const subject = rest.join('|');
      return { hash: hash.slice(0, 7), author, date, subject };
    });

  return { commits, totalCount: commits.length };
}

/** 過去 N 天動到的 source file 概要（不含被忽略的 path） */
function collectChangedFiles() {
  const out = safeExec(`git log --since="${sinceDays} days ago" --name-only --pretty=format:""`);
  if (!out) return [];
  const files = new Set();
  out
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((f) => {
      if (CONFIG.git.ignorePatterns.some((re) => re.test(f))) return;
      if (isDenied(f)) return;
      files.add(f);
    });
  return Array.from(files).sort();
}

// ───────────────────────────────────────────────────────────
// 收集：xlsx 待處理 + 統計
// ───────────────────────────────────────────────────────────
function collectXlsxStats() {
  if (!existsSync(CONFIG.xlsx.file)) {
    return { error: `xlsx 不存在：${CONFIG.xlsx.file}` };
  }

  const wb = XLSX.readFile(CONFIG.xlsx.file, { cellStyles: false });
  const result = {
    backend: { total: 0, done: 0, partial: 0, pending: 0, highPending: [] },
    uiux: { total: 0, done: 0, partial: 0, pending: 0 },
    poc: { total: 0, done: 0, partial: 0, pending: 0, highPending: [] },
  };

  // 後臺優化
  if (wb.Sheets['後臺優化']) {
    const ws = wb.Sheets['後臺優化'];
    const range = XLSX.utils.decode_range(ws['!ref']);
    const C = CONFIG.xlsxBackendCols;
    for (let r = 2; r <= range.e.r; r++) {
      const get = (c) => ws[XLSX.utils.encode_cell({ r, c })]?.v ?? '';
      const status = String(get(C.status)).trim();
      result.backend.total++;
      if (status === '已修正') result.backend.done++;
      else if (status === '部分修正') result.backend.partial++;
      else if (status === '待處理') {
        result.backend.pending++;
        if (String(get(C.pri)).trim() === '高') {
          result.backend.highPending.push({
            id: get(C.id),
            area: clean(get(C.area), 20),
            sub: clean(get(C.sub), 20),
            cat: clean(get(C.cat), 12),
            title: clean(get(C.title), 60),
          });
        }
      }
    }
  }

  // UIUX問題追蹤清單
  if (wb.Sheets['UIUX問題追蹤清單']) {
    const ws = wb.Sheets['UIUX問題追蹤清單'];
    const range = XLSX.utils.decode_range(ws['!ref']);
    const C = CONFIG.xlsxUiuxCols;
    for (let r = 2; r <= range.e.r; r++) {
      const status = String(ws[XLSX.utils.encode_cell({ r, c: C.status })]?.v ?? '').trim();
      result.uiux.total++;
      if (status === '已修正') result.uiux.done++;
      else if (status === '部分修正') result.uiux.partial++;
      else if (status === '待處理') result.uiux.pending++;
    }
  }

  // PoC研究
  if (wb.Sheets['PoC研究']) {
    const ws = wb.Sheets['PoC研究'];
    const range = XLSX.utils.decode_range(ws['!ref']);
    const C = CONFIG.xlsxPocCols;
    for (let r = 2; r <= range.e.r; r++) {
      const get = (c) => ws[XLSX.utils.encode_cell({ r, c })]?.v ?? '';
      const status = String(get(C.status)).trim();
      result.poc.total++;
      if (status === '已修正') result.poc.done++;
      else if (status === '部分修正') result.poc.partial++;
      else if (status === '待處理') {
        result.poc.pending++;
        if (String(get(C.pri)).trim() === '高') {
          result.poc.highPending.push({
            id: get(C.id),
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

// ───────────────────────────────────────────────────────────
// 收集：docs 索引（不讀內容，只列檔名與大小）
// ───────────────────────────────────────────────────────────
function collectDocsIndex() {
  if (!existsSync(CONFIG.docs.dir)) return [];
  const entries = readdirSync(CONFIG.docs.dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith('.md'))
    .filter((e) => !isDenied(e.name))
    .map((e) => {
      const full = path.join(CONFIG.docs.dir, e.name);
      const st = statSync(full);
      return {
        name: e.name,
        sizeKB: Math.round(st.size / 1024),
        mtime: st.mtime.toISOString().slice(0, 10),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

// ───────────────────────────────────────────────────────────
// Render 報告
// ───────────────────────────────────────────────────────────
function renderReport({ gitLog, changedFiles, xlsxStats, docsIndex, denySkipCount }) {
  const lines = [];
  const date = today();

  lines.push(`# iFare 維護報告 ${date}`);
  lines.push('');
  lines.push(`> 自動產生於 ${nowIso()}；本報告 **read-only**，不修改任何資料。`);
  lines.push('');

  // ── §1 今日完成 ──
  lines.push('## 1. 近期完成（git log）');
  lines.push('');
  if (gitLog.commits.length === 0) {
    lines.push(`過去 ${sinceDays} 天沒有 commit 紀錄。`);
  } else {
    lines.push(`過去 ${sinceDays} 天共 **${gitLog.totalCount}** 個 commit：`);
    lines.push('');
    for (const c of gitLog.commits.slice(0, 30)) {
      lines.push(`- \`${c.hash}\` (${c.date} ${c.author}) — ${clean(c.subject, 100)}`);
    }
    if (gitLog.commits.length > 30) {
      lines.push(`- _…還有 ${gitLog.commits.length - 30} 個 commit_`);
    }
  }
  lines.push('');

  // ── §2 進行中 ──
  lines.push('## 2. 進行中');
  lines.push('');
  const branchName = safeExec('git rev-parse --abbrev-ref HEAD', 'unknown').trim();
  lines.push(`目前所在分支：\`${branchName}\``);
  const dirtyOut = safeExec('git status --porcelain');
  const dirtyLines = dirtyOut
    .split('\n')
    .filter(Boolean)
    .filter((l) => !CONFIG.git.ignorePatterns.some((re) => re.test(l)))
    .filter((l) => !isDenied(l));
  if (dirtyLines.length === 0) {
    lines.push('Working tree 乾淨。');
  } else {
    lines.push(`Working tree 有 **${dirtyLines.length}** 個未 commit 異動：`);
    lines.push('');
    for (const dl of dirtyLines.slice(0, 30)) {
      lines.push(`- ${dl}`);
    }
    if (dirtyLines.length > 30) {
      lines.push(`- _…還有 ${dirtyLines.length - 30} 個檔案_`);
    }
  }
  lines.push('');

  // ── §3 待處理重點（xlsx 後臺優化高優先）──
  lines.push('## 3. 待處理重點');
  lines.push('');
  if (xlsxStats.error) {
    lines.push(`⚠️ ${xlsxStats.error}`);
  } else {
    const { backend, uiux, poc } = xlsxStats;
    lines.push(`| Sheet | 總計 | 已修正 | 部分修正 | 待處理 |`);
    lines.push(`|---|---:|---:|---:|---:|`);
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

  // ── §4 風險與異常（雛形版只有 placeholder）──
  lines.push('## 4. 風險與異常');
  lines.push('');
  lines.push('_（雛形版尚未實作自動掃描；後續階段三會加 build / type-check / hardcoded URL / v-html 掃描）_');
  lines.push('');

  // ── §5 環境健康 ──
  lines.push('## 5. 環境健康（Smoke Test 摘要）');
  lines.push('');
  lines.push('_（雛形版尚未串接；後續會讀後台 localStorage 的 Smoke Test 結果或 /Health/Smoke 頁紀錄）_');
  lines.push('');

  // ── §6 建議任務 ──
  lines.push('## 6. 建議任務（可寫回 xlsx）');
  lines.push('');
  lines.push('_（雛形版尚未有建議規則；後續階段三會根據巡檢結果自動產生建議任務）_');
  lines.push('');

  // ── §7 不確定 / 需要決策 ──
  lines.push('## 7. 不確定 / 需要決策');
  lines.push('');
  lines.push('- 請見 `docs/AI_AGENT_MAINTENANCE_PLAN.md` §13「待決問題」5 項，需主管 / 團隊回覆後才能進階段二。');
  lines.push('');

  // ── §8 元資料 ──
  lines.push('## 8. 元資料');
  lines.push('');
  lines.push(`- 報告產生時間：${nowIso()}`);
  lines.push(`- Agent 版本：${CONFIG.version}`);
  lines.push(`- 報告產生主機：${process.platform} (Node ${process.version})`);
  lines.push(`- 讀取 docs/*.md：${docsIndex.length} 個`);
  lines.push(`- git 異動檔案數（過去 ${sinceDays} 天）：${changedFiles.length}`);
  lines.push(`- denyPaths 黑名單命中數：${denySkipCount}`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('> 本報告由 `scripts/ai-maintenance-report.mjs` 產生；read-only，不會修改任何資料。');
  lines.push('> 規劃文件：[`docs/AI_AGENT_MAINTENANCE_PLAN.md`](./../AI_AGENT_MAINTENANCE_PLAN.md)');

  return lines.join('\n');
}

// ───────────────────────────────────────────────────────────
// main
// ───────────────────────────────────────────────────────────
async function main() {
  console.log(`[ai-maintenance-report] start (${isDryRun ? 'dry-run' : 'write'}, since=${sinceDays} days)`);

  const t0 = Date.now();
  const gitLog = collectGitLog();
  const changedFiles = collectChangedFiles();
  const xlsxStats = collectXlsxStats();
  const docsIndex = collectDocsIndex();
  // denyPaths 命中數：粗略統計（git changed + docs 跳過的）
  const denySkipCount = 0; // 雛形先固定 0，後續加細統計

  const report = renderReport({ gitLog, changedFiles, xlsxStats, docsIndex, denySkipCount });
  const elapsedMs = Date.now() - t0;
  console.log(`[ai-maintenance-report] collected in ${elapsedMs}ms`);

  if (isDryRun) {
    console.log('\n────── DRY-RUN OUTPUT ──────\n');
    console.log(report);
    return;
  }

  // 寫到 docs/ai-agent-reports/YYYY-MM-DD.md
  if (!existsSync(CONFIG.report.outputDir)) {
    mkdirSync(CONFIG.report.outputDir, { recursive: true });
  }
  const outFile = path.join(CONFIG.report.outputDir, `${today()}.md`);
  writeFileSync(outFile, report, 'utf8');
  console.log(`[ai-maintenance-report] wrote ${outFile}`);
  console.log(`[ai-maintenance-report] done in ${Date.now() - t0}ms total`);
}

main().catch((err) => {
  console.error('[ai-maintenance-report] FATAL', err);
  process.exit(1);
});
