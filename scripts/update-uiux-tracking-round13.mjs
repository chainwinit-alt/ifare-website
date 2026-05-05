// Round 13 (2026-05-05) — 雜項快速掃 + #132 b89f5b9 取代 + 後台 Dashboard 想法登錄
//   完成 (6 已修): #37 logo alt + #49 版權年份(verified) + #52 分頁 aria + #53 console.log + #75 Magic number + #77 sitemap
//   部分修正 (1): #76 Transition 變數系統建立 (舊 scss 待批次替換)
//   跳過 (2): #15 陰影 opacity (issue 描述模糊待主管確認) / #41 麵包屑語意 (依賴 #40 CompBreadCrumb 先實作)
//   #132: master b89f5b9 (v1.0.3) BM25 模糊搜尋取代 OR == 1，自動解決
// Run: node scripts/update-uiux-tracking-round13.mjs

import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(__dirname, '..', 'docs', 'iFare_UI_UX_問題追蹤清單.xlsx');
const TODAY = '2026-05-05';

const wb = XLSX.readFile(FILE, { cellStyles: true });
const ws = wb.Sheets['UIUX問題追蹤清單'];

// id → row mapping (row = id + 2，跟 round12 一致)
const updates = [
  {
    id: 37, row: 39,
    status: '已修正',
    note: 'Round 13 (雜項): components/AppHeader.vue logo NuxtLink 加 aria-label="iFare 基金會 — 回首頁"，<i class="ic-logo"> 加 role="img" + aria-hidden="true"，<h4 class="ic-logo-title"> 加 aria-hidden="true"。AppHeader.vue 行動選單 logo NuxtLink 同樣加 aria-label。components/AppFooter.vue ic-footer-logo 加 role="img" + aria-label="iFare 基金會"。3 處 logo 全部補完。',
  },
  {
    id: 49, row: 51,
    status: '已修正',
    note: 'Round 13 (雜項 — 驗證): components/AppFooter.vue:42 已使用 © 1995-{{ new Date().getFullYear() }}，動態年份。過去某 round 已修，本次 verify-only 確認。',
  },
  {
    id: 52, row: 54,
    status: '已修正',
    note: 'Round 13 (雜項): components/CompPage.vue + CompPageNum.vue 修：(1) <div class="page-component"> → <nav aria-label="分頁導覽">；(2) prev/next button 加 type="button" + :disabled + aria-label="上一頁/下一頁"，<i class="ic-arrow-simple"> 加 aria-hidden="true"；(3) CompPage 列表 <li> 加 role="button" + tabindex="0" + :aria-current="_page.isActive ? \'page\' : undefined" + :aria-label="`第 N 頁`" + Enter/Space keydown 處理。',
  },
  {
    id: 53, row: 55,
    status: '已修正',
    note: 'Round 13 (雜項): 全前台 console.log 清掃。(1) middleware/route.global.ts 移除 visitorRecord.then(res) 內 // console.log；(2) components/CompPage.vue PageNext 內 console.log(props.pageList) 移除；(3) components/CompPageNum.vue PageNext 內 5 個 console 移除；(4) pages/articles.vue setFilter / isSelectOpen 內註解 console；(5) pages/ifare/contact.vue / pages/ifare/result.vue / pages/ifare.vue isSelectOpen / getSelectValue 內註解 console 全清。',
  },
  {
    id: 75, row: 77,
    status: '已修正',
    note: 'Round 13 (雜項 — 限縮 4 處最明顯): (1) middleware/route.global.ts 抽 RELOAD_CACHE_TTL_MS = 3000 / RELOAD_DEFER_MS = 10；(2) pages/ifare/info.vue 抽 QUALIFICATION_PREVIEW_LENGTH = 50（取代 .slice(0,50)）；(3) pages/ifare/result.vue 同上抽 QUALIFICATION_PREVIEW_LENGTH = 50；(4) pages/index.vue 抽 TOP_WELFARE_DISPLAY_COUNT = 3（取代 .slice(0,3)）。其餘 magic number (CompPage WIDTH_PAGEITEM=52 已是常數 / 其他散值) 留待下回批次。',
  },
  {
    id: 76, row: 78,
    status: '部分修正',
    note: 'Round 13 (雜項 — 部分): assets/style/_transition.scss 新增變數系統 — $transition-fast=0.15s / $transition-base=0.25s / $transition-medium=0.3s / $transition-slow=0.5s + $ease-standard cubic-bezier(0.32,0.72,0,1) + $ease-out + $ease-in-out。新增 4 個 utility class (.transition-fast/base/medium/slow)。舊有 7 個雜亂值 (.1s / .22s / .25s / .28s / .3s / .32s / .5s) 散在 _animation.scss / _appHeader.scss / _appBody.scss / _appBody_ifare.scss / _appBody_about.scss 待後續批次替換為變數。',
  },
  {
    id: 77, row: 79,
    status: '已修正',
    note: 'Round 13 (雜項): nuxt.config.ts 頂層加 const SITEMAP_LASTMOD = new Date().toISOString()；replace_all 將 6 個 routeRules (/, /about, /news, /articles, /collaborator, /ifare) 內硬編碼 lastmod \'2023-12-27T11:09:27+00:00\' 改為 SITEMAP_LASTMOD。Build 時自動取最新時間，每次 build 觸發 SEO re-crawl。',
  },
  {
    id: 132, row: 134,
    status: '已修正',
    note: 'Round 13 (雜項 — 取代解決): master b89f5b9 (v1.0.3) 引入 BM25 + TraditionalChineseFuzzyMatcher 混合模糊搜尋，FarePolicyTaskManager.cs 已改用評分排序 + 0.08 閾值過濾，OR == 1 行為被取代。原始 Round 11 22eac37 fix 已 revert (91b083a)，問題透過架構升級自動解決。',
  },
];

for (const u of updates) {
  ws[XLSX.utils.encode_cell({ r: u.row - 1, c: 13 })] = { t: 's', v: u.status };
  ws[XLSX.utils.encode_cell({ r: u.row - 1, c: 14 })] = { t: 's', v: TODAY };
  ws[XLSX.utils.encode_cell({ r: u.row - 1, c: 15 })] = { t: 's', v: u.note };
}

XLSX.writeFile(wb, FILE);
console.log(`✅ Round 13 標完 ${updates.length} 個項目 (含 #132 取代)`);
console.log('  已修正:', updates.filter(u => u.status === '已修正').map(u => `#${u.id}`).join(', '));
console.log('  部分修正:', updates.filter(u => u.status === '部分修正').map(u => `#${u.id}`).join(', '));
console.log('  跳過 (待主管確認 / 依賴其他項目): #15 (描述模糊), #41 (依賴 #40)');
