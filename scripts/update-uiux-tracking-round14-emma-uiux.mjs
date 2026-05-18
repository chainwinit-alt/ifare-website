// Round 14 — Emma UI/UX 工作（2026-05-18 批次）
//   1. 前台 chatbot 純 AI 兜底蓋寫修正
//   2. 後台 PageManagement 編輯頁 RWD + 人性化
//   3. 後台 sidebar 收放功能
//   4. 後台 PageManagement 編輯頁 — 快速開始區塊瘦身
// Run: node scripts/update-uiux-tracking-round14-emma-uiux.mjs
// 後續：node scripts/compact-xlsx-theme.mjs（壓掉 theme1.xml 膨脹）

import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(__dirname, '..', 'docs', 'iFare_UI_UX_問題追蹤清單.xlsx');
const TODAY = '2026-05-18';

const wb = XLSX.readFile(FILE, { cellStyles: true });

// 欄位順序（共 16 欄）：
// 0=編號 1=驗證 2=區塊 3=子區塊 4=類型 5=分類 6=優先級
// 7=問題標題 8=問題描述 9=建議做法 10=相關檔案 11=需修改檔案
// 12=驗證備註 13=狀態 14=處理日期 15=備註

const frontEntries = [
  {
    no: 166,
    cells: [
      166, 'V', '全站通用', '聊天機器人純 AI 模式', '修復', '互動', '中',
      '聊天機器人「純 AI」模式仍被後端兜底蓋寫，違反完整 AI 回答承諾',
      '使用者切「純 AI」模式時，訊息命中 isBroadWelfareQuery（福利/補助/資格/申請/政策/ifare）且 Gemini 回答太籠統時，後端會把 AI 原文整段換成固定 4 類引導文案，使「純 AI = 完整 AI 回答」承諾失效',
      'chatbot.post.ts finalReply 兜底條件加 requestMode === \'hybrid\' 限制；ai 模式直接回 AI 原文，其他保底（rate limit / Gemini 錯誤 / API 未設定 / AI 回空字串）維持',
      'server/api/chatbot.post.ts',
      'Dev/Dev Code/iFare_Frontend/server/api/chatbot.post.ts:378-393',
      '前一輪 #161 / #162 修了知識庫優先 + UI loading，本次處理「ai 模式被兜底蓋寫」這個遺留問題；hybrid 模式行為完全不變',
      '已修正', TODAY,
      'shouldApplyBroadWelfareFallback 加 hybrid 條件；ai 模式 100% 走 Gemini 原文',
    ],
  },
];

const backEntries = [
  {
    no: 63,
    cells: [
      63, 'V', '頁面管理', '編輯頁面 RWD', '修復', 'RWD', '高',
      'PageManagement 編輯頁面 RWD + 人性化 — 預覽區硬寫 720 / 卡片內文逐字斷 / 斷點稀疏',
      '預覽區 .preview-pane-wrap 硬寫 width:720px + flex-shrink:0，加 edit-pane flex:1 → 中等視窗（1024-1380）編輯區被擠窄；preset 卡片內文中文逐字斷成「主視覺/文字段落/圖」縱列；斷點只有 1380/960 兩個，平板/中小桌機真空',
      '預覽區改 flex:1 1 480px + max-width:720 + min-width:360；grid 子項目 (.preset-grid > * 等) 加 min-width:0 + word-break:break-word + overflow-wrap:anywhere；斷點細化第一輪 1200/1024/768，第二輪堆疊斷點 1200→1440、預覽 flex-basis 480→360',
      'src/views/PageManagement/PageManagement_AddEditView.vue',
      'Dev/Dev Code/iFare_Backend/src/views/PageManagement/PageManagement_AddEditView.vue:1020-1065, 1163-1170, 1493-1530',
      '兩輪改動：第一輪預覽彈性化 + grid 子項目 word-break + 斷點細化；第二輪因 viewport 1500 仍擠，把堆疊斷點從 1200 提到 1440、預覽 flex-basis 480→360',
      '已修正', TODAY,
      '純 CSS 改動，不動 script / template；保留 in-progress 的 autosave / draft / slug 邏輯',
    ],
  },
  {
    no: 64,
    cells: [
      64, 'V', '共用元件', 'AppAside / AppHeader sidebar 收放', '提升', '互動', '高',
      '後台 sidebar 固定 300px 無法收合 — 編輯類頁面橫向空間嚴重不夠',
      'AppAside.vue 用 el-aside 預設 300px 寬無 collapse 機制，編輯類頁面（特別是 PageManagement 編輯頁同時顯示編輯區 + 預覽區）橫向空間被吃掉 300px 給只看不點的選單',
      'App.vue 加 isSidebarCollapsed ref + localStorage 持久化；AppAside 收 collapsed prop 動態 el-aside width 300/0 + transition 0.25s；AppHeader 麵包屑左側加 hamburger 按鈕（Element Plus Expand/Fold icon）emit toggle-sidebar',
      'src/App.vue / src/components/AppAside.vue / src/components/AppHeader.vue',
      'Dev/Dev Code/iFare_Backend/src/App.vue / src/components/AppAside.vue / src/components/AppHeader.vue',
      '選完全收合（width 0）而非 Element Plus icon-only collapse 模式，因為 menuList JSON 無 icon 欄位 + 11 個 menu 都要選圖示 scope 太大',
      '已修正', TODAY,
      'localStorage key: ifare-backend:sidebar-collapsed；登出頁 sidebar/header 仍被 v-if 隱藏不顯示 toggle',
    ],
  },
  {
    no: 65,
    cells: [
      65, 'V', '頁面管理', '編輯頁面 UX 簡化', '提升', '視覺', '中',
      'PageManagement 編輯頁 — 快速開始白卡視覺雜訊過多，需瘦身引導說明',
      '快速開始白卡塞太多引導與狀態提示：3 Steps 橘 badge + 大段「先挑常用模板...」副標 + draft-status 暫存狀態小卡 + status-explainer 狀態說明小卡，視覺雜訊蓋過實際表單',
      '刪 3 段純說明性 template：quick-start-head（line 22-28）、draft-status（line 30-33）、status-explainer（line 97-100）；保留 preset 兩張卡片 + autosave 邏輯（無 UI 提示但仍跑）',
      'src/views/PageManagement/PageManagement_AddEditView.vue',
      'Dev/Dev Code/iFare_Backend/src/views/PageManagement/PageManagement_AddEditView.vue',
      'Emma 透過 multiSelect 精準勾選要拿掉的 3 個子項目；preset 卡片未勾故保留',
      '已修正', TODAY,
      '未用 computed（draftStatusTitle 等）與對應 SCSS 暫保留作未來素材，要徹底清理可另開',
    ],
  },
];

function appendRows(sheetName, entries) {
  const ws = wb.Sheets[sheetName];
  const range = XLSX.utils.decode_range(ws['!ref']);
  let nextRow = range.e.r + 1;

  for (const entry of entries) {
    for (let c = 0; c < entry.cells.length; c++) {
      const v = entry.cells[c];
      const t = typeof v === 'number' ? 'n' : 's';
      ws[XLSX.utils.encode_cell({ r: nextRow, c })] = { t, v };
    }
    nextRow += 1;
  }

  ws['!ref'] = XLSX.utils.encode_range({
    s: range.s,
    e: { r: nextRow - 1, c: Math.max(range.e.c, 15) },
  });

  return entries.length;
}

const addedFront = appendRows('UIUX問題追蹤清單', frontEntries);
const addedBack = appendRows('後臺優化', backEntries);

XLSX.writeFile(wb, FILE);

console.log(`✅ Round 14 Emma UI/UX (${TODAY}) append 完成`);
console.log(`   UIUX問題追蹤清單 (前台): +${addedFront} 條 — ${frontEntries.map((e) => `#${e.no}`).join(', ')}`);
console.log(`   後臺優化: +${addedBack} 條 — ${backEntries.map((e) => `#${e.no}`).join(', ')}`);
console.log('提醒：「統計摘要」sheet 本次未自動更新，請手動或下次 batch 處理');
console.log('提醒：跑 node scripts/compact-xlsx-theme.mjs 壓掉 theme1.xml 膨脹');
