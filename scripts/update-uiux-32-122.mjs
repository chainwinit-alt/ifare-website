import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx-js-style';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.resolve(__dirname, '..', 'docs');
const workbookFileName = fs.readdirSync(docsDir).find((name) => name.endsWith('.xlsx'));

if (!workbookFileName) {
  throw new Error('UI/UX tracking workbook not found.');
}

const file = path.join(docsDir, workbookFileName);
const today = '2026-05-11';
const wb = XLSX.readFile(file, { cellStyles: true });
const trackingSheetName = wb.SheetNames.find((name) => name.includes('UIUX')) || wb.SheetNames[2];
const summarySheetName = wb.SheetNames[wb.SheetNames.length - 1];
const ws = wb.Sheets[trackingSheetName];
const summary = wb.Sheets[summarySheetName];

if (!ws) {
  throw new Error('Tracking worksheet not found.');
}

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
    if (Number(ws[cell(r, 0)]?.v) === id) {
      return r;
    }
  }

  throw new Error(`Issue #${id} not found.`);
};

const updates = [
  {
    id: 32,
    verify:
      '福利專欄與懶人包詳情頁標題下方已加入閱讀時間估算，依文章文字量與圖片量顯示「約 X 分鐘閱讀」。',
    note:
      '新增 useReadingTime.ts 共用估算邏輯；welfare 依文章內容估算，lazy 額外納入圖片數量。',
  },
  {
    id: 122,
    verify:
      'ifare/result.vue 清空按鈕已加入縮放動畫與「已清空篩選條件」短暫提示，清空後同步重置結果列表。',
    note:
      '桌機與手機版清空入口都共用同一組回饋狀態；提示採輕量 inline feedback，避免硬塞全站 toast。',
  },
];

for (const item of updates) {
  const row = findRowById(item.id);
  setCell(row, 12, item.verify);
  setCell(row, 13, '已修正');
  setCell(row, 14, today);
  setCell(row, 15, item.note);
}

const rows = XLSX.utils
  .sheet_to_json(ws, { header: 1, defval: '' })
  .slice(2)
  .filter((row) => row[0]);

const counts = {
  total: rows.length,
  fixed: rows.filter((row) => row[13] === '已修正').length,
  partial: rows.filter((row) => row[13] === '部分修正').length,
  pending: rows.filter((row) => row[13] === '待處理' || row[13] === '未修正').length,
};

if (summary) {
  summary.B3 = { ...(summary.B3 || {}), v: counts.total, t: 'n' };
  summary.C3 = { ...(summary.C3 || {}), v: counts.fixed, t: 'n' };
  summary.D3 = { ...(summary.D3 || {}), v: counts.partial, t: 'n' };
  summary.E3 = { ...(summary.E3 || {}), v: counts.pending, t: 'n' };
  summary.F3 = {
    ...(summary.F3 || {}),
    v: `${((counts.fixed / counts.total) * 100).toFixed(1)}%`,
    t: 's',
  };
  summary.G3 = {
    ...(summary.G3 || {}),
    v: '更新 #32/#122：閱讀時間估算與 i-Fare 清空篩選回饋',
    t: 's',
  };
}

XLSX.writeFile(wb, file, { compression: true });

console.log('Updated #32, #122.');
console.log(counts);
