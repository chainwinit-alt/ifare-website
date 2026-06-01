import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx-js-style';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.resolve(__dirname, '..', 'docs');
const fileName = fs.readdirSync(docsDir).find((name) => name.endsWith('.xlsx') && name.includes('UI_UX'));
if (!fileName) throw new Error('Cannot find UI/UX tracking workbook under docs/.');

const file = path.join(docsDir, fileName);
const wb = XLSX.readFile(file, { cellStyles: true });
const ws = wb.Sheets['UIUX問題追蹤清單'];
if (!ws) throw new Error('Worksheet not found: UIUX問題追蹤清單');

const updates = new Map([
  [167, '2026-05-18 MVP：/ifare 新增生育、失業、照顧、長照、身障、就學入口，點選後直接帶關鍵字進結果頁並保存條件。正式版仍建議後台維護事件 mapping。'],
  [168, '2026-05-18 MVP：/ifare/info 新增申請路徑助手，用現有 Qualification / Evidence / OfficeUnit / DiscontinuedTime 組成四步提示。正式版仍需後台結構化流程欄位。'],
  [170, '2026-05-18 MVP：新增 useWelfareProfile，以 localStorage 暫存政策、年齡、地區、收入、身分、關鍵字與人生事件，並提供清除。'],
  [171, '2026-05-18 MVP：新增 usePolicyDeadline，結果卡與詳情頁顯示 30 天內截止 badge。Email/LINE/站內提醒需後台通知中心。'],
  [172, '2026-05-18 MVP：詳情頁相關政策新增推薦理由，先以前端比較地區、類型、年齡、收入、身分條件推導。正式版可由 API 回傳 relationReason。'],
  [173, '2026-05-18 MVP：結果頁查無結果改為正常空狀態，並依查詢條件提示可能卡在地區、年齡、收入、身分或關鍵字。正式版需後端 mismatch reason。'],
  [174, '2026-05-18 MVP：新增 useDocumentChecklist，詳情頁把 Evidence 解析成可勾選文件清單。正式版仍需後台結構化文件資料。'],
]);

const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
for (let r = 2; r < rows.length; r += 1) {
  const id = Number(rows[r][0]);
  if (!updates.has(id)) continue;

  ws[XLSX.utils.encode_cell({ r, c: 13 })] = { ...(ws[XLSX.utils.encode_cell({ r, c: 13 })] || {}), t: 's', v: '部分修正' };
  ws[XLSX.utils.encode_cell({ r, c: 14 })] = { ...(ws[XLSX.utils.encode_cell({ r, c: 14 })] || {}), t: 's', v: '2026-05-18' };
  ws[XLSX.utils.encode_cell({ r, c: 15 })] = { ...(ws[XLSX.utils.encode_cell({ r, c: 15 })] || {}), t: 's', v: updates.get(id) };
}

const updatedRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }).slice(2).filter((row) => row[0]);
const counts = {
  total: updatedRows.length,
  fixed: updatedRows.filter((row) => row[13] === '已修正').length,
  partial: updatedRows.filter((row) => row[13] === '部分修正').length,
  pending: updatedRows.filter((row) => row[13] === '待處理').length,
};

const summary = wb.Sheets['統計摘要'];
if (summary) {
  summary.B3 = { ...(summary.B3 || {}), t: 'n', v: counts.total };
  summary.C3 = { ...(summary.C3 || {}), t: 'n', v: counts.fixed };
  summary.D3 = { ...(summary.D3 || {}), t: 'n', v: counts.partial };
  summary.E3 = { ...(summary.E3 || {}), t: 'n', v: counts.pending };
  summary.F3 = { ...(summary.F3 || {}), t: 's', v: `${((counts.fixed / counts.total) * 100).toFixed(1)}%` };
  summary.G3 = { ...(summary.G3 || {}), t: 's', v: '2026-05-18：#167/#168/#170-#174 已完成前台 MVP；#169 待做收藏/比較完整流程。' };
}

XLSX.writeFile(wb, file);
console.log('Marked #167, #168, #170-#174 as 部分修正.');
console.log(counts);
