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

let row158 = -1;
for (let r = 2; r <= range.e.r; r += 1) {
  if (Number(ws[cell(r, 0)]?.v) === 158) {
    row158 = r;
    break;
  }
}
if (row158 === -1) throw new Error('Issue #158 not found');

setCell(row158, 3, '聊天機器人 Google AI Studio / Gemini API 串接');
setCell(row158, 7, '右下角問題小幫手改串 Google AI Studio Gemini API 回答問題');
setCell(
  row158,
  8,
  '專案改採 Google AI Studio / Gemini API；API key 需放在 server-side 環境變數，避免暴露在前端瀏覽器。'
);
setCell(
  row158,
  9,
  '將 Nuxt server API 改為呼叫 Gemini generateContent，前端仍只呼叫 /api/chatbot；API key 使用 GEMINI_API_KEY，模型可用 GEMINI_MODEL 調整。'
);
setCell(row158, 10, 'components/CompChatbotWelcome.vue nuxt.config.ts server/api/chatbot.post.ts .env.example');
setCell(
  row158,
  11,
  'Dev/Dev Code/iFare_Frontend/components/CompChatbotWelcome.vue\r\nDev/Dev Code/iFare_Frontend/nuxt.config.ts\r\nDev/Dev Code/iFare_Frontend/server/api/chatbot.post.ts\r\nDev/Dev Code/iFare_Frontend/.env.example'
);
setCell(
  row158,
  12,
  '已改為 Google AI Studio / Gemini API 串接；無 GEMINI_API_KEY 時維持本地關鍵字 fallback，設定 key 並重啟後即可改由 Gemini 回覆。'
);
setCell(row158, 13, '部分修正');
setCell(row158, 14, '2026-05-11');
setCell(
  row158,
  15,
  '更新 server/api/chatbot.post.ts：使用 generativelanguage.googleapis.com v1beta generateContent、x-goog-api-key header、gemini-2.5-flash 預設模型；.env.example 改為 GEMINI_API_KEY/GEMINI_MODEL。'
);

const summary = wb.Sheets[summarySheetName];
if (summary) {
  summary['G3'] = {
    ...(summary['G3'] || {}),
    v: '更新 #158：聊天機器人 API 供應商由 OpenAI 改為 Google AI Studio / Gemini API',
    t: 's',
  };
}

XLSX.writeFile(wb, file, { compression: true });
console.log('Updated #158 to Google AI Studio / Gemini API.');
