// Round 14 — Emma UI/UX 工作（2026-05-18 day2b 批次）
//   #66 PageBuilder 前端顯示 v2 升級 — 自動同步 + SSR，狀態從「部分修正」更新為「已修正」
// Run: node scripts/update-uiux-tracking-round14-emma-uiux-day2b.mjs

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

const entry66 = {
  no: 66,
  cells: [
    66, 'V', '頁面管理', 'PageBuilder 前端顯示', '新增', '架構', '中',
    'PageBuilder 新增 page 完無法在前端顯示 — 前端動態路由 + 自動同步 (v2 完成)',
    'v1 跨應用 localStorage 不共享，PoC 用手動貼 JSON 走通渲染鏈路；v2 用 Nuxt server route 當中介層自動同步，後台儲存→fire-and-forget PUT→前端 useAsyncData 讀，達成「後台按下儲存→前端重整看得到」端到端體驗',
    '後台新建 utils/frontendSync.ts (fetch PUT 整批) + writeAll() dual write；後台 useFeedback 新增 successWithLink + AddEditView toast 加「前往前端預覽」連結；前端新建 server/utils/cors.ts + 3 個 server/api/dynamic-pages.{get,put,options}.ts 寫進 server/data/dynamic-pages.json；前端 composables/useDynamicPages.ts 改 async ($fetch) + pages/[slug].vue 改 useAsyncData + throw createError(404) 升級 SSR',
    'iFare_Backend/src/utils/frontendSync.ts (新建); iFare_Backend/src/composables/useDynamicPages.ts (writeAll 改); iFare_Backend/src/composables/useFeedback.ts (加 successWithLink); iFare_Backend/src/views/PageManagement/PageManagement_AddEditView.vue (toast 升級); iFare_Frontend/server/utils/cors.ts (新建); iFare_Frontend/server/api/dynamic-pages.{get,put,options}.ts (新建); iFare_Frontend/server/data/.gitignore (新建); iFare_Frontend/composables/useDynamicPages.ts (改寫); iFare_Frontend/pages/[slug].vue (改 SSR)',
    'Dev/Dev Code/iFare_Backend/src/utils/frontendSync.ts; Dev/Dev Code/iFare_Backend/src/composables/useDynamicPages.ts:180-186; Dev/Dev Code/iFare_Backend/src/composables/useFeedback.ts; Dev/Dev Code/iFare_Backend/src/views/PageManagement/PageManagement_AddEditView.vue; Dev/Dev Code/iFare_Frontend/server/utils/cors.ts; Dev/Dev Code/iFare_Frontend/server/api/dynamic-pages.get.ts; Dev/Dev Code/iFare_Frontend/server/api/dynamic-pages.put.ts; Dev/Dev Code/iFare_Frontend/server/api/dynamic-pages.options.ts; Dev/Dev Code/iFare_Frontend/composables/useDynamicPages.ts; Dev/Dev Code/iFare_Frontend/pages/[slug].vue; docs/iFare_PageBuilder_前端顯示PoC_2026-05-18.md',
    'v2 完整端到端：跨應用同步 ⚠️→✅、SSR/SEO ❌→✅、404 真正回傳 ❌→✅；後台 writeAll 是所有 mutation 唯一 persist 入口，改一處 cover insert/update/remove/importJson',
    '已修正', TODAY,
    'dev only — prod 上線要把 Nuxt server JSON 中介層換成 .NET API（已在 frontendSync 預留 VITE_FRONTEND_SYNC_URL env var）；發布排程 worker、slug 衝突、多人協作互蓋仍未做',
  ],
};

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
    writeCells(ws, existingRow, entry.cells);
    return { action: 'update', row: existingRow };
  }

  const nextRow = range.e.r + 1;
  writeCells(ws, nextRow, entry.cells);
  ws['!ref'] = XLSX.utils.encode_range({
    s: range.s,
    e: { r: nextRow, c: Math.max(range.e.c, entry.cells.length - 1) },
  });
  return { action: 'append', row: nextRow };
}

const r66 = upsertEntry('後臺優化', entry66);

XLSX.writeFile(wb, FILE);

console.log(`✅ Round 14 Emma UI/UX day2b (${TODAY}) 完成`);
console.log(`   後臺優化 #66: ${r66.action} (row ${r66.row + 1}) — 狀態升級為「已修正」`);
console.log('提醒：今日先不跑 compact-xlsx-theme.mjs（依使用者指示）');
