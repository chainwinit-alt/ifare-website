import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.resolve(__dirname, '..', 'docs', 'iFare_UI_UX_問題追蹤清單.xlsx');
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
    152,
    'V',
    '公益夥伴',
    '手機篩選列',
    '修復',
    'RWD',
    '中',
    '公益夥伴篩選區在手機仍保留 min-width，可能造成橫向 overflow',
    'collaborator.vue 的分類 chip 使用 min-width: 100px，搜尋框使用 min-width: 240px；手機版只補 max-width: 100%，未明確移除 min-width。小寬度裝置或字數較長時仍可能擠壓或產生橫向捲動。',
    '在 768px 以下將 chip 改為 flex: 1 1 auto 或 width: 100%，搜尋框移除 min-width 並補 min-width: 0；用 360/390/430px 寬度驗證不 overflow。',
    'pages/collaborator.vue',
    'Dev/Dev Code/iFare_Frontend/pages/collaborator.vue',
    '程式碼可見 min-width:100px、min-width:240px；手機 media query 目前只設定 search-input-wrap max-width:100%。',
    '待處理',
    '',
    '',
  ],
  [
    153,
    'V',
    '全站通用',
    '聊天機器人手機視窗',
    '修復',
    'RWD',
    '中',
    '聊天機器人手機版使用 100vh，可能被行動瀏覽器網址列遮擋',
    'CompChatbotWelcome.vue 在 768px 以下設定 width:100vw、height:100vh、max-height:100vh。手機 Safari/Chrome 的網址列與工具列會讓 100vh 高度不穩，可能造成輸入框被遮或底部超出。',
    '改用 100dvh，並保留 safe-area-inset-bottom；必要時補 max-height: 100dvh 與 overflow 控制。',
    'components/CompChatbotWelcome.vue',
    'Dev/Dev Code/iFare_Frontend/components/CompChatbotWelcome.vue',
    '已確認 @media (max-width:768px) 內使用 height:100vh / max-height:100vh。',
    '待處理',
    '',
    '',
  ],
  [
    154,
    'V',
    '全站通用',
    'RWD 驗證流程',
    '提升',
    'RWD',
    '中',
    '缺少固定 viewport 的 RWD 回歸檢查清單',
    '目前已有多個 RWD SCSS 檔，但沒有固定尺寸驗證流程；新增樣式後難以穩定發現 390x844、430x932、768x1024、1024x768、1366x768 等尺寸的 overflow、重疊、文字截斷問題。',
    '建立 Playwright 或手動 QA checklist，至少覆蓋首頁、最新消息、福利專欄、i-Fare 搜尋/結果/詳情、公益夥伴、聊天機器人；檢查 horizontal overflow、tap target、fixed/sticky、safe-area。',
    'assets/style/rwd/** pages/** components/**',
    'Dev/Dev Code/iFare_Frontend/assets/style/rwd/**/*.scss\r\nDev/Dev Code/iFare_Frontend/pages/**/*.vue\r\nDev/Dev Code/iFare_Frontend/components/**/*.vue',
    '本次程式碼審查僅能確認 RWD 架構存在，仍需固定 viewport 視覺驗證。',
    '待處理',
    '',
    '',
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
  summary['G3'] = { ...(summary['G3'] || {}), v: '已同步最新前台追蹤清單，新增 #145-#154', t: 's' };
}

XLSX.writeFile(wb, file);
console.log(`Appended ${appended} rows.`);
console.log(counts);
