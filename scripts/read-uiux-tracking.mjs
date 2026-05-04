// 一次性 dump 工具：讀 docs xlsx + Desktop 版 xlsx 比對
// 用法：node scripts/read-uiux-tracking.mjs
import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILES = [
  { tag: 'docs', file: path.resolve(__dirname, '..', 'docs', 'iFare_UI_UX_問題追蹤清單.xlsx') },
  { tag: 'desktop', file: 'C:/Users/emma.chung/Desktop/work/iFare_UI_UX_問題追蹤清單_已更新.xlsx' },
];

for (const { tag, file } of FILES) {
  console.log(`\n========== [${tag}] ${file} ==========`);
  let wb;
  try {
    wb = XLSX.readFile(file, { cellStyles: true });
  } catch (e) {
    console.log('ERROR reading:', e.message);
    continue;
  }
  console.log('Sheets:', wb.SheetNames);

  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    console.log(`\n--- Sheet: "${name}" (rows ${range.s.r + 1}-${range.e.r + 1}, cols ${range.s.c}-${range.e.c}) ---`);

    // 印 header (row 1-2 通常是標題列)
    const headerRows = Math.min(2, range.e.r);
    for (let r = 0; r <= headerRows; r++) {
      const row = [];
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cell = ws[XLSX.utils.encode_cell({ r, c })];
        row.push(cell?.v ?? '');
      }
      console.log(`Row ${r + 1}:`, row.slice(0, 16).map(v => String(v).slice(0, 30)).join(' | '));
    }

    // 印第一個 issue 列當範例
    if (range.e.r >= 2) {
      const row = [];
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cell = ws[XLSX.utils.encode_cell({ r: 2, c })];
        row.push(cell?.v ?? '');
      }
      console.log(`Row 3 example:`, row.slice(0, 16).map(v => String(v).slice(0, 30)).join(' | '));
    }

    // 印最後 5 個 row 看最新進度
    console.log(`Last 5 rows:`);
    for (let r = Math.max(range.s.r, range.e.r - 4); r <= range.e.r; r++) {
      const row = [];
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cell = ws[XLSX.utils.encode_cell({ r, c })];
        row.push(cell?.v ?? '');
      }
      console.log(`  R${r + 1}:`, row.slice(0, 16).map(v => String(v).slice(0, 25)).join(' | '));
    }

    // 統計：N 欄 (status) 各值出現次數
    const statusCount = {};
    for (let r = 2; r <= range.e.r; r++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c: 13 })]; // N column = index 13
      const v = cell?.v ?? '(空)';
      statusCount[v] = (statusCount[v] || 0) + 1;
    }
    console.log(`Status (N欄) counts:`, statusCount);
  }
}
