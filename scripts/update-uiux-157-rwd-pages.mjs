import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.resolve(__dirname, '..', 'docs', 'iFare_UI_UX_問題追蹤清單.xlsx');
const sheetName = 'UIUX問題追蹤清單';
const summarySheetName = '統計摘要';

const wb = XLSX.readFile(file, { cellStyles: true });
const ws = wb.Sheets[sheetName];
if (!ws) throw new Error(`Worksheet not found: ${sheetName}`);

const range = XLSX.utils.decode_range(ws['!ref']);
const cell = (r, c) => XLSX.utils.encode_cell({ r, c });
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

const cloneStyle = (addr) => {
  const style = ws[addr]?.s;
  return style ? JSON.parse(JSON.stringify(style)) : undefined;
};

const setCell = (r, c, value, templateRow = r) => {
  const addr = cell(r, c);
  const templateAddr = cell(templateRow, c);
  ws[addr] = {
    ...(ws[addr] || {}),
    v: value,
    t: typeof value === 'number' ? 'n' : 's',
    s: ws[addr]?.s || cloneStyle(templateAddr),
  };
};

const findRowById = (id) => {
  for (let r = 2; r <= range.e.r; r += 1) {
    const current = ws[cell(r, 0)];
    if (Number(current?.v) === id) return r;
  }
  return -1;
};

const updateExistingIssue = (id, note) => {
  const r = findRowById(id);
  if (r === -1) throw new Error(`Issue #${id} not found`);
  setCell(r, 13, '已修正');
  setCell(r, 14, '2026-05-11');
  setCell(r, 15, note);
};

updateExistingIssue(
  27,
  '已調整福利專欄/懶人包手機版篩選區、文章卡片 padding/gap、日期與摘要換行、箭頭對齊，降低手機版左右不對稱與卡片擁擠感。'
);

updateExistingIssue(
  152,
  '已調整公益夥伴手機版篩選列：分類 chip 改為兩欄 grid、搜尋列滿版、卡片寬度與間距重整，避免 min-width 造成橫向溢出。'
);

const existingIds = new Set(rows.slice(2).map((row) => Number(row[0])).filter(Boolean));
const newIssue = [
  157,
  'V',
  'i-Fare 福利查詢',
  '手機版搜尋/FAQ/機構列表',
  '修復',
  'RWD',
  '中',
  'i-Fare 手機版搜尋卡片與列表間距不一致，排版不夠對稱',
  'Web 版呈現正常，但手機版搜尋卡片、標籤按鈕、FAQ 與機構列表在小螢幕上容易顯得左右不齊、間距鬆散或內容擠壓。',
  '在手機斷點統一搜尋卡片寬度與 padding，調整標籤 gap、搜尋按鈕高度、FAQ 文字區 padding 與機構列表連結對齊。',
  'assets/style/rwd/_rwd_ifare.scss',
  'Dev/Dev Code/iFare_Frontend/assets/style/rwd/_rwd_ifare.scss',
  '依使用者指定 i-Fare 手機版 RWD 問題處理；本次以主要版面對稱與小螢幕可讀性為主。',
  '已修正',
  '2026-05-11',
  '修正 .card-ifare-filter、.btn-tag-list、.btn-filter、.agency-list 與主 i-Fare FAQ 手機 selector，確保樣式套用到 .app-body[name=ifare]。',
];

let appended = 0;
if (!existingIds.has(newIssue[0])) {
  const r = range.e.r + 1;
  for (let c = 0; c < newIssue.length; c += 1) {
    setCell(r, c, newIssue[c], range.e.r);
  }
  appended = 1;
  ws['!ref'] = XLSX.utils.encode_range({
    s: range.s,
    e: { r: range.e.r + 1, c: Math.max(range.e.c, newIssue.length - 1) },
  });
}

const updatedRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }).slice(2).filter((row) => row[0]);
const counts = {
  total: updatedRows.length,
  fixed: updatedRows.filter((row) => row[13] === '已修正').length,
  partial: updatedRows.filter((row) => row[13] === '部分修正').length,
  pending: updatedRows.filter((row) => row[13] === '待處理').length,
};

const summary = wb.Sheets[summarySheetName];
if (summary) {
  summary['B3'] = { ...(summary['B3'] || {}), v: counts.total, t: 'n' };
  summary['C3'] = { ...(summary['C3'] || {}), v: counts.fixed, t: 'n' };
  summary['D3'] = { ...(summary['D3'] || {}), v: counts.partial, t: 'n' };
  summary['E3'] = { ...(summary['E3'] || {}), v: counts.pending, t: 'n' };
  summary['F3'] = { ...(summary['F3'] || {}), v: `${((counts.fixed / counts.total) * 100).toFixed(1)}%`, t: 's' };
  summary['G3'] = { ...(summary['G3'] || {}), v: '已同步福利專欄、i-Fare、公益夥伴手機版 RWD 修正：#27/#152/#157 已完成', t: 's' };
}

XLSX.writeFile(wb, file);
console.log(`Updated #27 and #152. Appended ${appended} row.`);
console.log(counts);
