// 修復 待處理 row 的樣式 — 我之前 add scripts 直接覆寫 cell 沒帶 style，導致顏色 / 字體 / alignment 全失
// 這支補上：alignment (vertical:center + wrapText) + 白底 (避免無填色看起來奇怪) + 保留現有 font
// 處理: UIUX問題追蹤清單 + 後臺優化 + PoC研究 三個 sheet 的 待處理 row
// Run: node scripts/fix-pending-rows.mjs

import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(__dirname, '..', 'docs', 'iFare_UI_UX_問題追蹤清單.xlsx');

const ALIGN_DEFAULT = { vertical: 'center', wrapText: true };

function columnLetters(count) {
  return Array.from({ length: count }, (_, index) => {
    let n = index;
    let result = '';
    do {
      result = String.fromCharCode(65 + (n % 26)) + result;
      n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    return result;
  });
}

function paintPendingRow(ws, row, cols) {
  for (const col of cols) {
    const addr = `${col}${row}`;
    if (!ws[addr]) ws[addr] = { t: 's', v: '' };
    // 移除可能殘留的 fill (例如更新前是綠/黃不慎被 carried over)、保留 font、加 alignment
    const existingFont = ws[addr].s?.font;
    ws[addr].s = {
      ...(existingFont ? { font: existingFont } : {}),
      alignment: ALIGN_DEFAULT,
      // 不設 fill = default
    };
  }
}

const wb = XLSX.readFile(FILE, { cellStyles: true });

const SHEETS = ['UIUX問題追蹤清單', '後臺優化', 'PoC研究'];
let total = 0;

for (const sheetName of SHEETS) {
  const ws = wb.Sheets[sheetName];
  if (!ws) continue;
  const range = XLSX.utils.decode_range(ws['!ref']);
  const cols = columnLetters(range.e.c + 1);
  let count = 0;

  for (let r = 2; r <= range.e.r; r++) {
    const status = ws[XLSX.utils.encode_cell({ r, c: 13 })]?.v;
    if (status !== '待處理') continue;
    paintPendingRow(ws, r + 1, cols);
    count++;
  }
  console.log(`✅ ${sheetName}: 待處理 ${count} row 已套用標準對齊樣式`);
  total += count;
}

XLSX.writeFile(wb, FILE);
console.log('---');
console.log(`✅ 完成 共 ${total} 個 待處理 row 修復`);
console.log(`   檔案: ${FILE}`);
