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

let range = XLSX.utils.decode_range(ws['!ref']);
const cell = (r, c) => XLSX.utils.encode_cell({ r, c });

const cloneStyle = (r, c) => {
  const style = ws[cell(r, c)]?.s;
  return style ? JSON.parse(JSON.stringify(style)) : undefined;
};

const setCell = (r, c, value, templateRow) => {
  const addr = cell(r, c);
  ws[addr] = {
    ...(ws[addr] || {}),
    v: value,
    t: typeof value === 'number' ? 'n' : 's',
    s: ws[addr]?.s || cloneStyle(templateRow, c),
  };
};

const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
const dataRows = rows.slice(2).filter((row) => row[0]);
const existingIds = new Set(dataRows.map((row) => Number(row[0])).filter(Boolean));
const nextRow = range.e.r + 1;
const templateRow = range.e.r;

const issue = [
  163,
  'V',
  '共用元件',
  'AppHeader 行動選單',
  '提升',
  '視覺',
  '中',
  '行動版主選單缺少靈動島視覺焦點，頂部留白偏空',
  '手機選單 overlay 上方空白較多，雖已處理瀏海安全區，但導覽狀態不夠聚焦，也缺少可快速辨識當前所在頁面的頂部視覺錨點。',
  '在 AppHeader 行動選單 overlay 頂部加入膠囊式靈動島，結合目前頁面標示、暗色毛玻璃與安全區定位，並同步調整 menu list 上緣間距與右上角關閉按鈕位置。',
  'components/AppHeader.vue assets/style/rwd/_rwd_appHeader.scss',
  'Dev/Dev Code/iFare_Frontend/components/AppHeader.vue\r\nDev/Dev Code/iFare_Frontend/assets/style/rwd/_rwd_appHeader.scss',
  '已於 mobile-menu 新增置中靈動島，顯示「長穩選單」與目前頁面名稱，並調整 safe-area、close 按鈕與 menu list 垂直間距。',
  '已修正',
  today,
  'AppHeader.vue 新增 mobileMenuIslandLabel / mobileMenuPageLabel；_rwd_appHeader.scss 新增 menu-island 膠囊樣式、暗色毛玻璃與手機版 overlay 專用 top padding。',
];

if (!existingIds.has(issue[0])) {
  for (let c = 0; c < issue.length; c += 1) {
    setCell(nextRow, c, issue[c], templateRow);
  }

  range = {
    s: range.s,
    e: { r: nextRow, c: Math.max(range.e.c, issue.length - 1) },
  };
  ws['!ref'] = XLSX.utils.encode_range(range);
}

const updatedRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }).slice(2).filter((row) => row[0]);
const counts = {
  total: updatedRows.length,
  fixed: updatedRows.filter((row) => row[13] === '已修正').length,
  partial: updatedRows.filter((row) => row[13] === '部分修正').length,
  pending: updatedRows.filter((row) => row[13] === '待處理' || row[13] === '未修正').length,
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
    v: '新增 #163 行動選單靈動島視覺優化，補強手機版 overlay 頂部視覺焦點與目前頁面辨識。',
    t: 's',
  };
}

XLSX.writeFile(wb, file, { compression: true });

console.log('Updated UI/UX tracking with #163.');
console.log(counts);
