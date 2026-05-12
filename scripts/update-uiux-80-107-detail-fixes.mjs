import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx-js-style';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.resolve(__dirname, '..', 'docs');
const workbookFileName = fs.readdirSync(docsDir).find((name) => name.endsWith('.xlsx'));

if (!workbookFileName) {
  throw new Error('UI/UX tracking workbook not found.');
}

const file = path.join(docsDir, workbookFileName);
const today = '2026-05-12';
const wb = XLSX.readFile(file, { cellStyles: true });
const sheetName = wb.SheetNames.find((name) => name.includes('UIUX')) || wb.SheetNames[2];
const ws = wb.Sheets[sheetName];
const summarySheetName = wb.SheetNames[wb.SheetNames.length - 1];
const summary = wb.Sheets[summarySheetName];

if (!ws) {
  throw new Error('Tracking worksheet not found.');
}

const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
const dataRows = rows.slice(2).filter((row) => row[0]);
const rowById = new Map(dataRows.map((row, index) => [Number(row[0]), index + 3]));
const cell = (r, c) => XLSX.utils.encode_cell({ r, c });

function updateRow(id, updates) {
  const rowNumber = rowById.get(id);
  if (!rowNumber) {
    throw new Error(`Row not found for issue #${id}.`);
  }

  for (const [col, value] of Object.entries(updates)) {
    const addr = cell(rowNumber - 1, Number(col));
    ws[addr] = {
      ...(ws[addr] || {}),
      v: value,
      t: typeof value === 'number' ? 'n' : 's',
    };
  }
}

updateRow(80, {
  12: '已補上 detailed API helper 與頁面錯誤訊息，載入失敗可區分 timeout / network / server / client 類型並提供 retry。',
  13: '已修正',
  14: today,
  15: 'news.vue / collaborator.vue / articles.vue / ifare.vue / ifare result 已改用 WebApiGetDetailed，錯誤提示可顯示更明確原因與重試按鈕。',
});

updateRow(107, {
  12: '已補上 WebApiGetDetailed / WebApiPostDetailed，保留原有 null 相容性，同時讓頁面可取得結構化錯誤資訊。',
  13: '部分修正',
  14: today,
  15: 'WebAPI.ts 新增 requestWithDetail，共用 timeout / error 分類；news / collaborator / ifare result 改用詳細結果顯示錯誤。',
});

if (summary) {
  summary.B3 = { ...(summary.B3 || {}), v: 163, t: 'n' };
  summary.C3 = { ...(summary.C3 || {}), v: 100, t: 'n' };
  summary.D3 = { ...(summary.D3 || {}), v: 8, t: 'n' };
  summary.E3 = { ...(summary.E3 || {}), v: 55, t: 'n' };
  summary.F3 = { ...(summary.F3 || {}), v: '61.3%', t: 's' };
  summary.G3 = {
    ...(summary.G3 || {}),
    v: '補上 WebAPI 詳細錯誤回傳與頁面級錯誤提示，news / collaborator / articles / iFare / iFare result 可顯示更明確的失敗原因與 retry。',
    t: 's',
  };
}

XLSX.writeFile(wb, file, { compression: true });
console.log(`Updated ${workbookFileName} rows #80 and #107.`);
