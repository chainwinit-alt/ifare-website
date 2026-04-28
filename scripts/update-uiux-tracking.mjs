// Updates docs/iFare_UI_UX_問題追蹤清單.xlsx for the 2026-04-28 改版 (cumulative, idempotent):
//  Round 1 (8-file frontend revision):
//    - marks 7 existing UIUX issues as 已修正 / 部分修正
//    - appends 3 new issues (#88 / #89 / #90)
//  Round 2 (Footer 整理 + RWD 修正):
//    - marks 2 more existing issues (#17 / #71)
//    - appends 2 new issues (#91 / #92)
//  Syncs counts in 統計摘要 sheet.
// Run from repo root: `node scripts/update-uiux-tracking.mjs`

import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FILL_FIXED = { patternType: 'solid', fgColor: { rgb: 'C6EFCE' } };
const FONT_FIXED = { color: { rgb: '006100' } };
const FILL_PARTIAL = { patternType: 'solid', fgColor: { rgb: 'FFEB9C' } };
const FONT_PARTIAL = { color: { rgb: '9C5700' } };
const COLS_ALL = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];

function paintRow(ws, row, fill, font) {
  for (const col of COLS_ALL) {
    const addr = `${col}${row}`;
    if (!ws[addr]) ws[addr] = { t: 's', v: '' };
    ws[addr].s = { ...(ws[addr].s || {}), fill, font, alignment: { vertical: 'center', wrapText: true } };
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const FILE = path.join(REPO_ROOT, 'docs', 'iFare_UI_UX_問題追蹤清單.xlsx');
const TODAY = '2026-04-28';

const wb = XLSX.readFile(FILE, { cellStyles: true });
const ws = wb.Sheets['UIUX問題追蹤清單'];
const wsStat = wb.Sheets['統計摘要'];

// ---------- Step 1: update existing rows ----------
const existingUpdates = [
  {
    row: 3,
    status: '部分修正',
    note:
      '已移除三項都空時的 disabled 條件（pages/ifare.vue:75 + pages/ifare/result.vue 三處），改用 hasAnyCondition 顯示「未填條件將顯示最新福利」提示。改採「不阻擋 + 引導文案」策略，與原建議「未填欄位紅框 + 錯誤文字」方向不同。',
  },
  {
    row: 11,
    status: '部分修正',
    note:
      '結果摘要從「{{count}}」改寫為「共找到 X 項，僅顯示前 X 筆」(pages/ifare/result.vue)；.result-total 從 inline-flex + ::before 結構簡化為 inline；新增 .result-summary-note 樣式。原訴求「頂部大字 + 計數動畫」尚未做。',
  },
  {
    row: 18,
    status: '已修正',
    note:
      'app.vue 加 <NuxtPage :transition="{ name: \'page\', mode: \'out-in\' }" />；_animation.scss 新增 .page-enter/leave-active 與 .layout-enter/leave-active keyframes（opacity + translateY，純 GPU 屬性）。',
  },
  {
    row: 24,
    status: '已修正',
    note:
      'pages/news.vue 加 isLoading/hasError，分四分支渲染（4 條 skeleton-line 骨架／錯誤+重試／空狀態／正常列表）；LoadNews() 重構並加 .catch()；_animation.scss 加 @keyframes skeletonShimmer 與 .skeleton-line 樣式。',
  },
  {
    row: 61,
    status: '已修正',
    note:
      '_main.scss 為 .result-item / .article-item / .agency-item 加 hover translateY(-3px) + box-shadow，active translateY(-1px) 回彈。純 GPU 屬性，不觸發 layout 重繪。',
  },
  {
    row: 62,
    status: '部分修正',
    note:
      '_main.scss 為 .btn-filter / .btn-tag / .btn-retry 加 hover translateY(-1px) + active scale(0.97) 按壓回彈。原訴求「點擊漣漪效果」尚未做。',
  },
  {
    row: 82,
    status: '部分修正',
    note:
      'pages/news.vue 已實作 hasError + .btn-retry 按鈕模式（搭配 _animation.scss .part-error 樣式）。articles.vue / collaborator.vue / ifare/result.vue 三頁尚未套用同一錯誤狀態元件。',
  },
  // Round 2 (Footer 整理):
  {
    row: 19,
    status: '已修正',
    note:
      'LINE 與 Facebook 統一為 .btn-social 白底按鈕（含 icon + 深綠字），Facebook 從 .ic-facebook-before 文字連結改為 button 結構並與 LINE 並排。LINE icon 修正為品牌綠 #06C755（Line-Logo.svg fill），Facebook 改用品牌藍 #1877F2（新增 Facebook-Logo-color.svg）。',
  },
  {
    row: 73,
    status: '部分修正',
    note:
      'footer .btn-social 高度從 40px 提升到 44px（LINE / Facebook 兩按鈕符合 iOS HIG 觸控標準）。CompPage 分頁箭頭、btn-reset、btn-advance、CompSelect 等其他元件尚未套用 44px 標準。',
  },
];

for (const u of existingUpdates) {
  ws[`N${u.row}`] = { t: 's', v: u.status };
  ws[`O${u.row}`] = { t: 's', v: TODAY };
  ws[`P${u.row}`] = { t: 's', v: u.note };
}

// ---------- Step 2: append 3 new rows ----------
const newRows = [
  {
    row: 90,
    data: [
      88,
      'V',
      'i-Fare 福利查詢',
      '搜尋介面',
      '提升',
      '黏著',
      '中',
      '新增關鍵字搜尋輸入欄',
      '原本搜尋只能用三個下拉選單（政策類別、受助對象、地區），缺少自由文字搜尋入口',
      'ifare 與結果頁各加 <input.input-keyword>（含 Enter 快捷鍵），搜尋條件擴增 keyword 參數，後端 LIKE 查詢',
      'pages/ifare.vue pages/ifare/result.vue',
      'pages/ifare.vue\r\npages/ifare/result.vue\r\nassets/style/components/_appBody_ifare.scss\r\nassets/style/components/_appBodyChild_ifare.scss',
      '改版補登；後端 IFare_API.Application/Fare/Policy/* 已加 Keyword filter',
      '已修正',
      TODAY,
      '改版補登；前端 Search() 已帶 keyword 參數，API 傳 Keyword 欄位',
    ],
  },
  {
    row: 91,
    data: [
      89,
      'V',
      'i-Fare 福利查詢',
      '查詢結果',
      '修復',
      '互動',
      '中',
      '結果頁未支援 URL query 初始化',
      '結果頁從 ifare 跳轉過來時若重整或從外部進入，搜尋條件無法保留',
      '解析 route.query 初始化各 ref（policy / recipient / area / keyword），支援深度連結與重整保留條件',
      'pages/ifare/result.vue',
      'pages/ifare/result.vue',
      '改版補登；搭配 #88 關鍵字欄位一起實作',
      '已修正',
      TODAY,
      '改版補登',
    ],
  },
  {
    row: 92,
    data: [
      90,
      'V',
      'i-Fare 福利查詢',
      '搜尋介面',
      '修復',
      'RWD',
      '低',
      '搜尋按鈕區手機版橫排擠壓',
      '.item-bottom 原為橫排，手機版按鈕和提示文字擠在一起',
      '_appBody_ifare.scss .item-bottom 改 flex-direction: column + gap + 居中，並加 .filter-hint 樣式',
      'pages/ifare.vue',
      'iFare_Frontend/assets/style/components/_appBody_ifare.scss',
      '改版補登；搭配 #1 disabled 移除後新增的提示文字調整版面',
      '已修正',
      TODAY,
      '改版補登',
    ],
  },
  // Round 2 (Footer 整理):
  {
    row: 93,
    data: [
      91,
      'V',
      '共用元件',
      'AppFooter',
      '提升',
      '視覺',
      '低',
      'Footer 聯絡資訊缺 icon',
      'footer 4 個 label（聯絡電話 / 聯絡信箱 / 地址 / 服務時間）僅有純文字，缺乏視覺辨識',
      '4 個 label 前各加對應 icon（Tel / Mail / Address / Clock），與站內既有 icon 風格一致',
      'components/AppFooter.vue',
      'iFare_Frontend/components/AppFooter.vue\r\nassets/style/components/_appFooter.scss\r\nassets/style/_font.scss\r\nassets/img/Mail.svg (新增)\r\nassets/img/Clock.svg (新增)',
      '改版補登；新增 Mail.svg + Clock.svg 用 mask-image 著色為 rgba(white,.7)，沿用既有 Tel.svg / Location.svg。原 ::before content 的 CSS-only label 改為 HTML <span class="footer-info-label"> 結構',
      '已修正',
      TODAY,
      '改版補登',
    ],
  },
  {
    row: 94,
    data: [
      92,
      'V',
      '共用元件',
      'AppFooter',
      '提升',
      '互動',
      '中',
      '社群連結 LINE / Facebook 分散兩處',
      'LINE 在「進一步瞭解更多」CTA 區塊內，Facebook 在獨立 .part-middle 區塊；兩者都是社群媒體應該放一起',
      '把 Facebook 從 .part-middle 移到 .card-more 內 .card-more-socials div 與 LINE 並排，整合為單一社群區塊',
      'components/AppFooter.vue',
      'iFare_Frontend/components/AppFooter.vue\r\nassets/style/components/_appFooter.scss\r\nassets/style/rwd/_rwd_appFooter.scss',
      '改版補登；移除原 .part-middle 與 .link-track 樣式',
      '已修正',
      TODAY,
      '改版補登；同步修桌面 1025-1280px overflow（加 FB 後 .card-more 內容寬度 ~1300px 會爆）：.card-more 加 flex-wrap: wrap + max-width: calc(100% - 64px)；.info-more 加 max-width: 480px 讓長文字桌面換 2 行',
    ],
  },
];

for (const { row, data } of newRows) {
  for (let i = 0; i < data.length; i++) {
    const v = data[i];
    const cell = `${COLS_ALL[i]}${row}`;
    ws[cell] = typeof v === 'number' ? { t: 'n', v } : { t: 's', v };
  }
}

// Extend !ref to include all new rows (round 1: 90-92, round 2: 93-94)
ws['!ref'] = 'A1:P94';

// ---------- Step 2.5: paint colors based on status ----------
// 已修正 → light green (Excel "Good" preset)
// 部分修正 → light yellow (Excel "Neutral" preset)
// Round 1: rows 18/24/61/90/91/92 fixed; 3/11/62/82 partial
// Round 2: row 19 fixed; row 73 partial; new rows 93/94 fixed
const fixedRows = [18, 19, 24, 61, 90, 91, 92, 93, 94];
const partialRows = [3, 11, 62, 73, 82];
for (const r of fixedRows) paintRow(ws, r, FILL_FIXED, FONT_FIXED);
for (const r of partialRows) paintRow(ws, r, FILL_PARTIAL, FONT_PARTIAL);

// ---------- Step 3: sync 統計摘要 ----------
// 驗證結果統計: V 67→72, ~ 10, 合計 77→82 (round 1: +3 V; round 2: +2 V)
wsStat['B3'] = { t: 'n', v: 72 };
wsStat['C3'] = { t: 's', v: '87.8%' };
wsStat['C4'] = { t: 's', v: '12.2%' };
wsStat['B5'] = { t: 'n', v: 82 };
wsStat['D5'] = {
  t: 's',
  v: '已移除 8 項原始盤點中不正確的項目；2026-04-28 補登 5 項改版實作項目（#88/#89/#90/#91/#92）',
};

// 各區塊問題統計:
//   i-Fare 福利查詢 修復 8→10, 提升 6→7, 小計 14→17 (round 1)
//   共用元件 修復 14, 提升 0→2, 小計 14→16 (round 2 #91/#92)
//   合計 修復 52→54, 提升 25→28, 小計 77→82
wsStat['B9'] = { t: 'n', v: 10 };
wsStat['C9'] = { t: 'n', v: 7 };
wsStat['D9'] = { t: 'n', v: 17 };
wsStat['C15'] = { t: 'n', v: 2 };
wsStat['D15'] = { t: 'n', v: 16 };
wsStat['B19'] = { t: 'n', v: 54 };
wsStat['C19'] = { t: 'n', v: 28 };
wsStat['D19'] = { t: 'n', v: 82 };

// 優先級分布:
//   中 修復 26→27, 提升 7→8→9, 小計 33→35→36 (round 1: +1修復+1提升; round 2: +1提升 #92)
//   低 修復 21→22, 提升 17→18, 小計 38→39→40 (round 1: +1修復; round 2: +1提升 #91)
wsStat['B24'] = { t: 'n', v: 27 };
wsStat['C24'] = { t: 'n', v: 9 };
wsStat['D24'] = { t: 'n', v: 36 };
wsStat['B25'] = { t: 'n', v: 22 };
wsStat['C25'] = { t: 'n', v: 18 };
wsStat['D25'] = { t: 'n', v: 40 };

// ---------- Step 4: write back ----------
XLSX.writeFile(wb, FILE);

console.log('OK');
console.log(`Updated ${existingUpdates.length} existing rows: ${existingUpdates.map((u) => `row ${u.row}`).join(', ')}`);
console.log(`Appended ${newRows.length} new rows: ${newRows.map((n) => `row ${n.row} (#${n.data[0]})`).join(', ')}`);
console.log(`Painted: ${fixedRows.length} 已修正 rows (light green) + ${partialRows.length} 部分修正 rows (light yellow)`);
console.log('Synced 統計摘要 sheet (V 72 / ~ 10 / 合計 82)');
console.log(`File: ${FILE}`);
