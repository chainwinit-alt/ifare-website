// 檢查追蹤 Excel 中所有「已修正 / 部分修正」項目是否都有填處理日期。
// 範圍：UIUX問題追蹤清單 / 後臺優化 / PoC研究
// Run: node scripts/verify-tracking-status-dates.mjs

import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(__dirname, '..', 'docs', 'iFare_UI_UX_問題追蹤清單.xlsx');
const SHEETS = ['UIUX問題追蹤清單', '後臺優化', 'PoC研究'];

const wb = XLSX.readFile(FILE, { cellStyles: true });

let totalChecked = 0;
let totalIssues = 0;

for (const sheetName of SHEETS) {
  const ws = wb.Sheets[sheetName];
  if (!ws) continue;

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  const issues = [];
  let checked = 0;

  for (let r = 2; r <= range.e.r; r++) {
    const id = ws[XLSX.utils.encode_cell({ r, c: 0 })]?.v ?? '';
    const title = ws[XLSX.utils.encode_cell({ r, c: 7 })]?.v ?? '';
    const status = ws[XLSX.utils.encode_cell({ r, c: 13 })]?.v ?? '';
    const date = ws[XLSX.utils.encode_cell({ r, c: 14 })]?.v ?? '';

    if (status !== '已修正' && status !== '部分修正') {
      continue;
    }

    checked++;
    const hasDate = String(date).trim().length > 0;
    if (!hasDate) {
      issues.push({
        row: r + 1,
        id,
        status,
        title: String(title).slice(0, 40),
      });
    }
  }

  totalChecked += checked;
  totalIssues += issues.length;

  console.log(`\n=== ${sheetName} ===`);
  console.log(`需檢查: ${checked}`);

  if (issues.length === 0) {
    console.log('✅ 已修正 / 部分修正 項目都有處理日期');
    continue;
  }

  console.log(`⚠️ 缺日期: ${issues.length}`);
  for (const issue of issues) {
    console.log(`  R${issue.row} #${issue.id} (${issue.status}) - ${issue.title}`);
  }
}

console.log('\n=== 總結 ===');
console.log(`總檢查項目: ${totalChecked}`);
if (totalIssues === 0) {
  console.log('✅ 全部追蹤 sheet 都符合日期規則');
} else {
  console.log(`⚠️ 共 ${totalIssues} 筆缺少處理日期`);
  process.exitCode = 1;
}
