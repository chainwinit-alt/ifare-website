// 修復 待處理 row 的樣式 — 我之前 add scripts 直接覆寫 cell 沒帶 style，導致顏色 / 字體 / alignment 全失
// 這支補上：alignment (vertical:center + wrapText) + 白底 (避免無填色看起來奇怪) + 保留現有 font
// 處理: UIUX問題追蹤清單 + 後臺優化 + PoC研究 三個 sheet 的 待處理 row
// Run: node scripts/fix-pending-rows.mjs

import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(__dirname, '..', 'docs', 'iFare_UI_UX_問題追蹤清單.xlsx');

// 待處理 row 用「無填色」(等同 default 白底) + 標準對齊
const FILL_PENDING = null; // 不設定 fill = 預設白色 / 無
const ALIGN_DEFAULT = { vertical: 'center', wrapText: true };

const COLS_ALL = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];

function paintPendingRow(ws, row) {
  for (const col of COLS_ALL) {
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
  let count = 0;

  for (let r = 2; r <= range.e.r; r++) {
    const status = ws[XLSX.utils.encode_cell({ r, c: 13 })]?.v;
    if (status !== '待處理') continue;
    paintPendingRow(ws, r + 1);
    count++;
  }
  console.log(`✅ ${sheetName}: 待處理 ${count} row 已套用標準對齊樣式`);
  total += count;
}

XLSX.writeFile(wb, FILE);
console.log('---');
console.log(`✅ 完成 共 ${total} 個 待處理 row 修復`);
console.log(`   檔案: ${FILE}`);
