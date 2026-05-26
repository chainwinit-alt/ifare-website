// Round 12 (2026-05-04) — 前端批次掃修 10 項 (技術明確、低風險)
//   #3 FAQ ARIA + #6 手機篩選器垂直堆疊 + #14 手機表格標題行
//   #29 手機箭頭顯示 + #45 AppHeader computed refactor + #46 漢堡 ARIA (跨 round 認領)
//   #47 安全區域 + #55 CompSelect null check + #56 CompSelect ARIA (跨 round 認領)
//   #79 搜尋表單 ARIA
// Run: node scripts/update-uiux-tracking-round12.mjs

import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(__dirname, '..', 'docs', 'iFare_問題追蹤與AI維運規劃.xlsx');
const TODAY = '2026-05-04';

const wb = XLSX.readFile(FILE, { cellStyles: true });
const ws = wb.Sheets['UIUX問題追蹤清單'];

// id → row mapping (row = id + 2)
const updates = [
  {
    id: 3, row: 5,
    note: 'Round 12 (批次): pages/ifare.vue FAQ <li> 加 role="button" + tabindex="0" + :aria-expanded + :aria-controls + Enter/Space keydown 處理。.faq-info div 加 :id + :aria-hidden。.faq-logo / .open-switch 加 aria-hidden="true" (純裝飾)。',
  },
  {
    id: 6, row: 8,
    note: 'Round 12 (批次): assets/style/rwd/_rwd_ifare.scss 重寫 .card-filter-mobile — 從 height:40px + flex-row + overflow:hidden 改成 flex-direction: column + padding 12 16 + 全寬子元素。.component-select padding 10 12 + 邊框、.btn-filter 高 44px (iOS 觸控標準)。文字 max-width:72px ellipsis 拿掉，改 flex:1 + overflow:hidden 自然 ellipsis。',
  },
  {
    id: 14, row: 16,
    note: 'Round 12 (批次): assets/style/rwd/_rwd_ifare.scss .detail-title 從 display:none 改成顯示為 12px 灰色標籤行 (border-top dashed + opacity 0.55)。手機版仍能看到「單位/聯絡電話/聯絡地址」語意 label，視覺輕量不擠。',
  },
  {
    id: 29, row: 31,
    note: 'Round 12 (批次): assets/style/rwd/_rwd.scss .article-list .link-url 從 display:none 改成 display:inline-block + 18x18px + opacity 0.55 + align-self:flex-end。手機版仍有箭頭可點擊提示。',
  },
  {
    id: 45, row: 47,
    note: 'Round 12 (批次 refactor): components/AppHeader.vue 抽 2 個 computed property (headerNameMode 用於 <header :name>，elementColorMode 用於 5 處子元素) 取代 5 處重複的 route 條件判斷三元運算式。Template 從 ~50 行 :name 條件變成 5 個 computed reference。',
  },
  {
    id: 46, row: 48,
    note: 'Round 12 (批次跨 round 認領): Round 8 #125 已加 .btn-menu aria-expanded + aria-controls="mobile-menu" + aria-label="開啟菜單"，.mobile-menu div 加 role="dialog" + aria-modal="true" + aria-label="行動選單"。',
  },
  {
    id: 47, row: 49,
    note: 'Round 12 (批次): assets/style/components/_appHeader.scss .app-header 加 padding-top/left/right env(safe-area-inset-*) 避開 iPhone 瀏海/動態島。.mobile-menu 同樣加 padding-top/bottom env(safe-area-inset-*)。',
  },
  {
    id: 55, row: 57,
    note: 'Round 12 (批次): components/CompSelect.vue + CompSelectRecipient.vue watch(props.selectList) callback 開頭加 if (!newList || !Array.isArray(newList)) return 防呆，避免 newList 為 null/undefined/非陣列時 .find() 拋錯。',
  },
  {
    id: 56, row: 58,
    note: 'Round 12 (批次跨 round 認領): Round 8 #114 已對 CompSelect / CompSelectRecipient / CompSelectElse 加 role="combobox" + aria-haspopup + aria-expanded + aria-label + tabindex + 鍵盤事件 (Enter/Space toggle、Esc close、Arrow Up/Down)。選項加 role="option" + aria-selected + tabindex。',
  },
  {
    id: 79, row: 81,
    note: 'Round 12 (批次): pages/ifare.vue 搜尋表單加 role="search" + aria-labelledby + sr-only 標題。每個欄位 label 加 id + for；CompSelect 加 :aria-labelledby；input 加 type="search" + aria-describedby (sr-only hint) + maxlength=50；按鈕加 type="submit" + :aria-disabled；裝飾 icon 加 aria-hidden。tag-list 加 role="group" + role="button" + tabindex + :aria-pressed + Enter/Space keydown。assets/style/_main.scss 加 .sr-only utility class。',
  },
];

for (const u of updates) {
  ws[XLSX.utils.encode_cell({ r: u.row - 1, c: 13 })] = { t: 's', v: '已修正' };
  ws[XLSX.utils.encode_cell({ r: u.row - 1, c: 14 })] = { t: 's', v: TODAY };
  ws[XLSX.utils.encode_cell({ r: u.row - 1, c: 15 })] = { t: 's', v: u.note };
}

XLSX.writeFile(wb, FILE);
console.log(`✅ Round 12 標完 ${updates.length} 個項目`);
console.log('  ', updates.map(u => `#${u.id}`).join(', '));
