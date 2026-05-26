// 2026-05-05 — 新增使用者後台 Dashboard 重構想法到 後臺優化 sheet
// Source: 使用者 2026-05-05 草圖（7 區塊整合 + 搜尋互動）
// Run: node scripts/add-backend-dashboard-idea.mjs

import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(__dirname, '..', 'docs', 'iFare_問題追蹤與AI維運規劃.xlsx');

const wb = XLSX.readFile(FILE, { cellStyles: true });
const ws = wb.Sheets['後臺優化'];
const range = XLSX.utils.decode_range(ws['!ref']);

// 找下一個可用 row
let nextRow = range.e.r + 1; // 0-indexed; 既有最後 row + 1
const newId = 53;

// 欄位 (0-indexed):
// 0=編號 1=驗證 2=區塊 3=子區塊 4=類型 5=分類 6=優先級 7=問題標題 8=問題描述
// 9=建議做法 10=相關檔案 11=需修改檔案 12=驗證備註 13=狀態 14=處理日期 15=備註
const cells = [
  { c: 0,  v: newId, t: 'n' },
  { c: 1,  v: 'V', t: 's' },
  { c: 2,  v: '後台首頁', t: 's' },
  { c: 3,  v: 'Dashboard 重構', t: 's' },
  { c: 4,  v: '提升', t: 's' },
  { c: 5,  v: '互動', t: 's' },
  { c: 6,  v: '高', t: 's' },
  { c: 7,  v: '後台首頁 Dashboard 重構 — 整合搜尋 / 總覽 / 待辦 / 快捷操作為工作入口', t: 's' },
  { c: 8,  v: '使用者目前進後台首頁是空白歡迎頁，無法快速找到要做的事或對應功能位置。希望首頁變成「工作入口頁」而非單純 logo + 歡迎語。', t: 's' },
  { c: 9,  v: '7 區塊整合：① 標題 + 提示文案；② 全站搜尋入口（可搜功能 / 頁面 / 文章 / 圖片，結果分「功能入口 / 相關內容 / 建議操作」三類）；③ 系統概況卡片（最新消息 / 福利專欄 / 頁面管理 / 待審核 / 草稿 共 5 個 metric）；④ 今日待辦（草稿未發布 / SEO 缺失 / 內容待審）；⑤ 最近更新（誰、何時、改了什麼）；⑥ 快捷操作（新增頁面 / 新增消息 / 進入頁管 / 上傳圖片）；⑦ 數據摘要 / 趨勢圖（第二期可緩做）', t: 's' },
  { c: 10, v: 'src/views/Index/IndexView.vue', t: 's' },
  { c: 11, v: '後台 Vue 3：重寫 src/views/Index/IndexView.vue 或新增 src/views/Dashboard/DashboardView.vue + 新增 src/composables/useDashboardSearch.ts；後端需新增 API：Dashboard/GetSummary（系統概況 + 待辦摘要）+ Dashboard/Search（全站搜尋）+ Dashboard/RecentActivity（最近更新）', t: 's' },
  { c: 12, v: '使用者明確要求「不再只是歡迎頁，是工作入口頁」。第一版可暫緩 ⑦ 數據摘要區。', t: 's' },
  { c: 13, v: '待處理', t: 's' },
  { c: 14, v: '', t: 's' },
  { c: 15, v: '來源：2026-05-05 使用者草圖。設計重點：「整合搜尋、總覽、待辦與快捷操作的工作入口頁，讓使用者快速找到要做的事與對應功能位置」。搜尋示例：輸入「步道」應回「功能入口（頁管 > 新增頁面 / 福利專欄 > 新增文章）/ 相關內容（頁管 步道專區、福利專欄 親子步道介紹、最新消息 步道公告）/ 建議操作（新增步道頁面 / 查看步道文章 / 前往圖片管理）」。', t: 's' },
];

for (const { c, v, t } of cells) {
  ws[XLSX.utils.encode_cell({ r: nextRow, c })] = { t, v };
}

// 更新 sheet range
ws['!ref'] = XLSX.utils.encode_range({
  s: range.s,
  e: { r: nextRow, c: Math.max(range.e.c, 15) },
});

XLSX.writeFile(wb, FILE);
console.log(`✅ 後臺優化 sheet 新增 #${newId} 後台 Dashboard 重構 (row ${nextRow + 1})`);
