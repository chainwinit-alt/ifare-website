// 2026-05-05 — 新增使用者需求：公益夥伴頁新增搜尋功能 (#133)
// 例：查「婦女」應顯示所有婦女團體
// Run: node scripts/add-uiux-133-collaborator-search.mjs

import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(__dirname, '..', 'docs', 'iFare_UI_UX_問題追蹤清單.xlsx');

const wb = XLSX.readFile(FILE, { cellStyles: true });
const ws = wb.Sheets['UIUX問題追蹤清單'];
const range = XLSX.utils.decode_range(ws['!ref']);

const nextRow = range.e.r + 1;
const newId = 133;

// 欄位 (0-indexed):
// 0=編號 1=驗證 2=區塊 3=子區塊 4=類型 5=分類 6=優先級 7=問題標題 8=問題描述
// 9=建議做法 10=相關檔案 11=需修改檔案 12=驗證備註 13=狀態 14=處理日期 15=備註
const cells = [
  { c: 0,  v: newId, t: 'n' },
  { c: 1,  v: 'V', t: 's' },
  { c: 2,  v: '公益夥伴', t: 's' },
  { c: 3,  v: '搜尋功能', t: 's' },
  { c: 4,  v: '提升', t: 's' },
  { c: 5,  v: '互動', t: 's' },
  { c: 6,  v: '中', t: 's' },
  { c: 7,  v: '公益夥伴頁新增搜尋功能 — 依關鍵字找相關團體（例：查「婦女」顯示所有婦女團體）', t: 's' },
  { c: 8,  v: '/collaborator 頁面目前只顯示所有公益夥伴清單（一頁分頁 10 筆），使用者要找特定類型團體只能逐筆翻找。例如想找「婦女團體」、「兒少團體」、「身心障礙團體」等只能靠肉眼掃描。需加入搜尋輸入框支援關鍵字過濾，並能顯示符合筆數。', t: 's' },
  { c: 9,  v: '前端 (pages/collaborator.vue)：(1) 在 .part-top 區塊下加 <input type="search" v-model="searchQuery" placeholder="搜尋團體名稱或服務項目..."> + 清空按鈕；(2) 用 computed 產生 filteredList = collaboratorList.filter(c => c.title.includes(query) || c.serviceItem.includes(query))，搭配 .toLowerCase() 不分大小寫；(3) v-for 改用 filteredList；(4) 結果計數提示「共 N 個團體符合『XXX』」；(5) 無結果空狀態（建議用 ic-search 圖示 + 「找不到符合『XXX』的公益夥伴」+ 「清空搜尋」CTA）；(6) 搜尋輸入加 debounce 300ms 避免每按一字就重新計算；(7) 與 §132 福利政策搜尋方向一致，可考慮 phase 2 改後端 API filter。後端可選 (CollaboratorAppService.cs)：GetCollaboratorList 加 SearchKeyword 參數 (string?)，後端做 LIKE 搜尋，欄位涵蓋 Title + ServiceItem。短期先做前端 filter (資料量小)，未來資料量大時再走後端。', t: 's' },
  { c: 10, v: 'pages/collaborator.vue + Backend CollaboratorAppService.cs', t: 's' },
  { c: 11, v: 'iFare_Frontend/pages/collaborator.vue (主要)；可選 backend: Dev/Dev Code/iFare_Frontend_API/src/IFare_API.Application/Collaborator/CollaboratorAppService.cs + ICollaboratorAppService.cs + Dto/CollaboratorFilterParamDto.cs (新增)', t: 's' },
  { c: 12, v: '使用者明確要求 2026-05-05：「公益夥伴那頁，增加搜尋功能可以知道相關的公益團體，比如查婦女團體，所有的婦女團體都會出現」。實際資料量小可先做純前端 filter (見 GetCollaboratorList 目前回全部)。', t: 's' },
  { c: 13, v: '待處理', t: 's' },
  { c: 14, v: '', t: 's' },
  { c: 15, v: '使用者口述新增需求 (2026-05-05)。第一版建議純前端 filter (15 分鐘)；第二版補後端 API SearchKeyword 參數 + 模糊搜尋 (參考 FarePolicy BM25 模式)；第三版可加分類標籤 (婦女 / 兒少 / 長者 / 身心障礙 / ...) 快速篩選按鈕。', t: 's' },
];

for (const { c, v, t } of cells) {
  ws[XLSX.utils.encode_cell({ r: nextRow, c })] = { t, v };
}

ws['!ref'] = XLSX.utils.encode_range({
  s: range.s,
  e: { r: nextRow, c: Math.max(range.e.c, 15) },
});

XLSX.writeFile(wb, FILE);
console.log(`✅ UIUX問題追蹤清單 sheet 新增 #${newId} 公益夥伴搜尋功能 (row ${nextRow + 1})`);
console.log('   區塊: 公益夥伴 / 子區塊: 搜尋功能 / 類型: 提升 / 優先級: 中');
console.log('   狀態: 待處理');
