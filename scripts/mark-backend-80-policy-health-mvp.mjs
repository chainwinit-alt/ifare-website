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
const ws = wb.Sheets['後臺優化'];
if (!ws) throw new Error('Worksheet not found: 後臺優化');

const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
const rowIndex = rows.findIndex((row) => Number(row[0]) === 80);
if (rowIndex < 0) throw new Error('Cannot find backend task #80.');

const note = [
  '2026-05-18 MVP：福利政策新增/編輯頁新增「前台功能支援檢核」。',
  '即時檢查申請條件、應備文件、福利內容、承辦窗口、下架日期、政策類別/地區/關鍵字是否足夠支援前台申請助手、文件清單、期限提醒與比較。',
  '正式版仍建議再做跨政策健康檢查 Dashboard、連結檢查與後端規則 API。',
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
  summary.B4 = { ...(summary.B4 || {}), t: 'n', v: counts.total };
  summary.C4 = { ...(summary.C4 || {}), t: 'n', v: counts.fixed };
  summary.D4 = { ...(summary.D4 || {}), t: 'n', v: counts.partial };
  summary.E4 = { ...(summary.E4 || {}), t: 'n', v: counts.pending };
  summary.F4 = { ...(summary.F4 || {}), t: 's', v: `${((counts.fixed / counts.total) * 100).toFixed(1)}%` };
  summary.G4 = {
    ...(summary.G4 || {}),
    t: 's',
    v: '2026-05-18：已補入 i-Fare 前台進階功能對應後台支援任務 #73-#82，#80 政策健康檢查完成編輯頁 MVP。',
  };
}

XLSX.writeFile(wb, file);
console.log('Marked backend #80 as 部分修正.');
console.log(counts);
