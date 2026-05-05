// 檢查 UIUX 追蹤清單所有「已修正 / 部分修正」項目是否都有：
//   1. 處理日期 (O 欄)
//   2. 顏色 fill (整行 A-P 應該都有 fill)
// 如果缺，列出來。

import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(__dirname, '..', 'docs', 'iFare_UI_UX_問題追蹤清單.xlsx');
const COLS_ALL = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];

const wb = XLSX.readFile(FILE, { cellStyles: true });
const ws = wb.Sheets['UIUX問題追蹤清單'];
const range = XLSX.utils.decode_range(ws['!ref']);

const issues = [];
let fixedCount = 0, partialCount = 0, untouchedCount = 0;

for (let r = 2; r <= range.e.r; r++) {
  const id = ws[XLSX.utils.encode_cell({ r, c: 0 })]?.v;
  const title = ws[XLSX.utils.encode_cell({ r, c: 7 })]?.v ?? '';
  const status = ws[XLSX.utils.encode_cell({ r, c: 13 })]?.v;
  const date = ws[XLSX.utils.encode_cell({ r, c: 14 })]?.v;

  if (status !== '已修正' && status !== '部分修正') {
    untouchedCount++;
    continue;
  }
  if (status === '已修正') fixedCount++;
  else partialCount++;

  // 檢查日期
  const hasDate = date && String(date).trim().length > 0;

  // 檢查顏色 — xlsx-js-style 把 fill 屬性 merge 到 s 物件 (s.fgColor + s.patternType)
  const cellA = ws[XLSX.utils.encode_cell({ r, c: 0 })];
  const hasColor = cellA?.s?.fgColor && cellA?.s?.patternType === 'solid';

  // 檢查所有 16 欄是否都有 fill
  let coloredCount = 0;
  for (const col of COLS_ALL) {
    const c = ws[`${col}${r + 1}`];
    if (c?.s?.fgColor && c?.s?.patternType === 'solid') coloredCount++;
  }

  if (!hasDate || !hasColor || coloredCount < 16) {
    issues.push({
      row: r + 1,
      id,
      status,
      title: String(title).slice(0, 30),
      date: hasDate ? date : '❌ 缺',
      color: hasColor ? `OK (${coloredCount}/16 欄)` : '❌ 缺',
    });
  }
}

console.log(`\n=== 統計 ===`);
console.log(`已修正: ${fixedCount}`);
console.log(`部分修正: ${partialCount}`);
console.log(`待處理 (跳過): ${untouchedCount}`);
console.log(`總計需檢查: ${fixedCount + partialCount}`);

if (issues.length === 0) {
  console.log(`\n✅ 全部 已修正/部分修正 項目都有正確的日期 + 顏色標註！`);
} else {
  console.log(`\n⚠️ ${issues.length} 個項目有缺漏：\n`);
  for (const u of issues) {
    console.log(`  R${u.row} #${u.id} (${u.status}) - ${u.title}`);
    console.log(`    日期: ${u.date}`);
    console.log(`    顏色: ${u.color}`);
  }
}
