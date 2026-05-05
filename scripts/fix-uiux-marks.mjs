// 修復 UIUX 追蹤清單 — 重新 paint 所有 已修正/部分修正 row
// 原 update-uiux-tracking.mjs Round 1-3 的 existingUpdates 那段忘了 paint，
// 這支腳本掃整份，把所有 status 對應的 row 都正確上色 (idempotent)。
// 同時補上「處理日期」如果缺。

import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FILL_FIXED = { patternType: 'solid', fgColor: { rgb: 'C6EFCE' } };
const FONT_FIXED = { color: { rgb: '006100' } };
const FILL_PARTIAL = { patternType: 'solid', fgColor: { rgb: 'FFEB9C' } };
const FONT_PARTIAL = { color: { rgb: '9C5700' } };
const COLS_ALL = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];

function paintRow(ws, row, fill, font) {
  for (const col of COLS_ALL) {
    const addr = `${col}${row}`;
    if (!ws[addr]) ws[addr] = { t: 's', v: '' };
    // xlsx-js-style 要 nested 格式 (s.fill / s.font) 才能正確寫入
    ws[addr].s = {
      ...(ws[addr].s || {}),
      fill,
      font,
      alignment: { vertical: 'center', wrapText: true },
    };
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(__dirname, '..', 'docs', 'iFare_UI_UX_問題追蹤清單.xlsx');

const wb = XLSX.readFile(FILE, { cellStyles: true });
const ws = wb.Sheets['UIUX問題追蹤清單'];
const range = XLSX.utils.decode_range(ws['!ref']);

let fixedRepainted = 0, partialRepainted = 0, alreadyOK = 0;
const TODAY = '2026-05-04';

for (let r = 2; r <= range.e.r; r++) {
  const status = ws[XLSX.utils.encode_cell({ r, c: 13 })]?.v;
  if (status !== '已修正' && status !== '部分修正') continue;

  // 重 paint
  if (status === '已修正') {
    paintRow(ws, r + 1, FILL_FIXED, FONT_FIXED);
    fixedRepainted++;
  } else {
    paintRow(ws, r + 1, FILL_PARTIAL, FONT_PARTIAL);
    partialRepainted++;
  }

  // 補日期：如果 O 欄空，填今天 (Round 4 補的用 2026-05-04，原本有日期的就不動)
  const dateCell = ws[XLSX.utils.encode_cell({ r, c: 14 })];
  if (!dateCell || !dateCell.v || String(dateCell.v).trim() === '') {
    ws[XLSX.utils.encode_cell({ r, c: 14 })] = { t: 's', v: TODAY };
  }
}

XLSX.writeFile(wb, FILE);

console.log(`✅ 重 paint 完成`);
console.log(`   已修正 (綠): ${fixedRepainted} 個`);
console.log(`   部分修正 (黃): ${partialRepainted} 個`);
console.log(`   檔案已存回: ${FILE}`);
