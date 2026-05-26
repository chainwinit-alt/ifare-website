import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.resolve(__dirname, '..', 'docs', 'iFare_問題追蹤與AI維運規劃.xlsx');
const sheetName = 'UIUX問題追蹤清單';
const summarySheetName = '統計摘要';

const wb = XLSX.readFile(file, { cellStyles: true });
const ws = wb.Sheets[sheetName];
if (!ws) throw new Error(`Worksheet not found: ${sheetName}`);

let range = XLSX.utils.decode_range(ws['!ref']);
const cell = (r, c) => XLSX.utils.encode_cell({ r, c });
const cloneStyle = (addr) => {
  const style = ws[addr]?.s;
  return style ? JSON.parse(JSON.stringify(style)) : undefined;
};

const setCell = (r, c, value, templateRow = r) => {
  const addr = cell(r, c);
  const templateAddr = cell(templateRow, c);
  ws[addr] = {
    ...(ws[addr] || {}),
    v: value,
    t: typeof value === 'number' ? 'n' : 's',
    s: ws[addr]?.s || cloneStyle(templateAddr),
  };
};

const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
const existingIds = new Set(rows.slice(2).map((row) => Number(row[0])).filter(Boolean));
const templateRow = range.e.r;

const issues = [
  [
    159,
    'V',
    '全站通用',
    '聊天機器人 API 錯誤處理優化',
    '提升',
    '互動',
    '中',
    '聊天機器人需區分 Gemini API 錯誤類型並顯示友善訊息',
    '目前 API 失敗時主要依 fallback 處理，使用者難以判斷是 API key 錯誤、額度不足、模型錯誤、網路逾時或服務異常。',
    '後端統一整理 Gemini API 錯誤回應，回傳標準錯誤代碼與前端可顯示的友善訊息；前端依錯誤類型提示重試、稍後再試或聯絡管理者。',
    'server/api/chatbot.post.ts components/CompChatbotWelcome.vue',
    'Dev/Dev Code/iFare_Frontend/server/api/chatbot.post.ts\r\nDev/Dev Code/iFare_Frontend/components/CompChatbotWelcome.vue',
    'Gemini 串接已完成；此項為正式化前的錯誤處理優化。',
    '未修正',
    '',
    '建議納入下一輪小幫手 API 穩定性優化。',
  ],
  [
    160,
    'V',
    '全站通用',
    '聊天機器人 API 使用量與濫用控管',
    '提升',
    '效能',
    '高',
    '聊天機器人需加入頻率限制、逾時與防濫用控管',
    '目前 /api/chatbot 可由前端直接呼叫，若正式上線後遭短時間大量請求，可能造成 Gemini API 額度消耗過快或觸發 rate limit。',
    '加入每 IP 或 session 的頻率限制、請求 timeout、重複送出防護與錯誤退避；必要時記錄基本請求量以便追蹤用量。',
    'server/api/chatbot.post.ts components/CompChatbotWelcome.vue',
    'Dev/Dev Code/iFare_Frontend/server/api/chatbot.post.ts\r\nDev/Dev Code/iFare_Frontend/components/CompChatbotWelcome.vue',
    'Google Gemini API 有 RPM/TPM/RPD 等限制；正式環境建議先做保護。',
    '未修正',
    '',
    '高優先級，避免上線後 API 額度被異常消耗。',
  ],
  [
    161,
    'V',
    '全站通用',
    '聊天機器人回覆品質與知識來源優化',
    '提升',
    '內容',
    '中',
    '聊天機器人需建立固定知識來源降低亂編風險',
    '目前 Gemini 主要依 system prompt 回答，尚未有 i-Fare 常見問題、福利查詢、公益夥伴、聯絡資訊等固定知識內容作為依據。',
    '整理站內常見問題與固定資訊，作為後端 prompt 或知識片段注入；明確限制不自行編造補助金額、資格條件或不存在的申請方式。',
    'server/api/chatbot.post.ts docs',
    'Dev/Dev Code/iFare_Frontend/server/api/chatbot.post.ts\r\ndocs/iFare_問題追蹤與AI維運規劃.xlsx',
    '此項偏內容治理與回答品質；可與基金會確認標準問答後再實作。',
    '未修正',
    '',
    '建議先整理 10-20 題 FAQ，再接進小幫手 prompt。',
  ],
  [
    162,
    'V',
    '全站通用',
    '聊天機器人前端互動體驗優化',
    '提升',
    '互動',
    '中',
    '聊天機器人需補強回覆中、失敗重試與站內導向操作',
    '目前聊天機器人已可呼叫 Gemini，但前端互動仍可補強，例如回覆中狀態、失敗重試、常見問題 chips、回答後導向按鈕等。',
    '補上更明確的 loading 狀態、重新送出按鈕、常用問題快捷 chips，並在合適回答後提供「前往福利查詢」「查看公益夥伴」「聯絡基金會」等 CTA。',
    'components/CompChatbotWelcome.vue',
    'Dev/Dev Code/iFare_Frontend/components/CompChatbotWelcome.vue',
    '此項為體驗提升，不影響目前 Gemini API 基本可用。',
    '未修正',
    '',
    '可依使用者測試結果調整 chips 與 CTA 文案。',
  ],
];

let appended = 0;
for (const issue of issues) {
  if (existingIds.has(issue[0])) continue;

  const rowIndex = range.e.r + 1;
  for (let c = 0; c < issue.length; c += 1) {
    setCell(rowIndex, c, issue[c], templateRow);
  }

  range = {
    s: range.s,
    e: { r: rowIndex, c: Math.max(range.e.c, issue.length - 1) },
  };
  appended += 1;
}

ws['!ref'] = XLSX.utils.encode_range(range);

const updatedRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }).slice(2).filter((row) => row[0]);
const counts = {
  total: updatedRows.length,
  fixed: updatedRows.filter((row) => row[13] === '已修正').length,
  partial: updatedRows.filter((row) => row[13] === '部分修正').length,
  pending: updatedRows.filter((row) => row[13] === '未修正' || row[13] === '待處理').length,
};

const summary = wb.Sheets[summarySheetName];
if (summary) {
  summary['B3'] = { ...(summary['B3'] || {}), v: counts.total, t: 'n' };
  summary['C3'] = { ...(summary['C3'] || {}), v: counts.fixed, t: 'n' };
  summary['D3'] = { ...(summary['D3'] || {}), v: counts.partial, t: 'n' };
  summary['E3'] = { ...(summary['E3'] || {}), v: counts.pending, t: 'n' };
  summary['F3'] = { ...(summary['F3'] || {}), v: `${((counts.fixed / counts.total) * 100).toFixed(1)}%`, t: 's' };
  summary['G3'] = {
    ...(summary['G3'] || {}),
    v: '新增 #159-#162：Gemini API 錯誤處理、用量控管、知識來源與前端互動體驗後續優化',
    t: 's',
  };
}

XLSX.writeFile(wb, file, { compression: true });
console.log(`Appended ${appended} Gemini optimization issue(s).`);
console.log(counts);
