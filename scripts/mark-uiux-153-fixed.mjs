import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.resolve(__dirname, '..', 'docs', 'iFare_問題追蹤與AI維運規劃.xlsx');
const sheetName = 'UIUX問題追蹤清單';
const summarySheetName = '統計摘要';

const wb = XLSX.readFile(file, { cellStyles: true });
const ws = wb.Sheets[sheetName];
if (!ws) throw new Error(`Worksheet not found: ${sheetName}`);

const range = XLSX.utils.decode_range(ws['!ref']);
let updated = false;

for (let r = 2; r <= range.e.r; r += 1) {
  const idCell = ws[XLSX.utils.encode_cell({ r, c: 0 })];
  if (Number(idCell?.v) !== 153) continue;

  ws[XLSX.utils.encode_cell({ r, c: 13 })] = { ...(ws[XLSX.utils.encode_cell({ r, c: 13 })] || {}), v: '已修正', t: 's' };
  ws[XLSX.utils.encode_cell({ r, c: 14 })] = { ...(ws[XLSX.utils.encode_cell({ r, c: 14 })] || {}), v: '2026-05-11', t: 's' };
  ws[XLSX.utils.encode_cell({ r, c: 15 })] = {
    ...(ws[XLSX.utils.encode_cell({ r, c: 15 })] || {}),
    v: '將 CompChatbotWelcome.vue 手機版 .chatbot-window height/max-height 從 100vh 改為 100dvh，保留 safe-area-inset-bottom，降低手機瀏覽器網址列遮擋風險。',
    t: 's',
  };
  updated = true;
  break;
}

if (!updated) throw new Error('Issue #153 not found');

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
  summary['G3'] = { ...(summary['G3'] || {}), v: '已同步最新前台追蹤清單，#153 已修正', t: 's' };
}

XLSX.writeFile(wb, file);
console.log(counts);
