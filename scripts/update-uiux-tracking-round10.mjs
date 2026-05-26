// Round 10 (2026-05-04) — News 影片改方案 (B → A: sanitize 白名單放行 YouTube iframe)
//   #102 News videoUrl wiring → 已修正 (改方案)
//   後臺優化 #13 News VideoUrl 欄位 .NET 配合 → 已修正 (取消)
// Run: node scripts/update-uiux-tracking-round10.mjs

import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(__dirname, '..', 'docs', 'iFare_問題追蹤與AI維運規劃.xlsx');
const TODAY = '2026-05-04';

const wb = XLSX.readFile(FILE, { cellStyles: true });
const wsUiux = wb.Sheets['UIUX問題追蹤清單'];
const wsBackend = wb.Sheets['後臺優化'];

// UIUX #102 → row 104
const uiuxRow = 104;
wsUiux[XLSX.utils.encode_cell({ r: uiuxRow - 1, c: 13 })] = { t: 's', v: '已修正' };
wsUiux[XLSX.utils.encode_cell({ r: uiuxRow - 1, c: 14 })] = { t: 's', v: TODAY };
wsUiux[XLSX.utils.encode_cell({ r: uiuxRow - 1, c: 15 })] = {
  t: 's',
  v: 'Round 10: 改方案 — 從「.NET 加 VideoUrl 欄位」改成「sanitize 白名單放行 YouTube iframe」。admin 在 News HTML 編輯器內貼 YouTube「分享 → 嵌入」code，前台 useSanitize 自動驗證 src 必須是 youtube.com/embed/ 才放行，否則整個 iframe 拔掉。並自動補 sandbox / referrerpolicy / loading=lazy 安全屬性。前台 .raw-html 內 iframe 套 16:9 響應式 + 圓角 + 陰影。完全不需 .NET 配合。文件: docs/iFare_News_影片嵌入指南.md。',
};

// 後臺優化 #13 → row 15
const backendRow = 15;
wsBackend[XLSX.utils.encode_cell({ r: backendRow - 1, c: 13 })] = { t: 's', v: '已修正' };
wsBackend[XLSX.utils.encode_cell({ r: backendRow - 1, c: 14 })] = { t: 's', v: TODAY };
wsBackend[XLSX.utils.encode_cell({ r: backendRow - 1, c: 15 })] = {
  t: 's',
  v: 'Round 10: 取消 — 改用前台 sanitize 白名單方式達成 (見 UIUX #102 與 docs/iFare_News_影片嵌入指南.md)。.NET News.cs / DTO / TaskManager 不需動，本機 News.cs 已 git restore。後台 admin News_AddEditView 影片網址 input 已撤掉，回歸只用 HTML 編輯器內貼 iframe。',
};

XLSX.writeFile(wb, FILE);
console.log('✅ Round 10 標完');
console.log('   UIUX #102 → 已修正 (改方案 A)');
console.log('   後臺優化 #13 → 已修正 (取消)');
