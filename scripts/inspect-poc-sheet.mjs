// 看 PoC 研究分頁的全部 row，找跟 PageManagement 有關的研究
import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(__dirname, '..', 'docs', 'iFare_UI_UX_問題追蹤清單.xlsx');

const wb = XLSX.readFile(FILE, { cellStyles: false });
const ws = wb.Sheets['PoC研究'];
if (!ws?.['!ref']) { console.log('no sheet'); process.exit(0); }
const range = XLSX.utils.decode_range(ws['!ref']);

// 印標題列
const headers = [];
for (let c = 0; c <= range.e.c; c++) {
  headers.push(ws[XLSX.utils.encode_cell({ r: 1, c })]?.v ?? `col${c}`);
}
console.log('Headers:', headers.join(' | '));
console.log('');

for (let r = 2; r <= range.e.r; r++) {
  const row = {};
  let any = false;
  for (let c = 0; c <= range.e.c; c++) {
    const v = ws[XLSX.utils.encode_cell({ r, c })]?.v ?? '';
    row[headers[c]] = v;
    if (v) any = true;
  }
  if (!any) continue;
  console.log(`Row ${r+1}:`);
  Object.entries(row).forEach(([k, v]) => {
    if (v) console.log(`  ${k}: ${String(v).slice(0, 200)}`);
  });
  console.log('');
}
