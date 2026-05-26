// Round 8 (2026-05-04) — 批次 C: 4 個 WCAG 無障礙修正
//   #112 圖片 alt (剩 index 背景圖)
//   #114 CompSelect 系列鍵盤操作
//   #115 heading 層級結構
//   #125 行動選單 focus 管理
// Run: node scripts/update-uiux-tracking-round8.mjs

import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(__dirname, '..', 'docs', 'iFare_問題追蹤與AI維運規劃.xlsx');
const TODAY = '2026-05-04';

const wb = XLSX.readFile(FILE, { cellStyles: true });
const ws = wb.Sheets['UIUX問題追蹤清單'];

// id → row mapping
// #112 = row 114, #114 = row 116, #115 = row 117, #125 = row 127
const updates = [
  {
    id: 112,
    row: 114,
    note: 'Round 8 (批次 C): pages/index.vue 的 .part-bg-top 加 aria-hidden="true" — 5 張裝飾性 .bg-img 不需被屏幕閱讀器讀。collaborator.vue + articles/lazy.vue 的 <img> alt 已在 Round 7 (#127) 順手做。',
  },
  {
    id: 114,
    row: 116,
    note: 'Round 8 (批次 C): 3 個 component (CompSelect / CompSelectRecipient / CompSelectElse) 加 tabindex="0" + role="combobox" + aria-expanded + aria-haspopup + aria-label。CompSelect / CompSelectRecipient 加完整鍵盤導航 (Enter/Space toggle 或選擇 focused 項目；Esc 關閉；Arrow Up/Down 切換 focused 項目)；CompSelectElse 因含兩組選項 (Income + Identity) 結構複雜，僅加 Enter/Space toggle + Esc 關閉，方向鍵需後續再處理。選項加 role="option" + aria-selected。',
  },
  {
    id: 115,
    row: 117,
    note: 'Round 8 (批次 C): 已 grep 確認 SCSS 全用 class selector (.comp-title / .member-name / .news-title 等)，改 tag 不破壞視覺。修正：about.vue (h3 → h1 主標 / h6 → h4 member-name × 3)；index.vue (h3 → p sub-title / h2 → h4 news-title / h2 → h4 card-title)；news/info.vue (h6 → p article-date)；ifare/info.vue (h3 → h2 × 5 區塊標 / h5 → h2 relation-title / h6 → h3 link-title)。',
  },
  {
    id: 125,
    row: 127,
    note: 'Round 8 (批次 C): components/AppHeader.vue 加 menuButtonRef 綁 .btn-menu，watch(isShowMenu) → 開啟時 querySelector focus 至首個 mobile menu link，關閉時 focus 回菜單按鈕。.btn-menu 加 :aria-expanded="isShowMenu" + aria-controls="mobile-menu" + aria-label="開啟菜單"；.mobile-menu 加 id="mobile-menu" + role="dialog" + aria-modal="true" + aria-label="行動選單"。全域加 ESC 鍵監聽關閉 menu (onMounted/onBeforeUnmount window.addEventListener)。',
  },
];

for (const u of updates) {
  ws[XLSX.utils.encode_cell({ r: u.row - 1, c: 13 })] = { t: 's', v: '已修正' };
  ws[XLSX.utils.encode_cell({ r: u.row - 1, c: 14 })] = { t: 's', v: TODAY };
  ws[XLSX.utils.encode_cell({ r: u.row - 1, c: 15 })] = { t: 's', v: u.note };
}

XLSX.writeFile(wb, FILE);
console.log(`✅ 標完 ${updates.length} 個項目為「已修正」`);
console.log('  ', updates.map(u => `#${u.id}`).join(', '));
console.log('   檔案:', FILE);
