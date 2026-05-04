// Round 7 (2026-05-04) — 批次 A: 6 個快速勝利
//   #110 console.log 清除
//   #120 footer 版權年份
//   #126 disabled 按鈕視覺
//   #127 圖片 lazy load
//   #130 aria-label 行動菜單關閉鈕
//   #131 aria-current 12 個 NuxtLink
// 把上述標為「已修正」+ 處理日期 + 補備註
// Run: node scripts/update-uiux-tracking-round7.mjs

import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(__dirname, '..', 'docs', 'iFare_UI_UX_問題追蹤清單.xlsx');
const TODAY = '2026-05-04';

const wb = XLSX.readFile(FILE, { cellStyles: true });
const ws = wb.Sheets['UIUX問題追蹤清單'];

// id → row mapping (從之前 round 5 知道 #106-#131 對應 row 108-133)
// #110 = row 112, #120 = row 122, #126 = row 128, #127 = row 129, #130 = row 132, #131 = row 133
const updates = [
  {
    id: 110,
    row: 112,
    note: 'Round 7 (批次 A): 移除 13 處 console.log — pages/news.vue (1)、pages/ifare.vue (1)、pages/ifare/result.vue (5)、pages/ifare/contact.vue (2)、components/CompPage.vue (4)。保留 pages/ifare/info.vue:203 的 console.error (catch 內合理錯誤處理)。',
  },
  {
    id: 120,
    row: 122,
    note: 'Round 7 (批次 A): components/AppFooter.vue L42 「© 1995-2020」改成 「© 1995-{{ new Date().getFullYear() }}」 — 模板內 inline 執行，自動跟系統年份。',
  },
  {
    id: 126,
    row: 128,
    note: 'Round 7 (批次 A): assets/style/components/_button.scss 開頭加 generic 規則 — button:disabled / .btn:disabled / .btn.disabled 都套 opacity 0.5 + cursor not-allowed + pointer-events none。.btn-filter 既有 disabled 樣式 (L186) 不衝突。',
  },
  {
    id: 127,
    row: 129,
    note: 'Round 7 (批次 A): pages/collaborator.vue L22 <img> 加 loading="lazy" + :alt="`${_coll.title} logo`"；pages/articles/lazy.vue L77 動態 <img> 加 loading="lazy" + alt="${title} - ${j+1}"。',
  },
  {
    id: 130,
    row: 132,
    note: 'Round 7 (批次 A): components/AppHeader.vue L136 行動選單 .btn-close 加 aria-label="關閉菜單"。',
  },
  {
    id: 131,
    row: 133,
    note: 'Round 7 (批次 A): components/AppHeader.vue 桌面 5 + 行動 6 + i-Fare 桌面 1 共 12 個 NuxtLink 加 :aria-current="$route.name === \'xxx\' ? \'page\' : undefined"。i-Fare 用 includes(\'ifare\') 涵蓋子路由。',
  },
];

for (const u of updates) {
  // N 欄 (index 13) = 狀態 → 已修正
  ws[XLSX.utils.encode_cell({ r: u.row - 1, c: 13 })] = { t: 's', v: '已修正' };
  // O 欄 (index 14) = 處理日期
  ws[XLSX.utils.encode_cell({ r: u.row - 1, c: 14 })] = { t: 's', v: TODAY };
  // P 欄 (index 15) = 備註
  ws[XLSX.utils.encode_cell({ r: u.row - 1, c: 15 })] = { t: 's', v: u.note };
}

XLSX.writeFile(wb, FILE);
console.log(`✅ 標完 ${updates.length} 個項目為「已修正」`);
console.log('  ', updates.map(u => `#${u.id}`).join(', '));
console.log('   檔案:', FILE);
