import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.resolve(__dirname, '..', 'docs', 'iFare_UI_UX_問題追蹤清單.xlsx');

const wb = XLSX.readFile(file, { cellStyles: false });
const ws = wb.Sheets['UIUX問題追蹤清單'];
if (!ws) {
  console.error('Worksheet UIUX問題追蹤清單 not found. Sheets:', Object.keys(wb.Sheets));
  process.exit(1);
}

const all = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

console.log('=== ROW 0 (header) ===');
for (let i = 0; i < all[0].length; i += 1) {
  console.log(`  col ${i}: ${all[0][i]}`);
}
console.log();
console.log('=== ROW 1 ===');
for (let i = 0; i < all[1].length; i += 1) {
  console.log(`  col ${i}: ${all[1][i]}`);
}
console.log();

const data = all.slice(2).filter((row) => row[0]);
console.log(`Total data rows: ${data.length}`);

const counts = {};
for (const row of data) {
  const status = String(row[13] || '').trim() || '(空白)';
  counts[status] = (counts[status] || 0) + 1;
}
console.log();
console.log('=== Status counts (col 13) ===');
for (const [s, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${s}: ${n}`);
}
console.log();

const pending = data.filter((row) => {
  const status = String(row[13] || '').trim();
  return status !== '已修正';
});

console.log(`=== ${pending.length} non-已修正 items ===`);
for (const row of pending) {
  const id = row[0];
  const status = row[13] || '(空白)';
  const summary = row
    .slice(1, 13)
    .map((c) => String(c ?? '').replace(/\s+/g, ' ').trim())
    .filter((s) => s)
    .join(' | ');
  console.log(`#${id} [${status}]  ${summary}`);
}
