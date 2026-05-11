// 一次標記今天兩批共 16 條 UIUX 為「已修正」+ 處理日期 + 備註,並更新統計摘要
// 重點: 使用 { compression: true } 避免 xlsx-js-style 把 theme1.xml 養肥到 13MB

import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.resolve(__dirname, '..', 'docs', 'iFare_UI_UX_問題追蹤清單.xlsx');
const sheetName = 'UIUX問題追蹤清單';
const summarySheetName = '統計摘要';
const TODAY = '2026-05-11';

const UPDATES = [
  // ===== 第一批 (commit caa871b + 1fb2b9b → push 378c508) =====
  { id: 15,  note: '首頁陰影文字 opacity .05 → .10 (_font.scss)' },
  { id: 36,  note: '公益夥伴 URL 改顯示「前往官網」+ aria-label + rel="noopener noreferrer"' },
  { id: 41,  note: '麵包屑 a11y — 新填 CompBreadCrumb.vue 元件,集中 about/collaborator 兩頁 inline 版,加 nav aria-label="breadcrumb" + aria-current="page"' },
  { id: 48,  note: 'AppHeader 手機 active 樣式統一為桌面 4px 橙色底線(移除 Title-Pattern.png 圖紋)' },
  { id: 50,  note: 'CompPage.PageNext 雙 forEach 合併。原 xlsx 描述的 console.log("ssssss") 已不存在' },
  { id: 58,  note: 'CompSelect 手機 else-mode 高度 69dvh → 68dvh 統一 (Recipient 40dvh 保留為少項目例外)' },
  { id: 61,  note: '連結 hover 左滑動畫底線 — a:not(.btn):not(.item-page-link):not(.card-page-link):not(.mobileNav-link),麵包屑排除' },
  { id: 71,  note: '觸控目標符合 WCAG 44x44 — pages-list li (20→44), btn-reset (32→44), component-select (max-height 40 → min-height 44)' },
  // ===== 第二批 (commit a7fbf5d) =====
  { id: 1,   note: 'i-Fare 篩選按鈕下方顯示「請至少填一個篩選條件」(hasAttemptedSearch + canSearch 條件渲染)' },
  { id: 7,   note: '刪 dead code QUALIFICATION_PREVIEW_LENGTH 與 slice(0,50);qualification 欄位原本未在 template 渲染' },
  { id: 9,   note: 'i-Fare 結果數量 font-size 14→24, weight 400→700, line-height 20→32 (::before/::after 維持 14px regular)' },
  { id: 28,  note: '福利專欄文章卡片 .item-info 加 font-size 14px + line-height 22px + opacity 0.55' },
  { id: 30,  note: '福利專欄篩選 watch + debounce 300ms 自動觸發 FilterWelfare(),跟懶人包一致' },
  { id: 38,  note: '公益夥伴 LoadCollaborators 函式化 + isLoading/hasError state + skeleton 3 卡 + 重新載入按鈕' },
  { id: 60,  note: '.btn 加 .hover-lift 套用範圍 (排除 .btn-tag/.btn-reset/.btn-clear-*/.btn-search 等小按鈕)' },
  { id: 113, note: 'i-Fare 清空按鈕 .btn-clear-query :active 加 360° 旋轉動畫 (keyframes @ _animation.scss)' },
];

const wb = XLSX.readFile(file, { cellStyles: true });
const ws = wb.Sheets[sheetName];
if (!ws) throw new Error(`Worksheet not found: ${sheetName}`);

const range = XLSX.utils.decode_range(ws['!ref']);
const cell = (r, c) => XLSX.utils.encode_cell({ r, c });

const updated = [];
const notFound = [];

for (const u of UPDATES) {
  let found = false;
  for (let r = 2; r <= range.e.r; r += 1) {
    if (Number(ws[cell(r, 0)]?.v) !== u.id) continue;
    ws[cell(r, 13)] = { ...(ws[cell(r, 13)] || {}), v: '已修正', t: 's' };
    ws[cell(r, 14)] = { ...(ws[cell(r, 14)] || {}), v: TODAY, t: 's' };
    ws[cell(r, 15)] = { ...(ws[cell(r, 15)] || {}), v: u.note, t: 's' };
    updated.push(u.id);
    found = true;
    break;
  }
  if (!found) notFound.push(u.id);
}

// 重算統計摘要
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }).slice(2).filter((row) => row[0]);
const counts = {
  total: rows.length,
  fixed: rows.filter((row) => row[13] === '已修正').length,
  partial: rows.filter((row) => row[13] === '部分修正').length,
  pending: rows.filter((row) => row[13] === '待處理').length,
};

const summary = wb.Sheets[summarySheetName];
if (summary) {
  summary['B3'] = { ...(summary['B3'] || {}), v: counts.total, t: 'n' };
  summary['C3'] = { ...(summary['C3'] || {}), v: counts.fixed, t: 'n' };
  summary['D3'] = { ...(summary['D3'] || {}), v: counts.partial, t: 'n' };
  summary['E3'] = { ...(summary['E3'] || {}), v: counts.pending, t: 'n' };
  summary['F3'] = { ...(summary['F3'] || {}), v: `${((counts.fixed / counts.total) * 100).toFixed(1)}%`, t: 's' };
  summary['G3'] = { ...(summary['G3'] || {}), v: `${TODAY} 完成 Round 14 第一+第二批共 ${updated.length} 條 UIUX 優化`, t: 's' };
}

// CRITICAL: compression: true 防止 theme1.xml 把檔案養肥到 13MB
XLSX.writeFile(wb, file, { compression: true });

console.log(`Updated ${updated.length} rows:`, updated);
if (notFound.length) console.warn('NOT FOUND:', notFound);
console.log('Final counts:', counts);
