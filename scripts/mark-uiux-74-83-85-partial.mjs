// 2026-05-25 — Round 14 第八批 a11y + 效能：mark #74 / #83 / #85 部分修正
// #74 按鈕樣式分散無統一規範 — 盤點 18 class + _button.scss 加 header docstring
// #83 全站圖片 alt 與裝飾圖語意規則未統一 — 補 CompChatbotWelcome.vue 3 處 SVG aria-hidden
// #85 首屏字型與大圖載入效能可再優化 — nuxt.config.ts 加 Google Fonts preconnect/dns-prefetch
// Run: node scripts/mark-uiux-74-83-85-partial.mjs

import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.resolve(__dirname, '..', 'docs', 'iFare_UI_UX_問題追蹤清單.xlsx');
const sheetName = 'UIUX問題追蹤清單';

const MARKS = {
  74: {
    status: '部分修正',
    date: '2026-05-25',
    note: '2026-05-25：盤點全站 18 個 .btn-* class（btn/btn-tag/btn-icon/btn-ic-share/btn-search/btn-page-next/btn-page-prev/btn-more/btn-select-close/btn-filter/btn-advance/btn-menu/btn-close/btn-reset/btn-empty-oval/btn-ifare/btn-ifare-start/btn-line）分布三檔（_button.scss 結構、_font.scss 字型、_rwd_button.scss 響應式），含 vue 使用次數；在 _button.scss 加 header docstring 文件化現況 + 未來統一規範方向（base mixin / variant / size / 跨檔合併）。實際 styling 統一需先設計討論（與 #64-66 設計系統綁定）。',
  },
  83: {
    status: '部分修正',
    date: '2026-05-25',
    note: '2026-05-25：盤點全站 <img> 3 處（collaborator.vue / lazy.vue / SectionImageText.vue）皆已有適當 alt；盤點 inline SVG 6 處，補 CompChatbotWelcome.vue 三處 button 內 SVG (清除對話 / 關閉 / 送出) 加 aria-hidden="true" + focusable="false"（CompChatbotEntry.vue 已有；about.vue 已用父 span aria-hidden 包覆）。全站圖片 a11y 規範 docs 化待補。',
  },
  85: {
    status: '部分修正',
    date: '2026-05-25',
    note: '2026-05-25：nuxt.config.ts app.head.link 加 Google Fonts preconnect (fonts.googleapis.com + fonts.gstatic.com crossorigin) + dns-prefetch，省 DNS+TCP+TLS 握手 100-300ms 加速字型載入（既有 display=swap 保留）。首屏 Hero 圖 (assets/img/Index-Img-0~4.jpg 共 ~680KB，最大 Index-Img-2 347KB) 因走 webpack hash 路徑無法直接 preload；Lighthouse LCP/CLS/INP 量測待補。',
  },
};

const wb = XLSX.readFile(file, { cellStyles: true });
const ws = wb.Sheets[sheetName];
if (!ws) throw new Error(`Worksheet not found: ${sheetName}`);

const range = XLSX.utils.decode_range(ws['!ref']);
const updated = [];

for (let r = 2; r <= range.e.r; r += 1) {
  const id = Number(ws[XLSX.utils.encode_cell({ r, c: 0 })]?.v);
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
