import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx-js-style';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.resolve(__dirname, '..', 'docs');
const fileName = fs.readdirSync(docsDir).find((name) => name.endsWith('.xlsx') && name.includes('UI_UX'));
if (!fileName) throw new Error('Cannot find UI/UX tracking workbook under docs/.');

const file = path.join(docsDir, fileName);
const wb = XLSX.readFile(file, { cellStyles: true });
const ws = wb.Sheets['UIUX問題追蹤清單'];
if (!ws) throw new Error('Worksheet not found: UIUX問題追蹤清單');

const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
const rowIndex = rows.findIndex((row) => Number(row[0]) === 169);
if (rowIndex < 0) throw new Error('Cannot find UIUX task #169.');

const note = [
  '2026-05-18 MVP：新增 useWelfareCompare，以 localStorage 收藏最多 8 個福利方案。',
  '搜尋結果與詳情頁都可加入/移除收藏，/ifare/compare 可比較申請條件、文件、期限、承辦窗口與限制差異。',
  '正式版仍建議接會員或後台儲存，支援跨裝置同步與更完整的結構化比較欄位。',
].join('\n');

ws[XLSX.utils.encode_cell({ r: rowIndex, c: 13 })] = {
  ...(ws[XLSX.utils.encode_cell({ r: rowIndex, c: 13 })] || {}),
  t: 's',
  v: '部分修正',
};
ws[XLSX.utils.encode_cell({ r: rowIndex, c: 14 })] = {
  ...(ws[XLSX.utils.encode_cell({ r: rowIndex, c: 14 })] || {}),
  t: 's',
  v: '2026-05-18',
};
ws[XLSX.utils.encode_cell({ r: rowIndex, c: 15 })] = {
  ...(ws[XLSX.utils.encode_cell({ r: rowIndex, c: 15 })] || {}),
  t: 's',
  v: note,
};

const updatedRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }).slice(2).filter((row) => row[0]);
const counts = {
  total: updatedRows.length,
  fixed: updatedRows.filter((row) => row[13] === '已修正').length,
  partial: updatedRows.filter((row) => row[13] === '部分修正').length,
  pending: updatedRows.filter((row) => row[13] === '待處理').length,
};

const summary = wb.Sheets['統計摘要'];
if (summary) {
  summary.B3 = { ...(summary.B3 || {}), t: 'n', v: counts.total };
  summary.C3 = { ...(summary.C3 || {}), t: 'n', v: counts.fixed };
  summary.D3 = { ...(summary.D3 || {}), t: 'n', v: counts.partial };
  summary.E3 = { ...(summary.E3 || {}), t: 'n', v: counts.pending };
  summary.F3 = { ...(summary.F3 || {}), t: 's', v: `${((counts.fixed / counts.total) * 100).toFixed(1)}%` };
  summary.G3 = {
    ...(summary.G3 || {}),
    t: 's',
    v: '2026-05-18：#167-#174 前台福利進階功能皆已完成 MVP，後續可進入後台資料結構與跨裝置同步。',
  };
}

XLSX.writeFile(wb, file);
console.log('Marked #169 as 部分修正.');
console.log(counts);
