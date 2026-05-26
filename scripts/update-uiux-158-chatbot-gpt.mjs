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

const findRowById = (id) => {
  for (let r = 2; r <= range.e.r; r += 1) {
    if (Number(ws[cell(r, 0)]?.v) === id) return r;
  }
  return -1;
};

const issue138Row = findRowById(138);
if (issue138Row !== -1) {
  setCell(issue138Row, 13, '部分修正');
  setCell(issue138Row, 14, '2026-05-11');
  setCell(issue138Row, 15, '已將聊天機器人自由輸入流程改為呼叫 Nuxt server API，具備 User/Bot 對話流、輸入中狀態與失敗備援；完整對話元件與人工客服卡仍可後續補強。');
}

const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
const existingIds = new Set(rows.slice(2).map((row) => Number(row[0])).filter(Boolean));
const newIssue = [
  158,
  'V',
  '全站通用',
  '聊天機器人 GPT API 串接',
  '提升',
  '互動',
  '高',
  '右下角問題小幫手可串接 OpenAI GPT API 回答問題',
  '原本聊天機器人以本地關鍵字規則回覆，無法針對使用者自由輸入做彈性回答；若直接在前端串 API 也會暴露 API key。',
  '新增 Nuxt server API 作為 OpenAI Responses API 轉接層，前端只呼叫 /api/chatbot，API key 放 OPENAI_API_KEY，模型可用 OPENAI_MODEL 調整。',
  'components/CompChatbotWelcome.vue nuxt.config.ts server/api/chatbot.post.ts .env.example',
  'Dev/Dev Code/iFare_Frontend/components/CompChatbotWelcome.vue\r\nDev/Dev Code/iFare_Frontend/nuxt.config.ts\r\nDev/Dev Code/iFare_Frontend/server/api/chatbot.post.ts\r\nDev/Dev Code/iFare_Frontend/.env.example',
  '已完成程式串接與 build 驗證；實際 GPT 回答需部署環境提供 OPENAI_API_KEY 後才能連線測試。',
  '部分修正',
  '2026-05-11',
  '新增 /api/chatbot server endpoint，使用 Responses API；自由輸入改呼叫 GPT，Quick Action 保留站內導引固定回覆；無 key 時顯示設定提示並保留本地 fallback。',
];

let appended = 0;
if (!existingIds.has(newIssue[0])) {
  const r = range.e.r + 1;
  for (let c = 0; c < newIssue.length; c += 1) {
    setCell(r, c, newIssue[c], range.e.r);
  }
  appended = 1;
  ws['!ref'] = XLSX.utils.encode_range({
    s: range.s,
    e: { r: range.e.r + 1, c: Math.max(range.e.c, newIssue.length - 1) },
  });
}

const updatedRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }).slice(2).filter((row) => row[0]);
const counts = {
  total: updatedRows.length,
  fixed: updatedRows.filter((row) => row[13] === '已修正').length,
  partial: updatedRows.filter((row) => row[13] === '部分修正').length,
  pending: updatedRows.filter((row) => row[13] === '待處理').length,
};

const summary = wb.Sheets[summarySheetName];
if (summary) {
  summary['B3'] = { ...(summary['B3'] || {}), v: counts.total, t: 'n' };
  summary['C3'] = { ...(summary['C3'] || {}), v: counts.fixed, t: 'n' };
  summary['D3'] = { ...(summary['D3'] || {}), v: counts.partial, t: 'n' };
  summary['E3'] = { ...(summary['E3'] || {}), v: counts.pending, t: 'n' };
  summary['F3'] = { ...(summary['F3'] || {}), v: `${((counts.fixed / counts.total) * 100).toFixed(1)}%`, t: 's' };
  summary['G3'] = { ...(summary['G3'] || {}), v: '已新增 #158 並補強 #138：右下角小幫手 GPT API 串接', t: 's' };
}

XLSX.writeFile(wb, file, { compression: true });
console.log(`Updated #138. Appended ${appended} row.`);
console.log(counts);
