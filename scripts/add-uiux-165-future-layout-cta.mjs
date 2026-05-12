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
const TARGET_ID = 165;
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
  '空狀態版面 / CTA',
  '提升',
  '體驗',
  '中',
  'future 頁空狀態內容過於單薄，需補替代行動並收斂與 footer CTA 的銜接',
  '原本頁面僅有 Coming Soon 與一句說明，手機版上方留白偏多，說明文字行寬也較鬆，與下方 footer CTA 之間的銜接略顯突然。',
  '收斂 breadcrumb 與主視覺間距、縮短說明文字寬度，並新增兩個替代行動入口，引導使用者先看最新消息或認識基金會，讓空頁也有下一步。',
  'pages/future.vue',
  'Dev/Dev Code/iFare_Frontend/pages/future.vue',
  '同日另有 #164 處理主標兩行換行；這筆專門記錄版面節奏、替代行動與 footer 銜接優化。',
  '已修正',
  TODAY,
  '2026-05-12：future.vue 收斂上方留白與底部間距、縮短說明文字寬度，新增「查看最新消息 / 認識基金會」替代行動卡，讓空狀態頁與 footer CTA 的銜接更自然。',
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
