// 2026-05-25 — mark #175 與 #181 為「部分修正」
// #175 公開 API 可無驗證覆寫頁面資料與上傳檔案：commit ae1c85a 補 token 驗證 + CORS 白名單
// #181 API 與同步 URL 硬寫：commit ae1c85a 補前台 .env.example 與 nuxt.config runtime config（後台 AjaxRef.ts 仍待）
// Run: node scripts/mark-uiux-175-181-partial.mjs

import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.resolve(__dirname, '..', 'docs', 'iFare_問題追蹤與AI維運規劃.xlsx');
const sheetName = 'UIUX問題追蹤清單';

const MARKS = {
  175: {
    status: '部分修正',
    date: '2026-05-25',
    note: '2026-05-25 commit ae1c85a：dynamic-pages.put / dynamic-assets.post / dynamic-assets/[name].get 加 requireDynamicApiToken (Bearer + X-iFare-Sync-Token, timingSafeEqual)、CORS 白名單 (DEV_ALLOWED_ORIGINS + dynamicApiAllowedOrigins config)。檔案大小限制 / MIME 過濾 / SVG 消毒待補。',
  },
  181: {
    status: '部分修正',
    date: '2026-05-25',
    note: '2026-05-25 commit ae1c85a：iFare_Frontend 補 .env.example + nuxt.config runtime config (dynamicApiToken / dynamicApiAllowedOrigins)、iFare_Backend 補 .env.example。後台 src/plugins/AjaxRef.ts 仍硬寫正式 API URL 未處理。',
  },
};

const wb = XLSX.readFile(file, { cellStyles: true });
const ws = wb.Sheets[sheetName];
if (!ws) throw new Error(`Worksheet not found: ${sheetName}`);

const range = XLSX.utils.decode_range(ws['!ref']);
const updated = [];

for (let r = 2; r <= range.e.r; r += 1) {
  const idCell = ws[XLSX.utils.encode_cell({ r, c: 0 })];
  const id = Number(idCell?.v);
  if (!MARKS[id]) continue;
  const m = MARKS[id];

  ws[XLSX.utils.encode_cell({ r, c: 13 })] = { ...(ws[XLSX.utils.encode_cell({ r, c: 13 })] || {}), v: m.status, t: 's' };
  ws[XLSX.utils.encode_cell({ r, c: 14 })] = { ...(ws[XLSX.utils.encode_cell({ r, c: 14 })] || {}), v: m.date, t: 's' };
  ws[XLSX.utils.encode_cell({ r, c: 15 })] = { ...(ws[XLSX.utils.encode_cell({ r, c: 15 })] || {}), v: m.note, t: 's' };
  updated.push(id);
}

const missing = Object.keys(MARKS).map(Number).filter((id) => !updated.includes(id));
if (missing.length) throw new Error(`Missing IDs: ${missing.join(', ')}`);

XLSX.writeFile(wb, file);

const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }).slice(2).filter((row) => row[0]);
const counts = {
  total: rows.length,
  fixed: rows.filter((row) => row[13] === '已修正').length,
  partial: rows.filter((row) => row[13] === '部分修正').length,
  pending: rows.filter((row) => row[13] === '待處理').length,
};
console.log('Updated IDs:', updated);
console.log('Main sheet counts after mark:', counts);
