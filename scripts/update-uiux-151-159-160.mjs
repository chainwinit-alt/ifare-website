import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.resolve(__dirname, '..', 'docs', 'iFare_UI_UX_問題追蹤清單.xlsx');
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
    id: 151,
    status: '已修正',
    note: '統計摘要已隨本次更新重算，總數、已修正、部分修正、待處理與完成率皆與 UIUX 問題追蹤清單資料列同步。',
    verify: '已確認統計摘要與實際資料列一致，並由更新腳本同步維護。',
  },
  {
    id: 159,
    status: '已修正',
    note: '已在 /api/chatbot 補上 Gemini API 錯誤分類，區分 timeout、auth/key、quota/rate limit、bad request、server、network 與 unknown，並回傳前端可直接顯示的友善訊息。',
    verify: 'server/api/chatbot.post.ts 已回傳 errorCode、retryable、reply；前端會顯示友善 reply。',
  },
  {
    id: 160,
    status: '部分修正',
    note: '已先完成基本防護：Gemini API 15 秒 timeout、每 IP 每分鐘 12 次簡易 rate limit、Retry-After header、防重複送出與 maxOutputTokens 從 700 降為 500；正式多機部署仍建議改用集中式 rate limit 或後端閘道。',
    verify: 'server/api/chatbot.post.ts 已加入 in-memory rate limit、AbortController timeout、錯誤退避訊息與 token 上限調整。',
  },
];

for (const item of updates) {
  const row = findRowById(item.id);
  setCell(row, 12, item.verify);
  setCell(row, 13, item.status);
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
    v: '更新 #151/#159/#160：統計摘要同步、Gemini 錯誤分類與基本用量防護',
    t: 's',
  };
}

XLSX.writeFile(wb, file, { compression: true });
console.log('Updated #151, #159, #160.');
console.log(counts);
