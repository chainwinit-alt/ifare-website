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

let updated = false;
for (let r = 2; r <= range.e.r; r += 1) {
  if (Number(ws[cell(r, 0)]?.v) !== 157) continue;
  ws[cell(r, 15)] = {
    ...(ws[cell(r, 15)] || {}),
    v: '再補強受助者年齡區間手機版：將 tag list 改為兩欄等寬 grid，按鈕固定高度與滿版對齊，避免長短文字讓排版歪斜，並維持搜尋 CTA 與上方欄位一致。',
    t: 's',
  };
  updated = true;
  break;
}

if (!updated) throw new Error('Issue #157 not found');

const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }).slice(2).filter((row) => row[0]);
const counts = {
  total: rows.length,
  fixed: rows.filter((row) => row[13] === '已修正').length,
  partial: rows.filter((row) => row[13] === '部分修正').length,
  pending: rows.filter((row) => row[13] === '待處理').length,
};

const summary = wb.Sheets[summarySheetName];
if (summary) {
  summary['B3'] = { ...(summary['B3'] || {}), v: counts.total, t: 'n' };
  summary['C3'] = { ...(summary['C3'] || {}), v: counts.fixed, t: 'n' };
  summary['D3'] = { ...(summary['D3'] || {}), v: counts.partial, t: 'n' };
  summary['E3'] = { ...(summary['E3'] || {}), v: counts.pending, t: 'n' };
  summary['F3'] = { ...(summary['F3'] || {}), v: `${((counts.fixed / counts.total) * 100).toFixed(1)}%`, t: 's' };
  summary['G3'] = { ...(summary['G3'] || {}), v: '已補強 #157 i-Fare 年齡區間手機 tag 兩欄對齊', t: 's' };
}

XLSX.writeFile(wb, file);
console.log('Updated #157 age tag note.');
console.log(counts);
