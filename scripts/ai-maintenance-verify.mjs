#!/usr/bin/env node
/**
 * ai-maintenance-verify.mjs - 階段一 MVP CLI 驗收檢查
 *
 * 只做 read-only 驗證，不寫回 xlsx、不產生正式報告、不修改 code。
 */

import XLSX from 'xlsx-js-style';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(REPO_ROOT, 'docs', 'agent.config.json');
const PACKAGE_PATH = path.join(REPO_ROOT, 'package.json');

const checks = [];

function pass(name, detail = '') {
  checks.push({ ok: true, name, detail });
}

function fail(name, detail = '') {
  checks.push({ ok: false, name, detail });
}

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

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function runCheck(name, fn) {
  try {
    fn();
  } catch (err) {
    fail(name, err?.message ?? String(err));
  }
}

runCheck('設定檔存在且可解析', () => {
  if (!existsSync(CONFIG_PATH)) throw new Error('缺少 docs/agent.config.json');
  const config = readJson(CONFIG_PATH);
  if (!config.report?.outputDir) throw new Error('缺少 report.outputDir');
  if (!config.xlsx?.trackingFile) throw new Error('缺少 xlsx.trackingFile');
  if (!Array.isArray(config.denyPaths) || config.denyPaths.length === 0) throw new Error('缺少 denyPaths');
  pass('設定檔存在且可解析', `version=${config.version}`);
});

runCheck('root npm scripts 已註冊', () => {
  if (!existsSync(PACKAGE_PATH)) throw new Error('缺少 package.json');
  const pkg = readJson(PACKAGE_PATH);
  for (const scriptName of ['agent:report', 'agent:report:dry', 'agent:runner', 'agent:verify']) {
    if (!pkg.scripts?.[scriptName]) throw new Error(`缺少 npm script: ${scriptName}`);
  }
  if (!pkg.dependencies?.['xlsx-js-style']) throw new Error('缺少 dependency: xlsx-js-style');
  pass('root npm scripts 已註冊', Object.keys(pkg.scripts).join(', '));
});

runCheck('xlsx 四個 sheet 可讀', () => {
  const config = readJson(CONFIG_PATH);
  const xlsxFile = resolveRepoPath(config.xlsx.trackingFile);
  if (!existsSync(xlsxFile)) throw new Error(`xlsx 不存在：${config.xlsx.trackingFile}`);

  const wb = XLSX.readFile(xlsxFile, { cellStyles: false });
  const missing = config.xlsx.sheets.filter((sheetName) => !wb.Sheets[sheetName]?.['!ref']);
  if (missing.length > 0) throw new Error(`缺少 sheet：${missing.join(', ')}`);
  pass('xlsx 四個 sheet 可讀', config.xlsx.sheets.join(', '));
});

runCheck('denyPaths 基本規則存在', () => {
  const config = readJson(CONFIG_PATH);
  const required = ['.env', '**/appsettings*.json', '**/*.key', '**/*.pem', '**/node_modules/**'];
  const missing = required.filter((pattern) => !config.denyPaths.includes(pattern));
  if (missing.length > 0) throw new Error(`缺少 deny pattern：${missing.join(', ')}`);
  pass('denyPaths 基本規則存在', `${config.denyPaths.length} rules`);
});

runCheck('dry-run 不寫正式報告且格式正確', () => {
  const config = readJson(CONFIG_PATH);
  const outDir = resolveRepoPath(config.report.outputDir);
  const today = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const reportFile = path.join(outDir, `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}.md`);
  const beforeMtime = existsSync(reportFile) ? statSync(reportFile).mtimeMs : null;

  const t0 = Date.now();
  const output = execFileSync('node', ['scripts/ai-maintenance-report.mjs', '--dry-run'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  const elapsedMs = Date.now() - t0;

  const afterMtime = existsSync(reportFile) ? statSync(reportFile).mtimeMs : null;
  if (beforeMtime !== afterMtime) throw new Error('dry-run 修改了正式報告檔');
  for (const text of ['# iFare 維護報告', '## 1. 近期完成', '## 3. 待處理重點', '## 8. 元資料']) {
    if (!output.includes(text)) throw new Error(`dry-run 輸出缺少：${text}`);
  }
  if (elapsedMs > 30000) throw new Error(`dry-run 超過 30 秒：${elapsedMs}ms`);
  pass('dry-run 不寫正式報告且格式正確', `${elapsedMs}ms`);
});

runCheck('後台 AI 維護中心 JSON 可讀', () => {
  const config = readJson(CONFIG_PATH);
  if (!config.report?.backendPublicJson) throw new Error('缺少 report.backendPublicJson');
  const jsonFile = resolveRepoPath(config.report.backendPublicJson);
  if (!existsSync(jsonFile)) throw new Error(`缺少後台 JSON：${config.report.backendPublicJson}，請先跑 npm run agent:report`);
  const data = readJson(jsonFile);
  if (!data.generatedAt || !data.xlsx?.summary || !data.suggestedCommands || !data.wordReport) {
    throw new Error('後台 JSON 格式不完整');
  }
  pass('後台 AI 維護中心 JSON 可讀', config.report.backendPublicJson);
});

runCheck('主管用 Word 報告已產出', () => {
  const config = readJson(CONFIG_PATH);
  const outDir = resolveRepoPath(config.report.outputDir);
  const today = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const docxFile = path.join(outDir, `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}.docx`);
  if (!existsSync(docxFile)) throw new Error(`缺少 Word 報告：${docxFile}`);
  const file = readFileSync(docxFile);
  if (file.subarray(0, 2).toString('utf8') !== 'PK') throw new Error('Word 報告不是有效 docx/zip 格式');
  if (file.length < 1000) throw new Error(`Word 報告檔案太小：${file.length} bytes`);
  pass('主管用 Word 報告已產出', `${docxFile} (${file.length} bytes)`);
});

runCheck('audit log 可讀', () => {
  const config = readJson(CONFIG_PATH);
  if (!config.audit?.logFile) throw new Error('缺少 audit.logFile');
  if (!config.audit?.backendPublicJson) throw new Error('缺少 audit.backendPublicJson');
  const logFile = resolveRepoPath(config.audit.logFile);
  const publicJson = resolveRepoPath(config.audit.backendPublicJson);
  if (!existsSync(logFile)) throw new Error(`缺少 audit log：${config.audit.logFile}，請先跑 npm run agent:report`);
  if (!existsSync(publicJson)) throw new Error(`缺少 audit public JSON：${config.audit.backendPublicJson}`);
  const data = readJson(publicJson);
  if (!Array.isArray(data.entries)) throw new Error('audit public JSON 格式不完整');
  pass('audit log 可讀', `${data.entries.length} public entries`);
});

runCheck('runner 腳本存在', () => {
  const runnerFile = path.join(REPO_ROOT, 'scripts', 'ai-maintenance-runner.mjs');
  if (!existsSync(runnerFile)) throw new Error('缺少 scripts/ai-maintenance-runner.mjs');
  const runnerSource = readFileSync(runnerFile, 'utf8');
  if (!runnerSource.includes('/agent-task')) throw new Error('runner 缺少自然語言任務端點 /agent-task');
  for (const endpoint of ['/agent/intake', '/agent/tasks', '/agent/tasks/refresh-from-excel']) {
    if (!runnerSource.includes(endpoint)) throw new Error(`runner 缺少任務端點：${endpoint}`);
  }
  pass('runner 腳本存在', 'npm run agent:runner');
});

runCheck('task 設定區段完整', () => {
  const config = readJson(CONFIG_PATH);
  if (!config.task) throw new Error('缺少 task 區段');
  for (const key of ['storeFile', 'publicMirror', 'excelFile', 'excelSheet', 'autoApproveActions', 'maxExcelSizeMB', 'lockFile']) {
    if (config.task[key] === undefined || config.task[key] === null) {
      throw new Error(`task.${key} 未設定`);
    }
  }
  if (!Array.isArray(config.task.autoApproveActions) || config.task.autoApproveActions.length === 0) {
    throw new Error('task.autoApproveActions 必須是非空陣列');
  }
  pass('task 設定區段完整', `excelFile=${config.task.excelFile}`);
});

runCheck('task 模組可載入', async () => {
  const taskStore = path.join(REPO_ROOT, 'scripts', 'agent', 'task-store.mjs');
  const stateMachine = path.join(REPO_ROOT, 'scripts', 'agent', 'task-state-machine.mjs');
  const classifier = path.join(REPO_ROOT, 'scripts', 'agent', 'intake-classifier.mjs');
  const excelSync = path.join(REPO_ROOT, 'scripts', 'agent', 'excel-sync.mjs');
  for (const file of [taskStore, stateMachine, classifier, excelSync]) {
    if (!existsSync(file)) throw new Error(`缺少模組：${path.relative(REPO_ROOT, file)}`);
  }
  pass('task 模組可載入', 'task-store / state-machine / classifier / excel-sync');
});

runCheck('task cache JSON 結構正確（若存在）', () => {
  const config = readJson(CONFIG_PATH);
  const cacheFile = resolveRepoPath(config.task.storeFile);
  if (!existsSync(cacheFile)) {
    pass('task cache JSON 結構正確（若存在）', '尚未產生 cache，會在首次 intake 時建立');
    return;
  }
  const data = readJson(cacheFile);
  if (!Array.isArray(data.entries)) throw new Error('cache.entries 必須是陣列');
  if (typeof data.counts !== 'object') throw new Error('cache.counts 必須是物件');
  pass('task cache JSON 結構正確（若存在）', `${data.entries.length} entries`);
});

runCheck('AdminAgent task 元件存在', () => {
  const inbox = path.join(REPO_ROOT, 'Dev', 'Dev Code', 'iFare_Backend', 'src', 'views', 'AdminAgent', 'components', 'TaskInbox.vue');
  const drawer = path.join(REPO_ROOT, 'Dev', 'Dev Code', 'iFare_Backend', 'src', 'views', 'AdminAgent', 'components', 'TaskDetailDrawer.vue');
  const types = path.join(REPO_ROOT, 'Dev', 'Dev Code', 'iFare_Backend', 'src', 'views', 'AdminAgent', 'components', 'agentTaskTypes.ts');
  for (const file of [inbox, drawer, types]) {
    if (!existsSync(file)) throw new Error(`缺少元件：${path.relative(REPO_ROOT, file)}`);
  }
  pass('AdminAgent task 元件存在', 'TaskInbox / TaskDetailDrawer / agentTaskTypes');
});

const failed = checks.filter((check) => !check.ok);
for (const check of checks) {
  const marker = check.ok ? 'PASS' : 'FAIL';
  console.log(`[${marker}] ${check.name}${check.detail ? ` - ${check.detail}` : ''}`);
}

if (failed.length > 0) {
  console.error(`\n[ai-maintenance-verify] failed: ${failed.length}/${checks.length}`);
  process.exit(1);
}

console.log(`\n[ai-maintenance-verify] passed: ${checks.length}/${checks.length}`);
