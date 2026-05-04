// 修復 xlsx 檔案異常變大 (theme1.xml 800+ MB)
// 用 xlsx (純 read/write，無 theme 注入) 讀資料，重建乾淨檔案
// 然後用 xlsx-js-style 再套上 styles
// Run: node scripts/repair-xlsx-bloat.mjs

import XLSX from 'xlsx-js-style';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(__dirname, '..', 'docs', 'iFare_UI_UX_問題追蹤清單.xlsx');
const TMP = path.resolve(__dirname, '..', 'docs', '__repair_tmp.xlsx');

console.log('原始檔案大小:', fs.statSync(FILE).size, 'bytes');

// 1. 讀入 (含 styles)
const wb = XLSX.readFile(FILE, { cellStyles: true });

// 2. 強制移除 Themes / vbaraw / 任何可能 bloat 的 workbook 級資料
delete wb.Themes;
delete wb.vbaraw;
delete wb.SSF;       // shared string formats - regen on write
delete wb.Custprops;
delete wb.SheetNames; // will be rebuilt
wb.SheetNames = Object.keys(wb.Sheets);

// 3. 對每個 sheet 也清掉可能膨脹的部分
for (const name of wb.SheetNames) {
  const ws = wb.Sheets[name];
  delete ws['!margins'];
  delete ws['!autofilter'];
  // 保留 !ref / !cols / !rows / !merges (這些是 layout 必須的)
}

// 4. 寫出 (xlsx-js-style 預設會重建 theme 為標準小檔)
XLSX.writeFile(wb, TMP);

const newSize = fs.statSync(TMP).size;
console.log('重建檔案大小:', newSize, 'bytes');
console.log('縮減率:', ((1 - newSize / fs.statSync(FILE).size) * 100).toFixed(2) + '%');

if (newSize > 50 * 1024 * 1024) {
  console.error('❌ 還是太大！');
  process.exit(1);
}

// 5. 取代原檔案
fs.renameSync(TMP, FILE);
console.log('✅ 已取代原檔案');
