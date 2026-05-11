import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.resolve(__dirname, '..', 'docs', 'iFare_UI_UX_問題追蹤清單.xlsx');
const sheetName = 'UIUX問題追蹤清單';
const summarySheetName = '統計摘要';

const wb = XLSX.readFile(file, { cellStyles: true });
const ws = wb.Sheets[sheetName];
if (!ws) throw new Error(`Worksheet not found: ${sheetName}`);

const range = XLSX.utils.decode_range(ws['!ref']);
const cell = (r, c) => XLSX.utils.encode_cell({ r, c });

const setCell = (r, c, value) => {
  const addr = cell(r, c);
  ws[addr] = {
    ...(ws[addr] || {}),
    v: value,
    t: typeof value === 'number' ? 'n' : 's',
  };
};

const findRowById = (id) => {
  for (let r = 2; r <= range.e.r; r += 1) {
    if (Number(ws[cell(r, 0)]?.v) === id) return r;
  }
  return -1;
};

const row158 = findRowById(158);
if (row158 === -1) throw new Error('Issue #158 not found');

setCell(row158, 12, '已補強無 OPENAI_API_KEY 時的前端體驗：不再重複顯示設定提示，改用既有本地關鍵字回覆作為 fallback；設定 API key 後仍會自動走 GPT。');
setCell(row158, 13, '部分修正');
setCell(row158, 14, '2026-05-11');
setCell(row158, 15, '補強 CompChatbotWelcome.vue：/api/chatbot 回傳 configured=false 時改走 generateBotReply，本地測試階段也可依問題類型回覆；正式 GPT 回覆仍需環境變數 OPENAI_API_KEY。');

const summary = wb.Sheets[summarySheetName];
if (summary) {
  summary['G3'] = {
    ...(summary['G3'] || {}),
    v: '補強 #158：無 OPENAI_API_KEY 時改用本地關鍵字 fallback，避免聊天畫面重複顯示設定提示',
    t: 's',
  };
}

XLSX.writeFile(wb, file, { compression: true });
console.log('Updated #158 chatbot fallback note.');
