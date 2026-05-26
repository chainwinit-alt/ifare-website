// 2026-05-12 — 後臺優化 #44「全域快速搜尋與跳轉」標記為部分修正
// 這次先完成首頁可搜尋工作入口 + 最近使用，不是完整 Cmd+K 全域搜尋。
// Run: node scripts/update-backend-home-search-2026-05-12.mjs

import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(__dirname, '..', 'docs', 'iFare_問題追蹤與AI維運規劃.xlsx');
const SHEET = '後臺優化';
const TARGET_ID = 44;
const TODAY = '2026-05-12';
const FILL_PARTIAL = { patternType: 'solid', fgColor: { rgb: 'FFEB9C' } };
const FONT_PARTIAL = { color: { rgb: '9C5700' } };

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

function paintRow(ws, rowNumber, cols) {
  for (const col of cols) {
    const addr = `${col}${rowNumber}`;
    if (!ws[addr]) ws[addr] = { t: 's', v: '' };
    ws[addr].s = {
      ...(ws[addr].s || {}),
      fill: FILL_PARTIAL,
      font: FONT_PARTIAL,
      alignment: { vertical: 'center', wrapText: true },
    };
  }
}

const wb = XLSX.readFile(FILE, { cellStyles: true });
const ws = wb.Sheets[SHEET];
if (!ws) throw new Error(`Sheet not found: ${SHEET}`);

const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
const cols = columnLetters(range.e.c + 1);

let targetRow = -1;
for (let r = 2; r <= range.e.r; r++) {
  const id = ws[XLSX.utils.encode_cell({ r, c: 0 })]?.v;
  if (Number(id) === TARGET_ID) {
    targetRow = r;
    break;
  }
}

if (targetRow < 0) {
  throw new Error(`Cannot find backend issue #${TARGET_ID}`);
}

ws[XLSX.utils.encode_cell({ r: targetRow, c: 13 })] = { t: 's', v: '部分修正' };
ws[XLSX.utils.encode_cell({ r: targetRow, c: 14 })] = { t: 's', v: TODAY };
ws[XLSX.utils.encode_cell({ r: targetRow, c: 15 })] = {
  t: 's',
  v: '已先完成首頁可搜尋工作入口：HomeView 新增模組搜尋、分組篩選、最近使用與 Ctrl/Cmd+K 聚焦搜尋框。此版本屬於「首頁入口搜尋」而非完整 Cmd+K 全域搜尋彈窗，故標記為部分修正。',
};

paintRow(ws, targetRow + 1, cols);

XLSX.writeFile(wb, FILE);
console.log(`✅ 後臺優化 #${TARGET_ID} 已標記為部分修正 (${TODAY})`);
