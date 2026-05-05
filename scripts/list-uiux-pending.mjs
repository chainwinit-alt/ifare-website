// 一次性：列出 UIUX 待處理項目分類統計 + 詳細清單
import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(__dirname, '..', 'docs', 'iFare_UI_UX_問題追蹤清單.xlsx');

const wb = XLSX.readFile(FILE, { cellStyles: false });
const ws = wb.Sheets['UIUX問題追蹤清單'];
const range = XLSX.utils.decode_range(ws['!ref']);

// 欄位 (0-indexed):
// 0=編號 1=驗證 2=區塊 3=子區塊 4=類型 5=分類 6=優先級 7=問題標題 8=問題描述
// 9=建議做法 10=相關檔案 11=需修改檔案 12=驗證備註 13=狀態 14=處理日期 15=備註

const COL = { id: 0, area: 2, sub: 3, type: 4, cat: 5, pri: 6, title: 7, desc: 8, suggest: 9, files: 11, status: 13 };

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
      files: String(get(COL.files)).slice(0, 50),
    });
  }
}

console.log(`總計 待處理: ${pending.length} 項\n`);

// By priority
console.log('=== 按優先級分組 ===');
const byPri = {};
pending.forEach(p => { byPri[p.pri] = (byPri[p.pri] || []).concat([p]); });
['高', '中', '低'].forEach(pri => {
  if (byPri[pri]) console.log(`  ${pri}: ${byPri[pri].length} 項`);
});

// By category
console.log('\n=== 按分類分組 ===');
const byCat = {};
pending.forEach(p => { byCat[p.cat] = (byCat[p.cat] || 0) + 1; });
Object.entries(byCat).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log(`  ${k}: ${v} 項`));

// By area
console.log('\n=== 按區塊分組 ===');
const byArea = {};
pending.forEach(p => { byArea[p.area] = (byArea[p.area] || 0) + 1; });
Object.entries(byArea).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log(`  ${k}: ${v} 項`));

// 高優先級全列
console.log('\n=== 高優先級全部待處理 ===');
const high = pending.filter(p => p.pri === '高');
high.forEach(p => {
  console.log(`#${p.id} [${p.cat}] ${p.area}/${p.sub} — ${p.title}`);
});

// 中優先級全列 (簡略)
console.log(`\n=== 中優先級 (${(byPri['中']||[]).length} 項，僅標題) ===`);
(byPri['中'] || []).forEach(p => {
  console.log(`#${p.id} [${p.cat}] ${p.title}`);
});

// 低優先級簡列
console.log(`\n=== 低優先級 (${(byPri['低']||[]).length} 項，僅標題) ===`);
(byPri['低'] || []).forEach(p => {
  console.log(`#${p.id} [${p.cat}] ${p.title}`);
});
