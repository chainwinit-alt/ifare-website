import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx-js-style';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.resolve(__dirname, '..', 'docs');
const workbookFileName = fs.readdirSync(docsDir).find((name) => name.endsWith('.xlsx'));

if (!workbookFileName) {
  throw new Error('UI/UX tracking workbook not found.');
}

const file = path.join(docsDir, workbookFileName);
const today = '2026-05-11';
const wb = XLSX.readFile(file, { cellStyles: true });
const trackingSheetName = wb.SheetNames.find((name) => name.includes('UIUX')) || wb.SheetNames[2];
const summarySheetName = wb.SheetNames[wb.SheetNames.length - 1];
const ws = wb.Sheets[trackingSheetName];
const summary = wb.Sheets[summarySheetName];

if (!ws) {
  throw new Error('Tracking worksheet not found.');
}

const range = XLSX.utils.decode_range(ws['!ref']);
const cell = (r, c) => XLSX.utils.encode_cell({ r, c });

const setCell = (r, c, value) => {
  const addr = cell(r, c);
  ws[addr] = {
    ...(ws[addr] || {}),
    v: value,
    t: typeof value === 'number' ? 'n' : 's',
  };
};

const findRowById = (id) => {
  for (let r = 2; r <= range.e.r; r += 1) {
    if (Number(ws[cell(r, 0)]?.v) === id) {
      return r;
    }
  }

  throw new Error(`Issue #${id} not found.`);
};

const updates = [
  {
    id: 40,
    verify:
      'CompBreadCrumb 已補齊 breadcrumb 計算邏輯，當前頁改為純文字避免自連結，並套用到 news / articles / future。',
    note:
      '共用麵包屑元件不再是空殼；about / collaborator 維持使用，news / articles / future 也改為共用元件。',
  },
  {
    id: 123,
    verify:
      '新增 useDateFormatter.ts，使用 Intl.DateTimeFormat("zh-TW") 統一處理 news / articles / i-Fare 詳情與聯絡頁日期格式。',
    note:
      '日期統一輸出為 YYYY.MM.DD，保留無法解析的原字串，避免直接依賴 API 原始格式。',
  },
  {
    id: 129,
    verify:
      'app.vue 已監聽 window online / offline，斷線時顯示全域通知，恢復連線後短暫顯示恢復提示。',
    note:
      '採固定頂部 banner 呈現網路狀態，不影響既有頁面流程；目前維持輕量提示，未擴充成完整 toast 系統。',
  },
];

for (const item of updates) {
  const row = findRowById(item.id);
  setCell(row, 12, item.verify);
  setCell(row, 13, '已修正');
  setCell(row, 14, today);
  setCell(row, 15, item.note);
}

const rows = XLSX.utils
  .sheet_to_json(ws, { header: 1, defval: '' })
  .slice(2)
  .filter((row) => row[0]);

const counts = {
  total: rows.length,
  fixed: rows.filter((row) => row[13] === '已修正').length,
  partial: rows.filter((row) => row[13] === '部分修正').length,
  pending: rows.filter((row) => row[13] === '待處理' || row[13] === '未修正').length,
};

if (summary) {
  summary.B3 = { ...(summary.B3 || {}), v: counts.total, t: 'n' };
  summary.C3 = { ...(summary.C3 || {}), v: counts.fixed, t: 'n' };
  summary.D3 = { ...(summary.D3 || {}), v: counts.partial, t: 'n' };
  summary.E3 = { ...(summary.E3 || {}), v: counts.pending, t: 'n' };
  summary.F3 = {
    ...(summary.F3 || {}),
    v: `${((counts.fixed / counts.total) * 100).toFixed(1)}%`,
    t: 's',
  };
  summary.G3 = {
    ...(summary.G3 || {}),
    v: '更新 #40/#123/#129：共用麵包屑、日期格式統一與全站網路狀態提示',
    t: 's',
  };
}

XLSX.writeFile(wb, file, { compression: true });

console.log('Updated #40, #123, #129.');
console.log(counts);
