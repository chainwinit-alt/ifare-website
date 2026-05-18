import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx-js-style';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.resolve(__dirname, '..', 'docs');
const fileName = fs.readdirSync(docsDir).find((name) => name.endsWith('.xlsx') && name.includes('UI_UX'));
if (!fileName) throw new Error('Cannot find UI/UX tracking workbook under docs/.');

const file = path.join(docsDir, fileName);
const sheetName = '後臺優化';
const summarySheetName = '統計摘要';
const wb = XLSX.readFile(file, { cellStyles: true });
const ws = wb.Sheets[sheetName];
if (!ws) throw new Error(`Worksheet not found: ${sheetName}`);

const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
const existingIds = new Set(rows.slice(2).map((row) => Number(row[0])).filter(Boolean));

const entries = [
  [73, 'V', 'i-Fare 維護', '人生事件管理', '提升', '導覽', '高', '缺少人生事件對應政策的後台維護機制', '前台人生事件導覽若硬寫在程式內，後續生育、失業、照顧、長照、身障、就學等入口調整都需要工程修改。', '新增人生事件維護頁，可設定事件名稱、說明、對應政策分類、關鍵字、身分條件與排序。', 'iFare_Backend PageManagement / Code / FarePolicy', 'Dev/Dev Code/iFare_Backend/src/views/**\r\nDev/Dev Code/iFare_Backend_API/src/**', '支援前台 #167 人生事件導覽。', '待處理', '', '可先由前台 mapping MVP，後台維護列為正式版。'],
  [74, 'V', 'i-Fare 維護', '申請路徑欄位', '提升', '申請流程', '高', '福利政策缺結構化申請路徑資料', '目前政策內容多為 Qualification / WelfareInfo / Evidence 長文，前台難以穩定組出申請助手。', '福利政策編輯頁新增申請流程、申請方式、承辦窗口、注意事項等結構化欄位，API detail 同步回傳。', 'FarePolicy AddEdit / API DTO', 'Dev/Dev Code/iFare_Backend/src/views/**FarePolicy**\r\nDev/Dev Code/iFare_Backend_API/src/**FarePolicy**', '支援前台 #168 申請路徑助手。', '待處理', '', '第一階段前台可先用既有欄位摘要；正式版需 DB schema。'],
  [75, 'V', 'i-Fare 維護', '應備文件管理', '提升', '文件', '高', '應備文件為純文字，無法依條件產生精準清單', 'Evidence 欄位目前是文字，無法標記必備/選備、適用身分、範本連結或備註。', '新增政策文件清單資料結構，欄位含文件名稱、是否必備、適用條件、備註、範本連結。', 'FarePolicy Evidence / API DTO', 'Dev/Dev Code/iFare_Backend/src/views/**FarePolicy**\r\nDev/Dev Code/iFare_Backend_API/src/**FarePolicy**', '支援前台 #174 文件清單產生器。', '待處理', '', '前台 MVP 先從 Evidence 解析 checklist。'],
  [76, 'V', 'i-Fare 維護', '資格規則', '提升', '資格判斷', '高', '缺少資格規則與不符合原因 API', '前台查無結果只能推測可能原因，無法可靠告知使用者差在哪個條件。', '建立資格規則或 mismatch reason API，回傳年齡、地區、收入、身分、期限等不符合原因。', 'FarePolicy Search API', 'Dev/Dev Code/iFare_Frontend_API/src/IFare_API.Core/TaskManager/Fare/Policy/**', '支援前台 #173 常見錯誤引導。', '待處理', '', '正式版不建議只靠前端猜測資格原因。'],
  [77, 'V', '後台通用', '通知中心 / 排程', '提升', '提醒', '中', '缺少政策截止與內容更新提醒排程', '前台可顯示即將截止 badge，但 Email/LINE/站內提醒需要後台排程與通知紀錄。', '建立通知中心與排程任務，支援即將下架、即將截止、政策更新、審核逾時等通知。', 'Notification / Scheduler', 'Dev/Dev Code/iFare_Backend/src/views/**\r\nDev/Dev Code/iFare_Backend_API/src/**', '支援前台 #171 申請期限提醒，並延伸 #60 通知中心。', '待處理', '', '可併入既有 #55 任務中心與 #60 通知中心規劃。'],
  [78, 'V', 'i-Fare 維護', '收藏 / 比較保存', '提升', '個人化', '中', '收藏與比較若需跨裝置，後台缺保存 API', '前台 localStorage 只能保存同一台裝置，若要跨裝置、登入後延續或客服協助，需要後台保存。', '新增收藏政策、比較清單 API；短期可匿名 token，長期接會員帳號。', 'Favorite / Compare API', 'Dev/Dev Code/iFare_Frontend_API/src/**\r\nDev/Dev Code/iFare_Backend_API/src/**', '支援前台 #169 收藏 / 比較。', '待處理', '', '前台 MVP 可先本機保存。'],
  [79, 'V', 'i-Fare 維護', '推薦規則', '提升', '推薦', '中', '相關政策推薦缺推薦理由與權重管理', '目前 GetIFarePolicyRelation 有基本推薦，但前台無法穩定說明推薦理由，也無法調整權重。', '後台或 API 補 relationReason / score，規則含同地區、同身分、同年齡、同收入、同關鍵字。', 'FarePolicy Relation API', 'Dev/Dev Code/iFare_Frontend_API/src/IFare_API.Core/TaskManager/Fare/Policy/**', '支援前台 #172 相關政策推薦。', '待處理', '', '前台 MVP 先用 code list 交集推推薦理由。'],
  [80, 'V', '內容品質', '政策健康檢查', '提升', '品質', '中', '政策缺欄位會讓前台申請助手與文件清單失效', '若政策缺條件、文件、窗口、截止日或連結失效，前台新功能會呈現不完整資訊。', '內容健康檢查新增政策檢查規則：缺申請條件、缺文件、缺承辦窗口、缺截止日、連結失效。', 'Content health dashboard', 'Dev/Dev Code/iFare_Backend/src/views/Analysis/**\r\nDev/Dev Code/iFare_Backend_API/src/**', '支援前台 #168 / #174，並延伸既有 #59 內容健康檢查中心。', '待處理', '', '可與 #59 合併規劃，不一定獨立開發。'],
  [81, 'V', '後台通用', '發布 / 下架排程', '提升', '效率', '高', '政策上架下架與截止提醒需要排程管理', '政策有效期間直接影響前台搜尋與提醒，人工管理容易漏掉或延遲。', '建立發布 / 下架排程中心，含排程狀態、失敗重試、即將到期提醒與操作紀錄。', 'Scheduler / FarePolicy', 'Dev/Dev Code/iFare_Backend/src/views/**\r\nDev/Dev Code/iFare_Backend_API/src/**', '支援前台 #171，並延伸既有 #57 定時上架 / 下架排程中心。', '待處理', '', '可與 #55 任務中心、#57 排程中心合併。'],
  [82, 'V', '後台通用', '審核 / 操作紀錄', '提升', '流程', '高', '福利政策內容需要審核與操作追溯', '福利政策屬高信任內容，若沒有誰改、誰審、何時上架的紀錄，後續難以追責與維護。', '政策修改進入待審，記錄修改者、審核者、審核時間、差異內容與退回原因。', 'Audit log / Review workflow', 'Dev/Dev Code/iFare_Backend/src/views/**\r\nDev/Dev Code/iFare_Backend_API/src/**', '支援前台內容可信度，並延伸 #50 操作紀錄與 #58 審核工作流。', '待處理', '', '建議與版本 diff / snapshot 一起規劃。'],
];

const duplicates = entries.map((entry) => entry[0]).filter((id) => existingIds.has(id));
if (duplicates.length) throw new Error(`Duplicate backend ids: ${duplicates.join(', ')}`);

const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
const templateRow = rows.findIndex((row, index) => index >= 2 && row[13] === '待處理');
const startRow = range.e.r + 1;

entries.forEach((entry, rowOffset) => {
  const r = startRow + rowOffset;
  entry.forEach((value, c) => {
    const template = ws[XLSX.utils.encode_cell({ r: templateRow, c })];
    ws[XLSX.utils.encode_cell({ r, c })] = {
      t: typeof value === 'number' ? 'n' : 's',
      v: value,
      s: template?.s ? JSON.parse(JSON.stringify(template.s)) : undefined,
    };
  });
});

ws['!ref'] = XLSX.utils.encode_range({
  s: range.s,
  e: { r: range.e.r + entries.length, c: Math.max(range.e.c, 15) },
});

const updatedRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }).slice(2).filter((row) => row[0]);
const counts = {
  total: updatedRows.length,
  fixed: updatedRows.filter((row) => row[13] === '已修正').length,
  partial: updatedRows.filter((row) => row[13] === '部分修正').length,
  pending: updatedRows.filter((row) => row[13] === '待處理').length,
};

const summary = wb.Sheets[summarySheetName];
if (summary) {
  summary.B4 = { ...(summary.B4 || {}), t: 'n', v: counts.total };
  summary.C4 = { ...(summary.C4 || {}), t: 'n', v: counts.fixed };
  summary.D4 = { ...(summary.D4 || {}), t: 'n', v: counts.partial };
  summary.E4 = { ...(summary.E4 || {}), t: 'n', v: counts.pending };
  summary.F4 = { ...(summary.F4 || {}), t: 's', v: counts.total ? `${((counts.fixed / counts.total) * 100).toFixed(1)}%` : '0.0%' };
  summary.G4 = { ...(summary.G4 || {}), t: 's', v: '已補入 i-Fare 前台進階功能對應後台支援任務 #73-#82' };
}

XLSX.writeFile(wb, file);
console.log(`Appended backend tasks #${entries[0][0]}-#${entries.at(-1)[0]}.`);
console.log(counts);
