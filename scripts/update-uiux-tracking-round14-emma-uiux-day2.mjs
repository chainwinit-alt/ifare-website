// Round 14 — Emma UI/UX 工作（2026-05-18 day2 批次）
//   1. 後臺 #3 統一 loading/success/failure 回饋（Loading 主題）
//   2. 後臺 #66 PageBuilder 前端顯示 PoC
// Run: node scripts/update-uiux-tracking-round14-emma-uiux-day2.mjs

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

const STATUS_COL = 13;
const DATE_COL = 14;
const REMARK_COL = 15;

// ------------ 條目 ------------

// #3 統一 loading/success/failure 回饋（Loading 主題第三批）
// 來自 docs/iFare_後台優化規劃_2026-05-12.md 第一階段
const entry3 = {
  no: 3,
  cells: [
    3, 'V', '共用元件', 'Loading / Feedback', '提升', '互動', '高',
    '統一 loading / success / failure 回饋介面',
    '各頁面直接 ElMessage({ type, message }) 散落呼叫，文案散亂、error 沒展開 Error.message 難 debug、無 loading mask 統一行為；未來切後端 API 沒有共用 await 包裝',
    '建立 src/composables/useFeedback.ts，封裝 success / error / info / warning + runAsync(fn, { loadingText, successText, errorText })；先在 PageManagement DataList、PageManagement AddEdit、LoginView、HomeView 4 支示範頁導入，其餘頁面後續批次',
    'src/composables/useFeedback.ts',
    'Dev/Dev Code/iFare_Backend/src/composables/useFeedback.ts (新建); src/views/PageManagement/PageManagement_DataListView.vue; src/views/PageManagement/PageManagement_AddEditView.vue; src/views/LoginView.vue; src/views/HomeView.vue',
    '示範樣板完成，其餘後台頁面後續批次再導入；runAsync 預留 ElLoading.service mask 介面，未來接後端 API 不用改呼叫端',
    '已修正', TODAY,
    'Round 14 第三批 Loading 主題核心項；error() 同時 console.error 保留 stack，避免 ElMessage swallow',
  ],
};

// #66 PageBuilder 前端顯示 PoC（架構性新增）
const entry66 = {
  no: 66,
  cells: [
    66, 'V', '頁面管理', 'PageBuilder 前端顯示', '新增', '架構', '中',
    'PageBuilder 新增 page 完無法在前端顯示 — 加前端動態路由 PoC 走通渲染鏈路',
    '後台 PageBuilder（commit cea8433）已能新增/編輯/儲存於 localStorage iFare_dynamic_pages_v2，但前端 Nuxt 無 catch-all 動態路由、無讀取 composable，DynamicPageRenderer 只給後台 iframe preview 用，「新增完前端看不到」',
    '後台 DataListView 加「複製 JSON」按鈕；前端新增 composables/useDynamicPages.ts（從 localStorage 讀 + getPageBySlug + isPublishable 判 status/publishTime/unpublishTime）；前端新增 pages/[slug].vue 動態路由 + ClientOnly 包覆 + 找不到顯示 fallback；寫 docs/iFare_PageBuilder_前端顯示PoC_2026-05-18.md 記錄範圍與後續工程化',
    'iFare_Frontend/pages/[slug].vue (新建); iFare_Frontend/composables/useDynamicPages.ts (新建); iFare_Backend/src/views/PageManagement/PageManagement_DataListView.vue',
    'Dev/Dev Code/iFare_Frontend/pages/[slug].vue; Dev/Dev Code/iFare_Frontend/composables/useDynamicPages.ts; Dev/Dev Code/iFare_Backend/src/views/PageManagement/PageManagement_DataListView.vue; docs/iFare_PageBuilder_前端顯示PoC_2026-05-18.md',
    'PoC 階段跨應用同步用「後台複製 JSON → 前端 devtools 貼 localStorage」代替後端 API；後續 SSR/SEO/排程 worker/slug 衝突 待後端 API 接好再做',
    '部分修正', TODAY,
    '走通渲染鏈路；尚需 .NET API 把 localStorage 換成真同步，發布排程 worker、SSR、404 真正回傳 都列在 PoC 文件後續工程化',
  ],
};

// ------------ 操作 ------------

function findRowByNo(ws, no) {
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    const cell = ws[XLSX.utils.encode_cell({ r, c: 0 })];
    if (!cell) continue;
    const v = cell.v;
    if (typeof v === 'number' ? v === no : String(v).trim() === String(no)) return r;
  }
  return -1;
}

function writeCells(ws, rowIdx, cells) {
  for (let c = 0; c < cells.length; c++) {
    const v = cells[c];
    const t = typeof v === 'number' ? 'n' : 's';
    ws[XLSX.utils.encode_cell({ r: rowIdx, c })] = { t, v };
  }
}

function upsertEntry(sheetName, entry) {
  const ws = wb.Sheets[sheetName];
  const range = XLSX.utils.decode_range(ws['!ref']);
  const existingRow = findRowByNo(ws, entry.no);

  if (existingRow >= 0) {
    // 更新：保留前段欄位文字（除非新值非空），明確改 狀態 / 日期 / 備註
    writeCells(ws, existingRow, entry.cells);
    return { action: 'update', row: existingRow };
  }

  // append
  const nextRow = range.e.r + 1;
  writeCells(ws, nextRow, entry.cells);
  ws['!ref'] = XLSX.utils.encode_range({
    s: range.s,
    e: { r: nextRow, c: Math.max(range.e.c, entry.cells.length - 1) },
  });
  return { action: 'append', row: nextRow };
}

const r3 = upsertEntry('後臺優化', entry3);
const r66 = upsertEntry('後臺優化', entry66);

XLSX.writeFile(wb, FILE);

console.log(`✅ Round 14 Emma UI/UX day2 (${TODAY}) 完成`);
console.log(`   後臺優化 #3: ${r3.action} (row ${r3.row + 1})`);
console.log(`   後臺優化 #66: ${r66.action} (row ${r66.row + 1})`);
console.log('提醒：「統計摘要」sheet 未自動更新');
console.log('提醒：今日先不跑 compact-xlsx-theme.mjs（依使用者指示）');
