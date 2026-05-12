import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx-js-style';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.resolve(__dirname, '..', 'docs');
const workbookName = fs.readdirSync(docsDir).find((name) => (
  name.startsWith('iFare_UI_UX_') && name.endsWith('.xlsx')
));

if (!workbookName) {
  throw new Error('Cannot find iFare_UI_UX workbook in docs/');
}

const filePath = path.join(docsDir, workbookName);
const TODAY = '2026-05-12';
const TARGET_ID = 164;
const FILL_FIXED = { patternType: 'solid', fgColor: { rgb: 'C6EFCE' } };
const FONT_FIXED = { color: { rgb: '006100' } };

const wb = XLSX.readFile(filePath, { cellStyles: true });
const sheetName = wb.SheetNames.find((name) => name.startsWith('UIUX'));

if (!sheetName) {
  throw new Error('Cannot find UIUX sheet in workbook');
}

const ws = wb.Sheets[sheetName];
const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

function columnLetters(count) {
  return Array.from({ length: count }, (_, index) => {
    let n = index;
    let result = '';
    do {
      result = String.fromCharCode(65 + (n % 26)) + result;
      n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    return result;
  });
}

function setCell(rowIndex, colIndex, value) {
  ws[XLSX.utils.encode_cell({ r: rowIndex, c: colIndex })] = {
    t: typeof value === 'number' ? 'n' : 's',
    v: value,
  };
}

function paintRow(excelRowNumber, cols) {
  for (const col of cols) {
    const addr = `${col}${excelRowNumber}`;
    if (!ws[addr]) ws[addr] = { t: 's', v: '' };
    ws[addr].s = {
      ...(ws[addr].s || {}),
      fill: FILL_FIXED,
      font: FONT_FIXED,
      alignment: { vertical: 'center', wrapText: true },
    };
  }
}

const rowValues = [
  TARGET_ID,
  'V',
  '未來規劃',
  'Hero 標題 / RWD',
  '提升',
  'RWD',
  '中',
  'future 頁手機版主標題應避免孤字掉行，改為兩行平衡換行',
  '目前主標在窄螢幕下容易出現最後單字單獨落在第二行，視覺重心不穩，也會讓標題看起來像被擠斷。',
  '主標改為桌機維持單行節奏、手機版明確切成兩行，搭配較平衡的 clamp 字級、line-height 與 max-width，避免「中」單獨掉行。',
  'pages/future.vue',
  'Dev/Dev Code/iFare_Frontend/pages/future.vue',
  '依使用者確認，這次先處理 future 頁主標在手機版的換行與可讀性。',
  '已修正',
  TODAY,
  '2026-05-12：future.vue 主標改為桌機同列、手機兩行平衡換行，明確拆成「未來規劃頁面 / 建置中」，並調整 clamp 字級、line-height 與 max-width。',
];

let targetRowIndex = -1;
for (let rowIndex = 1; rowIndex <= range.e.r; rowIndex++) {
  const id = ws[XLSX.utils.encode_cell({ r: rowIndex, c: 0 })]?.v;
  if (Number(id) === TARGET_ID) {
    targetRowIndex = rowIndex;
    break;
  }
}

if (targetRowIndex < 0) {
  targetRowIndex = range.e.r + 1;
}

rowValues.forEach((value, colIndex) => setCell(targetRowIndex, colIndex, value));

const nextRange = {
  s: { r: range.s.r, c: range.s.c },
  e: {
    r: Math.max(range.e.r, targetRowIndex),
    c: Math.max(range.e.c, rowValues.length - 1),
  },
};
ws['!ref'] = XLSX.utils.encode_range(nextRange);

paintRow(targetRowIndex + 1, columnLetters(nextRange.e.c + 1));

XLSX.writeFile(wb, filePath);
console.log(`Updated ${sheetName} #${TARGET_ID} at row ${targetRowIndex + 1}`);
