// 一次性：列出 後臺優化 sheet 待處理項目（按優先級 + 分類分組）
import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(__dirname, '..', 'docs', 'iFare_UI_UX_問題追蹤清單.xlsx');

const wb = XLSX.readFile(FILE, { cellStyles: false });
const ws = wb.Sheets['後臺優化'];
const range = XLSX.utils.decode_range(ws['!ref']);

const COL = { id: 0, area: 2, sub: 3, type: 4, cat: 5, pri: 6, title: 7, status: 13 };

const pending = [];
for (let r = 2; r <= range.e.r; r++) {
  const get = (c) => ws[XLSX.utils.encode_cell({ r, c })]?.v ?? '';
  if (get(COL.status) === '待處理') {
    pending.push({
      id: get(COL.id),
      area: get(COL.area),
      sub: get(COL.sub),
      type: get(COL.type),
      cat: get(COL.cat),
      pri: get(COL.pri),
      title: String(get(COL.title)).slice(0, 60),
    });
  }
}

console.log(`後臺優化 待處理: ${pending.length} 項\n`);

// By priority
console.log('=== 按優先級分組 ===');
const byPri = {};
pending.forEach(p => { byPri[p.pri] = (byPri[p.pri] || []).concat([p]); });
['高', '中', '低'].forEach(pri => {
  if (byPri[pri]) console.log(`  ${pri}: ${byPri[pri].length} 項`);
});

// By area
console.log('\n=== 按區塊分組 ===');
const byArea = {};
pending.forEach(p => { byArea[p.area] = (byArea[p.area] || 0) + 1; });
Object.entries(byArea).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log(`  ${k}: ${v} 項`));

// 高優先級全列
console.log('\n=== 🔴 高優先級全部待處理 ===');
const high = pending.filter(p => p.pri === '高');
high.forEach(p => {
  console.log(`#${p.id} [${p.cat}] ${p.area}/${p.sub} — ${p.title}`);
});

// 中優先級全列
console.log(`\n=== 🟡 中優先級 (${(byPri['中']||[]).length} 項) ===`);
(byPri['中'] || []).forEach(p => {
  console.log(`#${p.id} [${p.cat}] ${p.area}/${p.sub} — ${p.title}`);
});

// 低優先級簡列
console.log(`\n=== 🟢 低優先級 (${(byPri['低']||[]).length} 項) ===`);
(byPri['低'] || []).forEach(p => {
  console.log(`#${p.id} [${p.cat}] ${p.title}`);
});
