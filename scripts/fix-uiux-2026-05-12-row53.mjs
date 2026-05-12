// Fix script: sheet2 有兩個 #53（重複編號）
// - Row 49 = #53「效能 / 大列表 lazy load」← 之前誤標為「部分修正」，需 revert
// - Row 57 = #53「後台首頁 Dashboard 重構」← 該被標「部分修正」但沒更新到
//
// 之前 update-uiux-2026-05-12-batch.mjs 用 findRowById 找第一個 match 就 return，
// 所以只動到 Row 49，內容是後台 Dashboard 的 note，完全 mismatch。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx-js-style';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.resolve(__dirname, '..', 'docs');
const workbookFileName = fs.readdirSync(docsDir).find((name) => name.endsWith('.xlsx'));
const file = path.join(docsDir, workbookFileName);
const today = '2026-05-12';
const wb = XLSX.readFile(file, { cellStyles: true });

const ws = wb.Sheets['後臺優化'];
if (!ws) throw new Error('後臺優化 sheet not found');

function setCell(rowNum1Based, col0Based, value) {
  // SheetJS cell 用 A1-style address，r 是 0-based row index，c 是 0-based col index
  const addr = XLSX.utils.encode_cell({ r: rowNum1Based - 1, c: col0Based });
  ws[addr] = {
    ...(ws[addr] || {}),
    v: value,
    t: typeof value === 'number' ? 'n' : 's',
  };
}

function clearCell(rowNum1Based, col0Based) {
  const addr = XLSX.utils.encode_cell({ r: rowNum1Based - 1, c: col0Based });
  ws[addr] = { ...(ws[addr] || {}), v: '', t: 's' };
}

// ─── Row 49 (#53 效能 lazy load) — revert ───
// 之前誤填 HomeView 內容，恢復「待處理」並清掉錯的 M/O/P
clearCell(49, 12); // M 驗證備註
setCell(49, 13, '待處理'); // N 狀態
clearCell(49, 14); // O 處理日期
clearCell(49, 15); // P 備註
console.log('Row 49 (#53 lazy load) reverted to 待處理');

// ─── Row 57 (#53 後台首頁 Dashboard) — 補標部分修正 ───
setCell(57, 12, 'HomeView.vue +365 行（commit 93d1186）後台首頁整體重構。');
setCell(57, 13, '部分修正');
setCell(57, 14, today);
setCell(57, 15, '部分修正 — Codex 大改完整 Dashboard 結構，但整合搜尋 / 總覽 / 待辦 / 快捷的完整性待 review。');
console.log('Row 57 (#53 後台首頁 Dashboard) marked 部分修正');

// 統計（針對主清單 sheet3，跟既有 pattern 一致）
const ws3 = wb.Sheets['UIUX問題追蹤清單'];
const summary = wb.Sheets['統計摘要'];
if (ws3 && summary) {
  const rows = XLSX.utils.sheet_to_json(ws3, { header: 1, defval: '' }).slice(2).filter((row) => row[0]);
  const counts = {
    total: rows.length,
    fixed: rows.filter((row) => row[13] === '已修正').length,
    partial: rows.filter((row) => row[13] === '部分修正').length,
    pending: rows.filter((row) => row[13] === '待處理' || row[13] === '未修正').length,
  };
  console.log(`sheet3 stats: ${counts.fixed}/${counts.total} = ${((counts.fixed / counts.total) * 100).toFixed(1)}%`);
}

XLSX.writeFile(wb, file, { compression: true });
console.log('Done.');
