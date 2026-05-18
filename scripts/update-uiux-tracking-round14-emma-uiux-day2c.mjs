// Round 14 — Emma UI/UX 工作（2026-05-18 day2c 批次）
//   #66 PageBuilder 前端顯示 Day2-fix — createDefaultPage 預設 status published
//   只更新「驗證備註」與「備註」兩欄，其他欄位保留
// Run: node scripts/update-uiux-tracking-round14-emma-uiux-day2c.mjs

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

const VERIFY_REMARK_COL = 12;
const STATUS_COL = 13;
const DATE_COL = 14;
const REMARK_COL = 15;

const NEW_VERIFY_REMARK =
  'v2 完整端到端：跨應用同步 ⚠️→✅、SSR/SEO ❌→✅、404 真正回傳 ❌→✅；Day2-fix 把 createDefaultPage 預設 status 從 draft 改成 published，符合「按下新增就到前端」體驗；後台 writeAll 是所有 mutation 唯一 persist 入口，改一處 cover insert/update/remove/importJson';

const NEW_REMARK =
  'dev only — prod 上線要把 Nuxt server JSON 中介層換成 .NET API（已在 frontendSync 預留 VITE_FRONTEND_SYNC_URL env var）；Day2-fix toast 偵測 status=draft 改顯示 warning 提示前端不顯示；發布排程 worker、slug 衝突、多人協作互蓋、預設改回 draft + 審核工作流 仍未做';

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

function setCell(ws, rowIdx, colIdx, value) {
  ws[XLSX.utils.encode_cell({ r: rowIdx, c: colIdx })] = {
    t: typeof value === 'number' ? 'n' : 's',
    v: value,
  };
}

const ws = wb.Sheets['後臺優化'];
const row = findRowByNo(ws, 66);

if (row < 0) {
  console.error('❌ 找不到 sheet2 #66');
  process.exit(1);
}

setCell(ws, row, VERIFY_REMARK_COL, NEW_VERIFY_REMARK);
setCell(ws, row, STATUS_COL, '已修正');
setCell(ws, row, DATE_COL, TODAY);
setCell(ws, row, REMARK_COL, NEW_REMARK);

XLSX.writeFile(wb, FILE);

console.log(`✅ Round 14 Emma UI/UX day2c (${TODAY}) 完成`);
console.log(`   後臺優化 #66 (row ${row + 1}): 驗證備註 + 備註 加註 Day2-fix`);
console.log('提醒：今日先不跑 compact-xlsx-theme.mjs（依使用者指示）');
