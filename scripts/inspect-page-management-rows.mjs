// 一次性：從 xlsx 抽出所有與「新增頁面 / PageManagement / PageBuilder / 後台頁面」有關的 row
// 給 Emma 5/25 對話用，掃完即可刪
import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(__dirname, '..', 'docs', 'iFare_問題追蹤與AI維運規劃.xlsx');

const wb = XLSX.readFile(FILE, { cellStyles: false });

console.log('=== 全部分頁 ===');
wb.SheetNames.forEach((n, i) => console.log(`${i}: ${n}`));
console.log('');

const KEY_RE = /(新增頁面|PageManagement|PageBuilder|頁面管理|動態頁|CMS|page builder)/i;

for (const sheetName of wb.SheetNames) {
  const ws = wb.Sheets[sheetName];
  if (!ws['!ref']) continue;
  const range = XLSX.utils.decode_range(ws['!ref']);

  // 找標題列（第 1 列或第 2 列）
  const headerRowIdx = 1;  // 通常第 2 列是標題（第 1 列可能是表頭說明）
  const headers = [];
  for (let c = 0; c <= range.e.c; c++) {
    headers.push(ws[XLSX.utils.encode_cell({ r: headerRowIdx, c })]?.v ?? '');
  }

  const hits = [];
  for (let r = 2; r <= range.e.r; r++) {
    const row = {};
    let joined = '';
    for (let c = 0; c <= range.e.c; c++) {
      const v = ws[XLSX.utils.encode_cell({ r, c })]?.v ?? '';
      row[headers[c] || `col${c}`] = v;
      joined += ' ' + String(v);
    }
    if (KEY_RE.test(joined)) hits.push({ row: r + 1, ...row });
  }

  if (hits.length) {
    console.log(`### [${sheetName}] 命中 ${hits.length} 列`);
    hits.forEach((h) => {
      const id = h['編號'] || h.col0 || '';
      const status = h['狀態'] || h.col13 || '';
      const pri = h['優先級'] || h.col6 || '';
      const area = h['區塊'] || h.col2 || '';
      const sub = h['子區塊'] || h.col3 || '';
      const cat = h['分類'] || h.col5 || '';
      const title = h['問題標題'] || h.col7 || '';
      const desc = h['問題描述'] || h.col8 || '';
      const suggest = h['建議做法'] || h.col9 || '';
      const files = h['需修改檔案'] || h.col11 || '';
      console.log(`  #${id} [${status}] [${pri}] [${cat}] ${area}/${sub}`);
      console.log(`    題：${String(title).slice(0, 100)}`);
      if (desc) console.log(`    描：${String(desc).slice(0, 150)}`);
      if (suggest) console.log(`    議：${String(suggest).slice(0, 150)}`);
      if (files) console.log(`    檔：${String(files).slice(0, 120)}`);
      console.log('');
    });
  }
}
