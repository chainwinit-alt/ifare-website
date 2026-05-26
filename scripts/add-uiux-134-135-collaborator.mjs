// 2026-05-05 — 標 #133 已修正 + 新增 #134 (分類呈現) / #135 (樣式統一) 並全部標已修正
// 對應實作：pages/collaborator.vue 重構成 .part-filter + .btn-tag-list chips + .input-query
// Run: node scripts/add-uiux-134-135-collaborator.mjs

import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(__dirname, '..', 'docs', 'iFare_問題追蹤與AI維運規劃.xlsx');
const TODAY = '2026-05-05';

const wb = XLSX.readFile(FILE, { cellStyles: true });
const ws = wb.Sheets['UIUX問題追蹤清單'];
const range = XLSX.utils.decode_range(ws['!ref']);

// === Step 1: #133 既有 row 標已修正 ===
// row = id + 2 (id 133 在 row 135, 0-indexed 134)
const row133 = 134;
const note133 = 'Round 13 (2026-05-05): pages/collaborator.vue v1 純前端搜尋已實作 — searchQuery ref + filteredList computed (title.includes + serviceItem.includes case-insensitive)。後續樣式 + 分類拆到 #134 / #135 一併完成。完整版本：v1 = 此筆 (純前端 search) + v2 = #134 (分類 chips) + #135 (樣式統一 .part-filter)。整體已上線，hasFilter / resetFilter 函式統合三者。';

ws[XLSX.utils.encode_cell({ r: row133, c: 13 })] = { t: 's', v: '已修正' };
ws[XLSX.utils.encode_cell({ r: row133, c: 14 })] = { t: 's', v: TODAY };
ws[XLSX.utils.encode_cell({ r: row133, c: 15 })] = { t: 's', v: note133 };

console.log(`✅ #133 標已修正 (row ${row133 + 1})`);

// === Step 2: 新增 #134 公益夥伴分類呈現 ===
let nextRow = range.e.r + 1;
const newRow134 = [
  { c: 0,  v: 134, t: 'n' },
  { c: 1,  v: 'V', t: 's' },
  { c: 2,  v: '公益夥伴', t: 's' },
  { c: 3,  v: '分類呈現', t: 's' },
  { c: 4,  v: '提升', t: 's' },
  { c: 5,  v: '互動', t: 's' },
  { c: 6,  v: '中', t: 's' },
  { c: 7,  v: '公益夥伴頁基本分類呈現 — 6 個 chip 讓使用者不搜尋也能快速瀏覽', t: 's' },
  { c: 8,  v: '使用者反映：「希望在前端的時候就先做好基本的分類呈現，如果使用者不想搜尋也可以知道這些東西。」搜尋只有單純輸入框時，使用者要知道有哪些類型的團體只能憑直覺輸入關鍵字。需要在介面上「預先呈現」可用分類。', t: 's' },
  { c: 9,  v: '前端 hardcode 6 個分類 chip：全部 / 兒少 / 老人 / 婦女 / 身心障礙 / 弱勢家庭。每個分類用 keywords 陣列對應 serviceItem + title 比對 (例：兒少 → 兒童|兒少|嬰幼兒|青少年|青年；老人 → 老人|長者|銀髮；身心障礙 → 身心障礙|障礙|失能；弱勢家庭 → 弱勢|家庭|脫貧|親子)。Chip 顯示「分類名 (筆數)」即時計算 categoryCounts。Active 狀態橘色填底 + 白字。Click 切換 selectedCategory，與 searchQuery 做 AND 過濾 (filteredList computed)。 hasFilter computed 判斷有無套任一條件，控制 result-summary 與 empty-state 顯示。', t: 's' },
  { c: 10, v: 'pages/collaborator.vue', t: 's' },
  { c: 11, v: 'iFare_Frontend/pages/collaborator.vue (新增 CATEGORIES 常數陣列 + categoryMatch / categoryCounts / hasFilter / resetFilter 函式)', t: 's' },
  { c: 12, v: '使用者明確要求 (2026-05-05)。資料量小先 hardcode 分類關鍵字；未來資料量大或需精準分類時再改後端 (見 #133 v3 範圍)。', t: 's' },
  { c: 13, v: '已修正', t: 's' },
  { c: 14, v: TODAY, t: 's' },
  { c: 15, v: 'Round 13 (2026-05-05): 6 個 chip 採 .btn-tag-list .btn-tag 模式 (與 i-Fare 主搜尋頁同一套元件)，aria-pressed + 鍵盤 Enter/Space 操作。Chip 後面括號顯示該分類筆數，例「兒少 (4)」「老人 (2)」。', t: 's' },
];

for (const { c, v, t } of newRow134) {
  ws[XLSX.utils.encode_cell({ r: nextRow, c })] = { t, v };
}
console.log(`✅ #134 分類呈現 已修正 (row ${nextRow + 1})`);

// === Step 3: 新增 #135 公益夥伴搜尋樣式統一 ===
nextRow += 1;
const newRow135 = [
  { c: 0,  v: 135, t: 'n' },
  { c: 1,  v: 'V', t: 's' },
  { c: 2,  v: '公益夥伴', t: 's' },
  { c: 3,  v: '搜尋樣式統一', t: 's' },
  { c: 4,  v: '修復', t: 's' },
  { c: 5,  v: '視覺', t: 's' },
  { c: 6,  v: '中', t: 's' },
  { c: 7,  v: '公益夥伴頁搜尋元件樣式統一 — 對齊 /articles 篩選元件視覺風格', t: 's' },
  { c: 8,  v: '使用者反映：「我覺得搜尋欄位不是很好，跟其他頁統一樣式。」#133 v1 自由發揮的圓角輸入框 + 紅 X 清空按鈕，與站內既有 /articles / /ifare 的 .part-filter 風格不一致 (各頁濾框互相不協調)。需對齊現有設計系統。', t: 's' },
  { c: 9,  v: '套用 /articles 的 .part-filter 容器 (圓角白底卡片) + .btn-tag-list / .btn-tag 分類 chip + .input-query 文字輸入框 + .filter-name 標籤。Active 狀態使用站內主色 $color-orange (#EA5504)。RWD 768px 以下 chip / search 列改垂直堆疊。文字輸入框 focus 時邊框轉橘色 + 12% opacity 光暈 (對齊 /ifare 主搜尋頁)。', t: 's' },
  { c: 10, v: 'pages/collaborator.vue', t: 's' },
  { c: 11, v: 'iFare_Frontend/pages/collaborator.vue (移除 v1 自由發揮的 .part-search 樣式，改用 .part-filter.collaborator-filter / .filter-tags / .filter-search 三層；scoped style 改用 hex 對應 _color.scss 色票，避免直接 import 全域 scss 變數)', t: 's' },
  { c: 12, v: '使用者明確要求 (2026-05-05)。樣式僅 scoped 於 collaborator.vue，未動全站 scss 系統。如未來要全站對齊 search element，可考慮抽 components/CompFilterCard.vue 共用元件。', t: 's' },
  { c: 13, v: '已修正', t: 's' },
  { c: 14, v: TODAY, t: 's' },
  { c: 15, v: 'Round 13 (2026-05-05): 重寫 collaborator.vue scoped style — .part-filter.collaborator-filter (圓角卡 + 24px padding) / .btn-tag-list (12px gap, 8px chip gap) / .input-query (24px border-radius, focus 橘色光暈)。RWD 在 768px 以下垂直堆疊。 .btn-tag 用 :deep() 從 collaborator-filter 內覆寫 active = orange filled / default = grey-200 outline。', t: 's' },
];

for (const { c, v, t } of newRow135) {
  ws[XLSX.utils.encode_cell({ r: nextRow, c })] = { t, v };
}
console.log(`✅ #135 樣式統一 已修正 (row ${nextRow + 1})`);

// === Step 4: 更新 sheet range ===
ws['!ref'] = XLSX.utils.encode_range({
  s: range.s,
  e: { r: nextRow, c: Math.max(range.e.c, 15) },
});

XLSX.writeFile(wb, FILE);
console.log('---');
console.log(`✅ 全部完成: #133 標已修正 + 新增 #134 #135 標已修正`);
console.log(`   UIUX sheet 從 133 項 → 135 項`);
