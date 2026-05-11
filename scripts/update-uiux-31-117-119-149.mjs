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
    id: 31,
    verify:
      'articles.vue 已補福利專欄與懶人包 skeleton loading、空狀態與重試按鈕，載入期間不再直接空白。',
    note:
      '沿用全站 skeleton-line / article-item-skeleton 樣式，避免 API 較慢時頁面無回饋。',
  },
  {
    id: 117,
    verify:
      'welfareList / lazyList 已拆出 isLoading 與 hasError 狀態，載入中顯示骨架畫面，失敗時可直接重試。',
    note:
      '福利專欄列表頁現在會區分 loading / error / empty / success 四種狀態，與 news 頁一致。',
  },
  {
    id: 119,
    verify:
      'articles/welfare、articles/lazy、ifare/info 已改為 watch route query 重新抓資料，並移除同頁切換依賴 reload query 強制重整。',
    note:
      '同頁切換不同 id 時會直接更新內容；保留 watch route.query.reload 相容舊連結，但不再需要整頁 reload。',
  },
  {
    id: 149,
    verify:
      'route.global.ts 已改 client-only 記錄訪客，加入 sessionStorage 節流與排除 preview / API / 404 類路徑，避免重複呼叫。',
    note:
      '同一路徑 5 分鐘內不重複送訪客紀錄；reload query 仍可用，但不會在同一輪重複打記錄 API。',
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
    v: '更新 #31/#117/#119/#149：福利專欄 loading、detail 同頁切換與訪客紀錄節流',
    t: 's',
  };
}

XLSX.writeFile(wb, file, { compression: true });

console.log('Updated #31, #117, #119, #149.');
console.log(counts);
