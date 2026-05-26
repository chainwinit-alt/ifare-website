import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.resolve(__dirname, '..', 'docs', 'iFare_問題追蹤與AI維運規劃.xlsx');
const sheetName = 'UIUX問題追蹤清單';
const summarySheetName = '統計摘要';

const wb = XLSX.readFile(file, { cellStyles: true });
const ws = wb.Sheets[sheetName];
if (!ws) throw new Error(`Worksheet not found: ${sheetName}`);

const range = XLSX.utils.decode_range(ws['!ref']);
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
const existingIds = new Set(rows.slice(2).map((row) => Number(row[0])).filter(Boolean));

const issues = [
  [
    155,
    'V',
    'i-Fare 福利查詢',
    'FAQ 手風琴',
    '修復',
    '互動',
    '高',
    'FAQ 點開後視覺上無法收回，收合內容仍外溢顯示',
    'FAQ 收合狀態只將 .faq-info 高度設為 0，但沒有 overflow hidden；內容仍會露出，使用者會感覺頁籤無法收回。',
    '新增 ToggleQA() 統一切換狀態；.faq-info 改用 max-height/opacity transition 並加 overflow:hidden；補 focus-visible 樣式避免瀏覽器預設黑框干擾視覺。',
    'pages/ifare.vue assets/style/components/_appBody_ifare.scss',
    'Dev/Dev Code/iFare_Frontend/pages/ifare.vue\r\nDev/Dev Code/iFare_Frontend/assets/style/components/_appBody_ifare.scss',
    '依使用者截圖回報；已修正收合內容外溢問題。',
    '已修正',
    '2026-05-11',
    '新增 ToggleQA(item)，FAQ CSS 加 overflow:hidden、max-height transition、focus-visible 樣式。',
  ],
  [
    156,
    'V',
    '首頁',
    '手機版最新消息',
    '提升',
    '視覺',
    '中',
    '手機版最新消息卡片視覺層級過重，箭頭與文字排版不夠精緻',
    '手機版最新消息卡片標題、日期與摘要的層級較擁擠；箭頭跟隨文字流排版，視覺上較散，使用者回報呈現效果不佳。',
    '調整手機版 news card padding、間距、陰影、標題字級、日期 pill、摘要顏色與箭頭絕對定位，讓卡片更清爽且可點擊暗示更穩定。',
    'assets/style/rwd/_rwd_index.scss',
    'Dev/Dev Code/iFare_Frontend/assets/style/rwd/_rwd_index.scss',
    '依使用者截圖回報；先做手機首頁最新消息區塊視覺修正。',
    '已修正',
    '2026-05-11',
    '調整 .section-news .news-list 手機版卡片樣式：縮小 gap、優化 padding/陰影/標題字級/日期 pill/箭頭定位。',
  ],
];

const templateRowIndex = range.e.r;
const nextRowStart = range.e.r + 1;
let appended = 0;

for (const issue of issues) {
  if (existingIds.has(issue[0])) continue;
  const r = nextRowStart + appended;
  for (let c = 0; c < issue.length; c += 1) {
    const addr = XLSX.utils.encode_cell({ r, c });
    const templateAddr = XLSX.utils.encode_cell({ r: templateRowIndex, c });
    ws[addr] = {
      v: issue[c],
      t: typeof issue[c] === 'number' ? 'n' : 's',
      s: ws[templateAddr]?.s ? JSON.parse(JSON.stringify(ws[templateAddr].s)) : undefined,
    };
  }
  appended += 1;
}

if (appended > 0) {
  ws['!ref'] = XLSX.utils.encode_range({
    s: range.s,
    e: { r: range.e.r + appended, c: Math.max(range.e.c, 15) },
  });
}

const updatedRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }).slice(2).filter((row) => row[0]);
const counts = {
  total: updatedRows.length,
  fixed: updatedRows.filter((row) => row[13] === '已修正').length,
  partial: updatedRows.filter((row) => row[13] === '部分修正').length,
  pending: updatedRows.filter((row) => row[13] === '待處理').length,
};

const summary = wb.Sheets[summarySheetName];
if (summary) {
  summary['B3'] = { ...(summary['B3'] || {}), v: counts.total, t: 'n' };
  summary['C3'] = { ...(summary['C3'] || {}), v: counts.fixed, t: 'n' };
  summary['D3'] = { ...(summary['D3'] || {}), v: counts.partial, t: 'n' };
  summary['E3'] = { ...(summary['E3'] || {}), v: counts.pending, t: 'n' };
  summary['F3'] = { ...(summary['F3'] || {}), v: `${((counts.fixed / counts.total) * 100).toFixed(1)}%`, t: 's' };
  summary['G3'] = { ...(summary['G3'] || {}), v: '已同步最新前台追蹤清單，新增 #155-#156 並完成', t: 's' };
}

XLSX.writeFile(wb, file);
console.log(`Appended ${appended} rows.`);
console.log(counts);
