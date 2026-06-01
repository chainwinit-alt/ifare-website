import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx-js-style';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.resolve(__dirname, '..', 'docs');
const fileName = fs
  .readdirSync(docsDir)
  .find((name) => name.endsWith('.xlsx') && name.includes('UI_UX'));

if (!fileName) {
  throw new Error('Cannot find UI/UX tracking workbook under docs/.');
}

const file = path.join(docsDir, fileName);
const sheetName = 'UIUX問題追蹤清單';
const summarySheetName = '統計摘要';

const wb = XLSX.readFile(file, { cellStyles: true });
const ws = wb.Sheets[sheetName];

if (!ws) {
  throw new Error(`Worksheet not found: ${sheetName}`);
}

const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
const existingIds = new Set(rows.slice(2).map((row) => Number(row[0])).filter(Boolean));
const maxId = Math.max(0, ...existingIds);

const entries = [
  [
    167,
    'V',
    'i-Fare 福利查詢',
    '人生事件導覽',
    '提升',
    '導覽',
    '高',
    '福利查詢入口仍以政策分類為主，缺少人生事件導覽',
    '目前 /ifare 入口讓使用者選「受助者情況 / 政策分類」，但一般使用者更可能從生育、失業、照顧、長照、身障、就學等生活情境出發，容易不知道該選哪個分類。',
    '在搜尋表單前新增人生事件入口卡，點選後帶入 event/query/對應條件；第一版可用前端 mapping，後續建議後台維護「人生事件 ↔ 政策類別 / 關鍵字 / 身分」對照。',
    'pages/ifare.vue pages/ifare/result.vue',
    'Dev/Dev Code/iFare_Frontend/pages/ifare.vue\r\nDev/Dev Code/iFare_Frontend/pages/ifare/result.vue\r\nDev/Dev Code/iFare_Frontend/composables/useWelfareLifeEvents.ts',
    '已確認目前入口使用 GetCodePolicyList 產生受助情境下拉，尚無人生事件導覽層。',
    '待處理',
    '',
    '建議第一階段先支援「生育、失業、照顧、長照、身障、就學」六類，避免一次做成過度複雜的問卷。',
  ],
  [
    168,
    'V',
    'i-Fare 福利詳情',
    '申請路徑助手',
    '提升',
    '申請流程',
    '高',
    '政策詳情只呈現內容，缺少申請條件、文件、流程、窗口的路徑整理',
    '使用者看完福利政策後仍需自行從長文中理解是否符合、要準備哪些資料、要去哪裡辦與下一步流程，降低實際申請效率。',
    '在 /ifare/info 新增「申請路徑助手」區塊，整理成：是否符合、應備文件、申請流程、承辦窗口、聯絡方式；現有 Qualification / Evidence / WelfareInfo / OfficeUnitInfo / OfficeUnitTel 可先做 MVP。',
    'pages/ifare/info.vue pages/ifare/contact.vue',
    'Dev/Dev Code/iFare_Frontend/pages/ifare/info.vue\r\nDev/Dev Code/iFare_Frontend/pages/ifare/contact.vue',
    'API 詳情已回傳 Qualification、Evidence、WelfareInfo、OfficeUnitInfo、OfficeUnitTel，但前台目前多為原文呈現。',
    '待處理',
    '',
    '長期建議後台補結構化 applySteps / applyChannels，否則申請流程只能從文字推估。',
  ],
  [
    169,
    'V',
    'i-Fare 福利查詢',
    '收藏 / 比較',
    '提升',
    '互動',
    '中',
    '缺少收藏與比較功能，使用者難以整理多個福利方案差異',
    '搜尋結果可能出現多筆福利，使用者目前只能逐筆點進詳情，無法先收藏、暫存或比較條件、文件、窗口與截止日期。',
    '在結果卡與詳情頁加入「收藏」與「加入比較」；新增比較頁或抽屜，欄位包含政策名稱、地區、資格限制、文件、窗口、截止日。第一版用 localStorage，不依賴會員系統。',
    'pages/ifare/result.vue pages/ifare/info.vue',
    'Dev/Dev Code/iFare_Frontend/pages/ifare/result.vue\r\nDev/Dev Code/iFare_Frontend/pages/ifare/info.vue\r\nDev/Dev Code/iFare_Frontend/pages/ifare/compare.vue\r\nDev/Dev Code/iFare_Frontend/composables/useWelfareCollection.ts',
    '目前前台沒有 stores 目錄，也未發現收藏 / 比較狀態管理；適合用 composable + localStorage 先做。',
    '待處理',
    '',
    '若未來要跨裝置同步，需接會員或後台儲存；MVP 先以本機瀏覽器暫存即可。',
  ],
  [
    170,
    'V',
    'i-Fare 福利查詢',
    '個人條件暫存',
    '提升',
    '個人化',
    '中',
    '年齡、身分、地區、收入等條件無法暫存，下次需重新填寫',
    '使用者重新進入 i-Fare 或查詢結果頁時，需要再次選年齡區間、戶籍地、經濟條件與特殊身分，重複操作成本高。',
    '新增 useWelfareProfile composable，以 localStorage 保存非敏感條件；進入 /ifare 自動帶入預設值，並提供「清除我的條件」。保存期限建議 30-90 天。',
    'pages/ifare.vue pages/ifare/result.vue',
    'Dev/Dev Code/iFare_Frontend/pages/ifare.vue\r\nDev/Dev Code/iFare_Frontend/pages/ifare/result.vue\r\nDev/Dev Code/iFare_Frontend/composables/useWelfareProfile.ts',
    '目前搜尋條件主要存在頁面 ref / query，Search 後首頁表單會重置；沒有跨頁或下次進站暫存。',
    '待處理',
    '',
    '僅保存年齡區間、身分代碼、地區、收入級距等非敏感資料，不保存姓名、身分證字號或電話。',
  ],
  [
    171,
    'V',
    'i-Fare 福利政策',
    '申請期限提醒',
    '提升',
    '提醒',
    '中',
    '政策截止或活動快到期時，前台缺少即將截止提示與提醒入口',
    'API 已有 DiscontinuedTime，但結果卡與詳情頁未凸顯剩餘天數；使用者可能錯過快截止的政策或活動。',
    '在結果卡與詳情頁顯示「即將截止」badge（30/14/7 天）；詳情頁提供加入提醒或下載行事曆 .ics。跨裝置 Email/LINE 通知則列為後台通知服務。',
    'pages/ifare/result.vue pages/ifare/info.vue',
    'Dev/Dev Code/iFare_Frontend/pages/ifare/result.vue\r\nDev/Dev Code/iFare_Frontend/pages/ifare/info.vue\r\nDev/Dev Code/iFare_Frontend/composables/usePolicyDeadline.ts',
    'FarePolicy list/detail DTO 皆有 DiscontinuedTime，目前前台未完整轉成提醒型 UI。',
    '待處理',
    '',
    '需注意目前公開查詢只回傳尚未過期政策；提醒重點是「尚有效但即將到期」。',
  ],
  [
    172,
    'V',
    'i-Fare 福利詳情',
    '相關政策推薦',
    '提升',
    '推薦',
    '中',
    '相關政策已存在但說明不足，缺少推薦理由與補充方案導覽',
    '詳情頁已呼叫 GetIFarePolicyRelation，但目前只是列出相關福利，使用者不清楚為什麼推薦、差異在哪，也不容易繼續探索補充方案。',
    '優化相關政策區塊，顯示推薦理由（同地區 / 同年齡 / 同收入 / 同身分 / 同關鍵字），並可擴為 3-6 筆；同時加入「加入比較」入口。',
    'pages/ifare/info.vue',
    'Dev/Dev Code/iFare_Frontend/pages/ifare/info.vue',
    '已確認 /ifare/info 呼叫 GetIFarePolicyRelation；後端已有基本相近政策邏輯，但前台未呈現推薦理由。',
    '待處理',
    '',
    '若要精準顯示理由，前台需拿目前政策與推薦政策的 code list 做差異比對，或由後端回傳 relationReason。',
  ],
  [
    173,
    'V',
    'i-Fare 福利查詢',
    '查無結果 / 錯誤引導',
    '提升',
    '空狀態',
    '高',
    '條件不符合時只顯示查無結果，未告知差在哪裡',
    '目前結果頁空狀態會建議放寬篩選，但無法指出可能是地區、年齡、收入、身分或關鍵字造成查無結果，使用者不知道下一步該調整哪裡。',
    '查無結果時做漸進式放寬條件重查，產生「可能卡在戶籍地 / 收入 / 身分 / 關鍵字」提示；最佳做法是後台新增 mismatch reason API，由後端回傳不符合原因。',
    'pages/ifare/result.vue',
    'Dev/Dev Code/iFare_Frontend/pages/ifare/result.vue\r\nDev/Dev Code/iFare_Frontend/composables/useWelfareSearchDiagnosis.ts',
    '目前 result-empty 是泛用文案；Search 條件會組成 CodePolicy / CodeRecipient / CodeDomicile / CodeIncome / CodeIdentities / Query。',
    '待處理',
    '',
    '前台可先做推論版，但資格不符合原因屬高風險資訊，正式版建議由後端依政策條件計算。',
  ],
  [
    174,
    'V',
    'i-Fare 福利詳情',
    '文件清單產生器',
    '提升',
    '文件',
    '高',
    '應備文件仍是文字內容，缺少依條件產生的可勾選清單',
    '政策詳情已有 Evidence 欄位，但目前偏原文呈現，使用者無法快速得到「我需要準備哪些文件」的 checklist，也無法勾選準備進度。',
    '把 Evidence 轉成文件 checklist，支援勾選、列印與複製；第一版可用文字分段解析，長期建議後台改成結構化文件清單（文件名、是否必備、適用條件、備註）。',
    'pages/ifare/info.vue',
    'Dev/Dev Code/iFare_Frontend/pages/ifare/info.vue\r\nDev/Dev Code/iFare_Frontend/composables/useDocumentChecklist.ts',
    'API 詳情已回傳 Evidence；目前前台以 renderPlainText + v-html 呈現，尚未拆成 checklist。',
    '待處理',
    '',
    '可與 #168 申請路徑助手整合，同一頁提供條件、文件、流程、窗口四段式申請指引。',
  ],
];

const idsToAppend = entries.map((entry) => entry[0]);
const duplicateIds = idsToAppend.filter((id) => existingIds.has(id));
if (duplicateIds.length > 0) {
  throw new Error(`Duplicate issue ids: ${duplicateIds.join(', ')}`);
}

if (maxId >= entries[0][0]) {
  throw new Error(`Unexpected max id ${maxId}; refusing to append stale ids.`);
}

const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
const pendingTemplateRow = rows.findIndex((row, index) => index >= 2 && row[13] === '待處理');
const templateRowIndex = pendingTemplateRow >= 0 ? pendingTemplateRow : range.e.r;
const startRow = range.e.r + 1;

function cloneStyle(cell) {
  return cell?.s ? JSON.parse(JSON.stringify(cell.s)) : undefined;
}

entries.forEach((entry, rowOffset) => {
  const rowIndex = startRow + rowOffset;
  entry.forEach((value, columnIndex) => {
    const templateAddr = XLSX.utils.encode_cell({ r: templateRowIndex, c: columnIndex });
    const addr = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex });
    ws[addr] = {
      t: typeof value === 'number' ? 'n' : 's',
      v: value,
      s: cloneStyle(ws[templateAddr]),
    };
  });
});

ws['!ref'] = XLSX.utils.encode_range({
  s: range.s,
  e: {
    r: range.e.r + entries.length,
    c: Math.max(range.e.c, entries[0].length - 1),
  },
});

const updatedRows = XLSX.utils
  .sheet_to_json(ws, { header: 1, defval: '' })
  .slice(2)
  .filter((row) => row[0]);

const counts = {
  total: updatedRows.length,
  fixed: updatedRows.filter((row) => row[13] === '已修正').length,
  partial: updatedRows.filter((row) => row[13] === '部分修正').length,
  pending: updatedRows.filter((row) => row[13] === '待處理').length,
};

const summary = wb.Sheets[summarySheetName];
if (summary) {
  summary.B3 = { ...(summary.B3 || {}), t: 'n', v: counts.total };
  summary.C3 = { ...(summary.C3 || {}), t: 'n', v: counts.fixed };
  summary.D3 = { ...(summary.D3 || {}), t: 'n', v: counts.partial };
  summary.E3 = { ...(summary.E3 || {}), t: 'n', v: counts.pending };
  summary.F3 = {
    ...(summary.F3 || {}),
    t: 's',
    v: counts.total ? `${((counts.fixed / counts.total) * 100).toFixed(1)}%` : '0.0%',
  };
  summary.G3 = {
    ...(summary.G3 || {}),
    t: 's',
    v: '已補入 i-Fare 前台進階優化 #167-#174（人生事件、申請助手、收藏比較、條件暫存、期限提醒、推薦、錯誤引導、文件清單）',
  };
}

XLSX.writeFile(wb, file);

console.log(`Appended #${entries[0][0]}-#${entries.at(-1)[0]} to ${sheetName}.`);
console.log(counts);
