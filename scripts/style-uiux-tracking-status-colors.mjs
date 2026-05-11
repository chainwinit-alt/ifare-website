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
const wb = XLSX.readFile(file, { cellStyles: true });
const trackingSheetName = wb.SheetNames.find((name) => name.includes('UIUX')) || wb.SheetNames[2];
const ws = wb.Sheets[trackingSheetName];

if (!ws) {
  throw new Error('Tracking worksheet not found.');
}

const range = XLSX.utils.decode_range(ws['!ref']);
const cell = (r, c) => XLSX.utils.encode_cell({ r, c });
const allCols = Array.from({ length: 16 }, (_, index) => index);

const palettes = {
  '已修正': {
    rowFill: 'EAF7EA',
    statusFill: 'CFECCF',
    fontColor: '2F5D34',
  },
  '部分修正': {
    rowFill: 'FFF7DB',
    statusFill: 'FFE7A3',
    fontColor: '7A5A00',
  },
  '未修正': {
    rowFill: 'FFF0F0',
    statusFill: 'F6CCCC',
    fontColor: '7A2E2E',
  },
  '待處理': {
    rowFill: 'FFF0F0',
    statusFill: 'F6CCCC',
    fontColor: '7A2E2E',
  },
};

const ensureCell = (r, c) => {
  const addr = cell(r, c);
  if (!ws[addr]) {
    ws[addr] = { t: 's', v: '' };
  }
  return addr;
};

const applyStyle = (addr, fillRgb, fontColor, bold = false) => {
  ws[addr].s = {
    ...(ws[addr].s || {}),
    fill: {
      patternType: 'solid',
      fgColor: { rgb: fillRgb },
    },
    font: {
      ...(ws[addr].s?.font || {}),
      color: { rgb: fontColor },
      bold,
    },
    alignment: {
      ...(ws[addr].s?.alignment || {}),
      vertical: 'center',
      wrapText: true,
    },
  };
};

for (let r = 2; r <= range.e.r; r += 1) {
  const status = String(ws[cell(r, 13)]?.v || '').trim();
  const palette = palettes[status];

  if (!palette) continue;

  for (const c of allCols) {
    const addr = ensureCell(r, c);
    const isStatusCol = c === 13;
    applyStyle(addr, isStatusCol ? palette.statusFill : palette.rowFill, palette.fontColor, isStatusCol);
  }
}

XLSX.writeFile(wb, file, { compression: true });

console.log(`Styled ${trackingSheetName} in ${workbookFileName}`);
