// Updates docs/iFare_UI_UX_問題追蹤清單.xlsx for the 2026-04-28 改版 (cumulative, idempotent):
//  Round 1 (8-file frontend revision):
//    - marks 7 existing UIUX issues as 已修正 / 部分修正
//    - appends 3 new issues (#88 / #89 / #90)
//  Round 2 (Footer 整理 + RWD 修正):
//    - marks 2 more existing issues (#17 / #71)
//    - appends 2 new issues (#91 / #92)
//  Round 3 (About 靈動島 + News 卡片升級 + 社群外連結):
//    - marks 4 more existing issues (#23 / #24 / #26 / #44)
//    - appends 5 new issues (#93 / #94 / #95 / #96 / #97)
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
  // Round 3 (About 靈動島 + News 卡片升級):
  {
    row: 25,
    status: '已修正',
    note:
      'pages/news.vue 的 .article-item .item-info 加 line-clamp: 2（桌面）/ line-clamp: 3（手機 ≤1024px），超過行數自動省略結尾。',
  },
  {
    row: 26,
    status: '已修正',
    note:
      'pages/news.vue 的 <i class="ic-arrow-right"> 加上 aria-label="閱讀全文"，符合無障礙語意要求。',
  },
  {
    row: 28,
    status: '已修正',
    note:
      'pages/news.vue 加 isNewItem(releaseTime) helper（7 天內判斷），對應消息右上角顯示橘色 NEW pill 標籤（_appBody.scss .badge-new）。',
  },
  {
    row: 46,
    status: '已修正',
    note:
      'icon SVG 本身仍為靜態，但已包入 Dynamic Island 互動卡片（.how-content）：hover/click toggle 觸發整體 morph 動畫（grid-template-rows 展開、translateY 浮起、background opacity overlay 漸層切換、border 露出青綠光暈）。視覺已不再死板。',
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
  // Round 3 (About 靈動島 + News 卡片升級 + 社群外連結):
  {
    row: 95,
    data: [
      93,
      'V',
      '關於長穩',
      '',
      '提升',
      '互動',
      '中',
      'About 三大核心介紹缺乏互動性',
      '環境保育/人才培育/社會關懷三張卡片原為靜態圖文，使用者掃過無視覺反應，缺乏吸引點擊探索的動機',
      '改造為 iOS Dynamic Island 風格 morph 卡片：暖象牙白漸層底 + 圓角 28px + 預設只露 icon+標題 → hover/click toggle 平滑展開內文（grid-template-rows trick）+ translateY 浮起 + 邊框露出青綠光暈',
      'pages/about.vue',
      'iFare_Frontend/pages/about.vue\r\nassets/style/components/_appBody_about.scss\r\nassets/style/rwd/_rwd_about.scss',
      '改版補登；HTML 重組（icon+title 合進 .how-top、info 包 .how-info-wrap）；script 加 activeHow ref + toggleHow handler；keyboard a11y (Enter/Space) 與 tabindex；GPU 優化（will-change + ::before opacity overlay 取代 gradient transition）；Apple spring easing cubic-bezier(0.32, 0.72, 0, 1)',
      '已修正',
      TODAY,
      '改版補登；對應 #44 三大核心圖示靜態問題已連動修正',
    ],
  },
  {
    row: 96,
    data: [
      94,
      'V',
      '關於長穩',
      '',
      '提升',
      '視覺',
      '低',
      'About 成員照片缺 hover 互動',
      '陳進財/鄔筠軒/顏杏蓉三位成員區塊原無 hover 反饋，掃過時視覺無變化',
      '陳進財/鄔筠軒整組 hover：照片 scale(1.06) + 白框 scale(1.03) + box-shadow 加深 + 橘色標牌 translateY(-4px)；顏杏蓉（無照片）標牌 hover translateY(-4px) + scale(1.04)',
      'pages/about.vue',
      'iFare_Frontend/assets/style/components/_appBody_about.scss',
      '改版補登；同套 cubic-bezier(0.32, 0.72, 0, 1) easing；will-change: transform 給 .member-photo 預先建 GPU layer',
      '已修正',
      TODAY,
      '改版補登',
    ],
  },
  {
    row: 97,
    data: [
      95,
      'V',
      '關於長穩',
      '',
      '提升',
      '視覺',
      '低',
      'About 底部 CTA 連結缺 hover micro-animation',
      '「前往 i-Fare」與「查看最新消息」兩個 advance-link 原為靜態，hover 無互動反饋，無法強化「點我前進」訊號',
      '連結 hover 時 translateY(-2px) 上浮，箭頭 icon translateX(6px) 向右滑出，引導視線前進',
      'pages/about.vue',
      'iFare_Frontend/assets/style/components/_appBody_about.scss',
      '改版補登；統一 cubic-bezier(0.32, 0.72, 0, 1) easing 0.22s',
      '已修正',
      TODAY,
      '改版補登',
    ],
  },
  {
    row: 98,
    data: [
      96,
      'V',
      '最新消息',
      '',
      '提升',
      '視覺',
      '中',
      'News 列表呈現升級為浮起卡片 + 入場動畫 + 日期 pill',
      '原本最新消息為「底線分隔的清單列」，hover 只是淡白底 + 箭頭轉橘，視覺扁平、缺乏互動感、日期不醒目、長內文無截斷',
      '列表整體升級：圓角 16px 浮起卡片（white .7 + shadow）+ stagger fade-up 入場動畫（@for 1~12 each +50ms）+ 日期變橘色 pill 標籤（border + 半透明橘底）+ hover translateY(-3px) + 背景變實白 + 箭頭橘色滑右 6px',
      'pages/news.vue',
      'iFare_Frontend/pages/news.vue\r\nassets/style/components/_appBody.scss\r\nassets/style/_animation.scss\r\nassets/style/rwd/_rwd.scss',
      '改版補登；@keyframes newsItemEnter 放 _animation.scss；統一 cubic-bezier(0.32, 0.72, 0, 1) easing；配色全用既有 token 沒引入新色',
      '已修正',
      TODAY,
      '改版補登；同次改動連帶解決 #23 (line-clamp 2)、#24 (aria-label)、#26 (NEW badge)',
    ],
  },
  {
    row: 99,
    data: [
      97,
      'V',
      '共用元件',
      'AppFooter / AppHeader',
      '修復',
      '互動',
      '低',
      '社群外連結未開新分頁，可能丟失當前頁狀態',
      'AppFooter LINE/Facebook 與 AppHeader 手機版社群 icon 連結原為一般 <a href>，點擊會在當前分頁導向，使用者離開站內後返回成本高',
      '4 個社群連結都加 target="_blank" + rel="noopener noreferrer"：開新分頁、避免反向 tabnabbing、不洩漏 referrer',
      'components/AppFooter.vue components/AppHeader.vue',
      'iFare_Frontend/components/AppFooter.vue\r\niFare_Frontend/components/AppHeader.vue',
      '改版補登；rel="noopener" 是 W3C 安全建議',
      '已修正',
      TODAY,
      '改版補登',
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

// Extend !ref to include all new rows (round 1: 90-92, round 2: 93-94, round 3: 95-99)
ws['!ref'] = 'A1:P99';

// ---------- Step 2.5: paint colors based on status ----------
// 已修正 → light green (Excel "Good" preset)
// 部分修正 → light yellow (Excel "Neutral" preset)
// Round 1: rows 18/24/61/90/91/92 fixed; 3/11/62/82 partial
// Round 2: row 19 fixed; row 73 partial; new rows 93/94 fixed
// Round 3: rows 25/26/28/46 fixed; new rows 95/96/97/98/99 fixed
const fixedRows = [18, 19, 24, 25, 26, 28, 46, 61, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99];
const partialRows = [3, 11, 62, 73, 82];
for (const r of fixedRows) paintRow(ws, r, FILL_FIXED, FONT_FIXED);
for (const r of partialRows) paintRow(ws, r, FILL_PARTIAL, FONT_PARTIAL);

// ---------- Step 3: sync 統計摘要 ----------
// 驗證結果統計: V 67→77, ~ 10, 合計 77→87 (round 1: +3 V; round 2: +2 V; round 3: +5 V)
wsStat['B3'] = { t: 'n', v: 77 };
wsStat['C3'] = { t: 's', v: '88.5%' };
wsStat['C4'] = { t: 's', v: '11.5%' };
wsStat['B5'] = { t: 'n', v: 87 };
wsStat['D5'] = {
  t: 's',
  v: '已移除 8 項原始盤點中不正確的項目；2026-04-28 補登 10 項改版實作項目（#88-#97）',
};

// 各區塊問題統計:
//   i-Fare 福利查詢 修復 8→10, 提升 6→7, 小計 14→17 (round 1)
//   最新消息 修復 3, 提升 2→3, 小計 5→6 (round 3: +1 提升 #96)
//   關於長穩 修復 2, 提升 3→6, 小計 5→8 (round 3: +3 提升 #93/#94/#95)
//   共用元件 修復 14→15, 提升 0→2, 小計 14→17 (round 2: +2 提升; round 3: +1 修復 #97)
//   合計 修復 52→55, 提升 25→32, 小計 77→87
wsStat['B9'] = { t: 'n', v: 10 };
wsStat['C9'] = { t: 'n', v: 7 };
wsStat['D9'] = { t: 'n', v: 17 };
wsStat['C11'] = { t: 'n', v: 3 };
wsStat['D11'] = { t: 'n', v: 6 };
wsStat['C14'] = { t: 'n', v: 6 };
wsStat['D14'] = { t: 'n', v: 8 };
wsStat['B15'] = { t: 'n', v: 15 };
wsStat['C15'] = { t: 'n', v: 2 };
wsStat['D15'] = { t: 'n', v: 17 };
wsStat['B19'] = { t: 'n', v: 55 };
wsStat['C19'] = { t: 'n', v: 32 };
wsStat['D19'] = { t: 'n', v: 87 };

// 優先級分布:
//   中 修復 26→27, 提升 7→11, 小計 33→38 (round 1: +1修復+1提升; round 2: +1提升 #92; round 3: +2提升 #93/#96)
//   低 修復 21→23, 提升 17→20, 小計 38→43 (round 1: +1修復; round 2: +1提升 #91; round 3: +1修復 #97 + 2提升 #94/#95)
wsStat['B24'] = { t: 'n', v: 27 };
wsStat['C24'] = { t: 'n', v: 11 };
wsStat['D24'] = { t: 'n', v: 38 };
wsStat['B25'] = { t: 'n', v: 23 };
wsStat['C25'] = { t: 'n', v: 20 };
wsStat['D25'] = { t: 'n', v: 43 };

// ---------- Step 4: write back ----------
XLSX.writeFile(wb, FILE);

console.log('OK');
console.log(`Updated ${existingUpdates.length} existing rows: ${existingUpdates.map((u) => `row ${u.row}`).join(', ')}`);
console.log(`Appended ${newRows.length} new rows: ${newRows.map((n) => `row ${n.row} (#${n.data[0]})`).join(', ')}`);
console.log(`Painted: ${fixedRows.length} 已修正 rows (light green) + ${partialRows.length} 部分修正 rows (light yellow)`);
console.log('Synced 統計摘要 sheet (V 77 / ~ 10 / 合計 87)');
console.log(`File: ${FILE}`);
