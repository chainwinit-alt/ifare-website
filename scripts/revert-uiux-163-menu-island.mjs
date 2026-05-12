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
const today = '2026-05-12';
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

const row = findRowById(163);
setCell(
  row,
  12,
  '2026-05-12 撤銷實作：AppHeader.vue 與 _rwd_appHeader.scss 已將 .menu-island 入口（含 __camera / __label / __page 與相關 JS computed mobileMenuPageLabel）整段移除。'
);
// 狀態保留「已修正」，避免之後被誤判為「沒做」而重做；視為「做了但又撤銷」
setCell(row, 13, '已修正');
setCell(row, 14, today);
setCell(
  row,
  15,
  '依使用者反饋，這個 dynamic island 視覺非必要；漢堡 toggle / close / focus 管理 / 選單列表均不受影響。'
);

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
    v: '#163 動態島手機選單已依使用者反饋撤銷實作；狀態保留「已修正」並補驗證備註說明。',
    t: 's',
  };
}

XLSX.writeFile(wb, file, { compression: true });

console.log('Reverted #163 (menu-island) notes.');
console.log(counts);
