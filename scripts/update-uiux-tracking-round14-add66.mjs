// Round 14 followup — append #66「自動內鏈建議」到後臺優化 sheet
//   來源：2026-05-18 後台內容治理規劃 doc (iFare_後台內容治理規劃_2026-05-18.md) 第 7 項
//   原因：9 項治理規劃中唯一 xlsx 沒對應條目的功能，本次補入
// Run: node scripts/update-uiux-tracking-round14-add66.mjs

import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(__dirname, '..', 'docs', 'iFare_UI_UX_問題追蹤清單.xlsx');

const wb = XLSX.readFile(FILE, { cellStyles: true });
const ws = wb.Sheets['後臺優化'];

// 防呆：先檢查 #66 不存在（避免重複跑造成重複條目）
const range = XLSX.utils.decode_range(ws['!ref']);
for (let r = 2; r <= range.e.r; r++) {
  const cell = ws[XLSX.utils.encode_cell({ r, c: 0 })];
  if (cell?.v === 66) {
    console.log('⚠️  #66 已存在於 row', r + 1, '— 跳過 append，避免重複');
    process.exit(0);
  }
}

const entry = {
  no: 66,
  cells: [
    66, 'V', '內容管理', '自動內鏈建議', '提升', '互動', '中',
    '上稿時無自動內鏈建議 — 編輯需自行記憶並手動找站內連結',
    '寫新文章 / 政策時，若提到「老人福利」「身心障礙」等已存在於站內的關鍵字，編輯者要自己記得 + 手動搜尋對應政策 / FAQ / 文章頁，並手動建立超連結；導致站內導流弱、內容彼此孤立、SEO 內部連結結構鬆散',
    '第一版（PoC）：純前端關鍵字字典比對 — 從現有政策 title / FAQ keyword / 文章標籤建字典，編輯時偵測內文出現的關鍵字，suggest 可加超連結的位置，編輯者點建議即一鍵加 hyperlink。進階：BM25 / TF-IDF 語意比對（後端）或 Gemini API 自動產建議',
    '前端 RichTextEditor 元件 + 後端 keyword 字典 API',
    'Dev/Dev Code/iFare_Backend/src/components/HtmlEditor.vue (新增建議面板) + 新建 src/services/internalLinkSuggest.ts',
    '由 2026-05-18 後台內容治理規劃 doc (iFare_後台內容治理規劃_2026-05-18.md) 第 7 項提出；9 項中唯一 xlsx 原無對應條目',
    '待處理', '',
    '建議先做 2 day PoC 驗證價值 — 純前端關鍵字字典即可，無需後端配合；若反應好再加語意比對 / LLM 升級',
  ],
};

const nextRow = range.e.r + 1;
for (let c = 0; c < entry.cells.length; c++) {
  const v = entry.cells[c];
  const t = typeof v === 'number' ? 'n' : 's';
  ws[XLSX.utils.encode_cell({ r: nextRow, c })] = { t, v };
}

ws['!ref'] = XLSX.utils.encode_range({
  s: range.s,
  e: { r: nextRow, c: Math.max(range.e.c, 15) },
});

XLSX.writeFile(wb, FILE);

console.log(`✅ 後臺優化 sheet append #66 完成 (row ${nextRow + 1})`);
console.log('提醒：跑 node scripts/compact-xlsx-theme.mjs 壓掉 theme1.xml 膨脹');
