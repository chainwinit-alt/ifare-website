import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.resolve(__dirname, '..', 'docs', 'iFare_問題追蹤與AI維運規劃.xlsx');
const sheetName = 'UIUX問題追蹤清單';
const summarySheetName = '統計摘要';
const today = '2026-05-11';

const wb = XLSX.readFile(file, { cellStyles: true });
const ws = wb.Sheets[sheetName];
if (!ws) throw new Error(`Worksheet not found: ${sheetName}`);

const range = XLSX.utils.decode_range(ws['!ref']);
const cell = (r, c) => XLSX.utils.encode_cell({ r, c });

const setCell = (r, c, value) => {
  const addr = cell(r, c);
  ws[addr] = {
    ...(ws[addr] || {}),
    v: value,
    t: typeof value === 'number' ? 'n' : 's',
  };
};

const findRowById = (id) => {
  for (let r = 2; r <= range.e.r; r += 1) {
    if (Number(ws[cell(r, 0)]?.v) === id) return r;
  }
  throw new Error(`Issue #${id} not found`);
};

const updates = [
  {
    id: 124,
    verify: '首頁與福利專欄列表的 keywords 標籤已加入高度截斷與換行限制，過多標籤不再撐壞卡片版面。',
    note: '新增 tags-list-clamp 樣式，套用於首頁文章卡片與福利專欄列表的關鍵字區塊，限制最大高度為 60px 並隱藏超出內容。',
  },
  {
    id: 128,
    verify: '四個 ShareWebUrlToLine 呼叫點已改為共用 composable，加入 try/catch；若 LINE 分享頁開啟失敗，會顯示分享失敗提示。',
    note: '新增 composables/useShareToLine.ts，統一處理 LINE 分享連結與錯誤回饋；news/info、articles/lazy、articles/welfare、ifare/info 已改用共用分享函式。',
  },
  {
    id: 150,
    verify: 'preview.vue 不再使用 postMessage(\"*\")，改為根據 document.referrer / ALLOWED_ORIGINS 解析 targetOrigin。',
    note: 'preview ready 訊息已改為只送往允許來源，避免對任意父視窗廣播 postMessage。',
  },
];

for (const item of updates) {
  const row = findRowById(item.id);
  setCell(row, 12, item.verify);
  setCell(row, 13, '已修正');
  setCell(row, 14, today);
  setCell(row, 15, item.note);
}

const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }).slice(2).filter((row) => row[0]);
const counts = {
  total: rows.length,
  fixed: rows.filter((row) => row[13] === '已修正').length,
  partial: rows.filter((row) => row[13] === '部分修正').length,
  pending: rows.filter((row) => row[13] === '未修正' || row[13] === '待處理').length,
};

const summary = wb.Sheets[summarySheetName];
if (summary) {
  summary['B3'] = { ...(summary['B3'] || {}), v: counts.total, t: 'n' };
  summary['C3'] = { ...(summary['C3'] || {}), v: counts.fixed, t: 'n' };
  summary['D3'] = { ...(summary['D3'] || {}), v: counts.partial, t: 'n' };
  summary['E3'] = { ...(summary['E3'] || {}), v: counts.pending, t: 'n' };
  summary['F3'] = { ...(summary['F3'] || {}), v: `${((counts.fixed / counts.total) * 100).toFixed(1)}%`, t: 's' };
  summary['G3'] = {
    ...(summary['G3'] || {}),
    v: '更新 #124/#128/#150：標籤截斷、LINE 分享失敗回饋與 preview postMessage 安全性',
    t: 's',
  };
}

XLSX.writeFile(wb, file, { compression: true });
console.log('Updated #124, #128, #150.');
console.log(counts);
