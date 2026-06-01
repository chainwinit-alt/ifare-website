// 2026-05-05 — 補進今天 3 塊漏記的工作：
//   1. 新增 #143  About 頁「執行長 顏杏蓉」layout 重構（已修正）
//   2. 新增 #144  後台 PageManagement CMS — 從後台新增前端頁面（部分修正）
//   3. 更新 #136 浮動入口按鈕 → 部分修正（CompChatbotEntry.vue 已建）
//   4. 更新 #137 Welcome 開場畫面 → 部分修正（CompChatbotWelcome.vue 已建）
// Run: node scripts/add-uiux-143-144-update-chatbot-progress.mjs

import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(__dirname, '..', 'docs', 'iFare_問題追蹤與AI維運規劃.xlsx');

const wb = XLSX.readFile(FILE, { cellStyles: true });
const ws = wb.Sheets['UIUX問題追蹤清單'];
const range = XLSX.utils.decode_range(ws['!ref']);

// ── 顏色（與既有 row 對齊） ──
const FILL_DONE = { patternType: 'solid', fgColor: { rgb: 'C6EFCE' } };       // 已修正 = 綠
const FILL_PARTIAL = { patternType: 'solid', fgColor: { rgb: 'FFEB9C' } };    // 部分修正 = 黃
const ALIGN = { vertical: 'center', wrapText: true };

const TODAY = '2026-05-05';

// ── 1+2: 新增 row ──
const NEW_ROWS = [
  {
    id: 143,
    area: '關於我們',
    sub: 'about / 執行長區塊',
    type: '修正',
    category: '排版',
    priority: '中',
    title: 'About 頁「執行長 顏杏蓉」區塊上下排版重構 + 名字靈動島 + 卡片寬度對齊',
    desc: '原本「執行長」label 與「顏杏蓉」名字橫排（label 在左、名字在右），且下方 4 卡片（一起加入行動 / 成為志工 / 成為合作夥伴 / 支持我們）寬度比上方 .card-advance（920px）窄，視覺重心不一致。',
    suggest: '(1) 改為「執行長」label 在上、「顏杏蓉」橘膠囊在下，與「董事長」區塊排法一致 (2) 「顏杏蓉」橘膠囊加靈動島 hover 效果（cubic-bezier(0.32,0.72,0,1) translateY(-4px) scale(1.04) + box-shadow）(3) 4 卡片 .purpose-list 加 max-width: 920px !important 與上方 .card-advance 寬度齊一。',
    files: 'Dev/Dev Code/iFare_Frontend/pages/about.vue（只動 scoped style）',
    status: '已修正',
    notes: '同一 PR 內順手做，無新增依賴。RWD < 768px 4 卡片改回垂直 stack。SCSS 特異度衝突用 .app-body[name="about"] 父選擇器 + !important 解決（避免被 _appBody_about.scss global 蓋）。',
    fill: FILL_DONE,
  },
  {
    id: 144,
    area: '後台',
    sub: 'PageManagement / 動態頁 CMS',
    type: '提升',
    category: '功能',
    priority: '中',
    title: '後台 PageManagement CMS — 從後台新增前端頁面（v1→v4）',
    desc: '原後台無「新增前端頁面」工具，要新增 about / collaborator 之外的靜態頁需要前端工程師寫 Nuxt 頁面。需要一個讓非工程師（編輯）可以拖拉組裝頁面、即時預覽、發布的系統。',
    suggest: 'v1: 10 種 generic block（被否決—太抽象）→ v2: 5 種 iFare 專用 section 範本（hero / text-section / four-card / image-text / cta-card）+ localStorage CRUD + HTML5 native drag 排序 → v3: iframe 預覽指向前端 dev server (localhost:3000/preview)，postMessage 即時推 form 資料 → v4: 範本庫改視覺縮圖 mockup（純 CSS divs，5 種對應前端真實渲染）。',
    files: '後台新檔: src/composables/useDynamicPages.ts / src/components/PageBuilder/{SectionEditor,SectionList,PreviewPane}.vue / src/views/PageManagement/{IndexView,DataListView,AddEditView}.vue。前端新檔: components/DynamicPage/{DynamicPageRenderer,SectionHero,SectionTextBlock,SectionFourCard,SectionImageText,SectionCtaCard}.vue / pages/preview.vue / types/dynamic-page.ts。後台改: src/router/index.ts / src/data/AsideMenu.json。',
    status: '部分修正',
    notes: 'CMS UI + 預覽 + 5 種範本已完成（v4）。仍待: (1) 後端 API 串接（取代 localStorage）(2) 前端 pages/[...slug].vue 動態路由（publish 後實際渲染）(3) 拖拉新增（從 gallery 拉到 section list 指定位置 — 下一階段）(4) 上正式機需把 iframe src 改成 prod URL（process.env.NUXT_PUBLIC_SITE_URL）。',
    fill: FILL_PARTIAL,
  },
];

let nextRow = range.e.r + 1;
const startRow = nextRow + 1;

for (const r of NEW_ROWS) {
  const cells = [
    { c: 0,  v: r.id, t: 'n' },
    { c: 1,  v: 'V', t: 's' },
    { c: 2,  v: r.area, t: 's' },
    { c: 3,  v: r.sub, t: 's' },
    { c: 4,  v: r.type, t: 's' },
    { c: 5,  v: r.category, t: 's' },
    { c: 6,  v: r.priority, t: 's' },
    { c: 7,  v: r.title, t: 's' },
    { c: 8,  v: r.desc, t: 's' },
    { c: 9,  v: r.suggest, t: 's' },
    { c: 10, v: r.files, t: 's' },
    { c: 11, v: r.files, t: 's' },
    { c: 12, v: '', t: 's' },
    { c: 13, v: r.status, t: 's', fill: r.fill },
    { c: 14, v: TODAY, t: 's' },
    { c: 15, v: r.notes, t: 's' },
  ];
  for (const { c, v, t, fill } of cells) {
    const addr = XLSX.utils.encode_cell({ r: nextRow, c });
    ws[addr] = { t, v, s: { alignment: ALIGN, ...(fill ? { fill } : {}) } };
  }
  console.log(`✅ #${r.id} ${r.sub} 加入 (row ${nextRow + 1}, 狀態: ${r.status})`);
  nextRow += 1;
}

// 擴大 sheet ref
ws['!ref'] = XLSX.utils.encode_range({
  s: range.s,
  e: { r: nextRow - 1, c: Math.max(range.e.c, 15) },
});

// ── 3+4: 更新 #136 / #137 狀態為「部分修正」+ 加處理日期 ──
const UPDATES = [
  { id: 136, status: '部分修正', date: TODAY, fill: FILL_PARTIAL,
    note: 'CompChatbotEntry.vue 已建（layouts/default.vue 已 mount）。剩 hover tooltip + 吉祥物頭像未做。' },
  { id: 137, status: '部分修正', date: TODAY, fill: FILL_PARTIAL,
    note: 'CompChatbotWelcome.vue 已建（首次展開畫面）。Quick Actions 4 個按鈕內容暫定（需確認）、Suggestion Chips 待從熱門 query 抽。' },
];

const newRange = XLSX.utils.decode_range(ws['!ref']);
for (let r = 2; r <= newRange.e.r; r++) {
  const idCell = ws[XLSX.utils.encode_cell({ r, c: 0 })];
  const id = Number(idCell?.v);
  const upd = UPDATES.find((u) => u.id === id);
  if (!upd) continue;

  // 更新狀態 (col 13)
  const statusAddr = XLSX.utils.encode_cell({ r, c: 13 });
  const existing = ws[statusAddr] || {};
  ws[statusAddr] = {
    t: 's',
    v: upd.status,
    s: { ...(existing.s || {}), alignment: ALIGN, fill: upd.fill },
  };

  // 加處理日期 (col 14)
  const dateAddr = XLSX.utils.encode_cell({ r, c: 14 });
  ws[dateAddr] = { t: 's', v: upd.date, s: { alignment: ALIGN } };

  // 補備註 (col 15) — 不覆蓋原本，append
  const noteAddr = XLSX.utils.encode_cell({ r, c: 15 });
  const oldNote = String(ws[noteAddr]?.v || '');
  const merged = oldNote ? `${oldNote}\n[${upd.date}] ${upd.note}` : upd.note;
  ws[noteAddr] = { t: 's', v: merged, s: { alignment: ALIGN } };

  console.log(`🔄 #${id} 狀態: 待處理 → ${upd.status}（已加 ${upd.date} 處理日期）`);
}

XLSX.writeFile(wb, FILE);
console.log('---');
console.log(`✅ 新增 2 筆（#143 about, #144 PageManagement）+ 更新 2 筆（#136, #137）`);
console.log(`   檔案: ${FILE}`);
