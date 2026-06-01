// Round 9 (2026-05-04) — 批次 B: 5 個高優先安全/錯誤處理修正
//   #106 v-html XSS — 用 isomorphic-dompurify
//   #107 WebAPI 錯誤結構化 — 部分修正 (plugin 端做了，UI 端錯誤呈現待後續)
//   #108 API timeout 15 秒
//   #109 ifare/contact API 失敗處理
//   #118 iframe sandbox
// Run: node scripts/update-uiux-tracking-round9.mjs

import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(__dirname, '..', 'docs', 'iFare_問題追蹤與AI維運規劃.xlsx');
const TODAY = '2026-05-04';

const wb = XLSX.readFile(FILE, { cellStyles: true });
const ws = wb.Sheets['UIUX問題追蹤清單'];

// id → row mapping
// #106 = row 108, #107 = row 109, #108 = row 110, #109 = row 111, #118 = row 120
const updates = [
  {
    id: 106, row: 108, status: '已修正',
    note: 'Round 9 (批次 B): 安裝 isomorphic-dompurify (SSR + client safe)；新增 composables/useSanitize.ts 統一清理規範 (white-list ALLOWED_TAGS / ALLOWED_ATTR、阻 javascript:/data: URI、FORBID script/style/iframe/onerror)；7 處 v-html 用 useSanitize 包起來: news/info、articles/lazy、articles/welfare、ifare/info × 4 (qualification/welfareInfo/evidence/remark)。',
  },
  {
    id: 107, row: 109, status: '部分修正',
    note: 'Round 9 (批次 B): plugins/WebAPI.ts 加 categorizeError (timeout/network/client/server/unknown)、結構化 logError 取代 console.error、try-catch wrapper。Return signature 不變 (data/null) 維持向下相容，所有 caller 不用改。**UI 端錯誤呈現** (顯示 toast / 重試提示) 尚未做，需與整體錯誤元件設計一起。',
  },
  {
    id: 108, row: 110, status: '已修正',
    note: 'Round 9 (批次 B): plugins/WebAPI.ts WebApiGet/WebApiPost $fetch 加 timeout: API_TIMEOUT_MS (15000ms)。逾時會被 categorizeError 標記為 timeout 類別。',
  },
  {
    id: 109, row: 111, status: '已修正',
    note: 'Round 9 (批次 B): pages/ifare/contact.vue 重構為 loadOfficeUnit() async + isLoading/hasError ref。template 加 v-if 三分支: loading (skeleton-line role=status)、error (重試按鈕 role=alert)、success (原內容)。重試會清空既有資料再呼叫。',
  },
  {
    id: 118, row: 120, status: '已修正',
    note: 'Round 9 (批次 B): pages/news/info.vue 的 YouTube iframe 加 sandbox="allow-same-origin allow-scripts allow-presentation allow-popups"；移除非必要 allow="clipboard-write" (剪貼簿權限不應自動給)。',
  },
];

for (const u of updates) {
  ws[XLSX.utils.encode_cell({ r: u.row - 1, c: 13 })] = { t: 's', v: u.status };
  ws[XLSX.utils.encode_cell({ r: u.row - 1, c: 14 })] = { t: 's', v: TODAY };
  ws[XLSX.utils.encode_cell({ r: u.row - 1, c: 15 })] = { t: 's', v: u.note };
}

XLSX.writeFile(wb, FILE);
console.log(`✅ 標完 ${updates.length} 個項目`);
console.log('  ', updates.map(u => `#${u.id} (${u.status})`).join(', '));
