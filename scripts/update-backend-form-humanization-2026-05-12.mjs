// 2026-05-12 — 後臺優化欄位人性化快改
// 本次先針對 PageManagement_AddEditView 補上 URL 預覽、狀態說明、SEO 預覽、常用標籤建議、排程快捷鍵。
// 對應將 #27 / #45 / #47 / #49 標為「部分修正」。
// Run: node scripts/update-backend-form-humanization-2026-05-12.mjs

import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(__dirname, '..', 'docs', 'iFare_UI_UX_問題追蹤清單.xlsx');
const SHEET = '後臺優化';
const TODAY = '2026-05-12';
const TARGETS = [
  {
    id: 27,
    note: '2026-05-12：先在 PageManagement_AddEditView 補強欄位說明與範例，包含頁面名稱用途說明、Slug 操作提示、URL 預覽、SEO 描述搜尋結果預覽。屬於單一頁面快改，整體後台尚未全面套用，故標記為部分修正。',
  },
  {
    id: 45,
    note: '2026-05-12：先把 PageManagement_AddEditView 的關鍵欄位說明改白話，例如頁面狀態改成可理解的說明區塊、Slug 加前台網址預覽、SEO 描述改成更接近使用者語言。其他模組尚未套用，故標記為部分修正。',
  },
  {
    id: 47,
    note: '2026-05-12：先在 PageManagement_AddEditView 補上排程快捷鍵（立即發布、今天 18:00、明天 09:00、7 天後 / 30 天後下架），降低使用者手動選時間的成本。尚未建立全後台預設值規範，故標記為部分修正。',
  },
  {
    id: 49,
    note: '2026-05-12：先在 PageManagement_AddEditView 補上狀態說明與發布結果摘要，讓使用者知道目前是草稿、前台可見、手動下架或依排程上下架。此版本屬於單頁狀態視覺化，故標記為部分修正。',
  },
];
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

for (const target of TARGETS) {
  let targetRow = -1;
  for (let r = 2; r <= range.e.r; r++) {
    const id = ws[XLSX.utils.encode_cell({ r, c: 0 })]?.v;
    if (Number(id) === target.id) {
      targetRow = r;
      break;
    }
  }

  if (targetRow < 0) {
    throw new Error(`Cannot find backend issue #${target.id}`);
  }

  ws[XLSX.utils.encode_cell({ r: targetRow, c: 13 })] = { t: 's', v: '部分修正' };
  ws[XLSX.utils.encode_cell({ r: targetRow, c: 14 })] = { t: 's', v: TODAY };
  ws[XLSX.utils.encode_cell({ r: targetRow, c: 15 })] = { t: 's', v: target.note };
  paintRow(ws, targetRow + 1, cols);
}

XLSX.writeFile(wb, FILE);
console.log(`✅ 已更新 ${SHEET}：${TARGETS.map((target) => `#${target.id}`).join(', ')} → 部分修正 (${TODAY})`);
