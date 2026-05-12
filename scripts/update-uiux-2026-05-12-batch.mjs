import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx-js-style';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.resolve(__dirname, '..', 'docs');
const workbookFileName = fs.readdirSync(docsDir).find((name) => name.endsWith('.xlsx'));

if (!workbookFileName) {
  throw new Error('UI/UX tracking workbook not found.');
}

const file = path.join(docsDir, workbookFileName);
const today = '2026-05-12';
const wb = XLSX.readFile(file, { cellStyles: true });

console.log('Sheets in workbook:', wb.SheetNames);

function findSheet(predicate) {
  return wb.SheetNames.find(predicate);
}

function updateRow(sheetName, id, status, verify, note) {
  const ws = wb.Sheets[sheetName];
  if (!ws) {
    console.warn(`Sheet not found: ${sheetName}`);
    return false;
  }
  const range = XLSX.utils.decode_range(ws['!ref']);
  const cell = (r, c) => XLSX.utils.encode_cell({ r, c });

  for (let r = 2; r <= range.e.r; r += 1) {
    if (Number(ws[cell(r, 0)]?.v) === id) {
      const setCell = (col, value) => {
        const addr = cell(r, col);
        ws[addr] = {
          ...(ws[addr] || {}),
          v: value,
          t: typeof value === 'number' ? 'n' : 's',
        };
      };
      setCell(12, verify);
      setCell(13, status);
      setCell(14, today);
      setCell(15, note);
      return true;
    }
  }
  console.warn(`Row #${id} not found in ${sheetName}`);
  return false;
}

// ─── sheet2（後台 backlog） ───
const sheet2Name = findSheet((n) => /主題二|後台|sheet2/.test(n)) || wb.SheetNames[1];
console.log(`sheet2 detected as: ${sheet2Name}`);

const sheet2Updates = [
  [17, 'CardTable.vue +100 行（commit 93d1186 第六輪）涉及表格列寬等改動。', '部分修正 — 完成度待 review；Codex 大批改動未逐檔 verify。'],
  [18, '2026-05-12 AddEditView.vue 加 errors ref + onSave 失敗時填 inline 紅字 + has-error class 的 el-input 紅框 + label 變紅。', '只針對 title / slug / status 3 個必填欄位，進階設定（SEO / cover / tags / publishTime）尚未套同 pattern，故為部分修正。'],
  [20, 'CardSearchParam.vue +147 行（commit 93d1186）涉及搜尋條件清除等改動。', '部分修正 — Codex 第六輪涉及，完成度待 review。'],
  [26, 'CardSearchParam.vue +147 行涉及日期選擇 / 快捷選項。', '部分修正 — Codex 第六輪涉及，完成度待 review。'],
  [39, 'HomeView.vue +365 行（commit 93d1186）Dashboard 整體改造。', '部分修正 — 角色化 Dashboard 完成度待 review，可能僅做基礎卡片化、未實際依角色切分。'],
  [40, 'HomeView.vue +365 行（commit 93d1186）涉及。', '部分修正 — 今日待辦區塊完成度待 review；現有 HomeView 主要是 hero + shortcut，待辦尚未明顯。'],
  [41, 'HomeView.vue +365 行（commit 93d1186）Dashboard 卡片化分區。', '部分修正 — Dashboard 已卡片化但 KPI / 異常 / 待審 / 待處理分區是否齊備待 review。'],
  [42, 'CardTable.vue +100 行（commit 93d1186）涉及表格批次操作。', '部分修正 — Codex 第六輪涉及，多選 + 批次刪除/啟用/匯出完成度待 review。'],
  [53, 'HomeView.vue +365 行（commit 93d1186）後台首頁整體重構。', '部分修正 — Codex 大改完整 Dashboard 結構，但整合搜尋 / 總覽 / 待辦 / 快捷的完整性待 review。'],
];

let sheet2Updated = 0;
for (const [id, verify, note] of sheet2Updates) {
  if (updateRow(sheet2Name, id, '部分修正', verify, note)) sheet2Updated += 1;
}
console.log(`sheet2 updated rows: ${sheet2Updated}/${sheet2Updates.length}`);

// ─── sheet3（前端 UIUX 主清單） ───
const sheet3Name = findSheet((n) => n.includes('UIUX')) || wb.SheetNames[2];
console.log(`sheet3 detected as: ${sheet3Name}`);

const sheet3Updates = [
  [141, 'CompChatbotWelcome.vue +1248 行（commit 93d1186）大改造涉及 chatbot 元件統整。', '部分修正 — 5 個共用元件 (Button/Chip/Bubble/Card/InputBar) 是否拆出獨立檔待 review；目前仍在 CompChatbotWelcome.vue 內 scoped。'],
  [142, 'CompChatbotWelcome.vue scoped style 大改 + server/api/chatbot.post.ts 強化。', '部分修正 — 尺寸規範整體調整完成度待 review。'],
];

let sheet3Updated = 0;
for (const [id, verify, note] of sheet3Updates) {
  if (updateRow(sheet3Name, id, '部分修正', verify, note)) sheet3Updated += 1;
}
console.log(`sheet3 updated rows: ${sheet3Updated}/${sheet3Updates.length}`);

// ─── sheet3 summary 更新（依既有 pattern） ───
const summarySheetName = wb.SheetNames[wb.SheetNames.length - 1];
const summary = wb.Sheets[summarySheetName];
const ws3 = wb.Sheets[sheet3Name];

if (ws3 && summary) {
  const rows = XLSX.utils
    .sheet_to_json(ws3, { header: 1, defval: '' })
    .slice(2)
    .filter((row) => row[0]);

  const counts = {
    total: rows.length,
    fixed: rows.filter((row) => row[13] === '已修正').length,
    partial: rows.filter((row) => row[13] === '部分修正').length,
    pending: rows.filter((row) => row[13] === '待處理' || row[13] === '未修正').length,
  };

  summary.B3 = { ...(summary.B3 || {}), v: counts.total, t: 'n' };
  summary.C3 = { ...(summary.C3 || {}), v: counts.fixed, t: 'n' };
  summary.D3 = { ...(summary.D3 || {}), v: counts.partial, t: 'n' };
  summary.E3 = { ...(summary.E3 || {}), v: counts.pending, t: 'n' };
  summary.F3 = {
    ...(summary.F3 || {}),
    v: `${((counts.fixed / counts.total) * 100).toFixed(1)}%`,
    t: 's',
  };
  summary.G3 = {
    ...(summary.G3 || {}),
    v: '更新 sheet2 #17/#20/#26/#39-#41/#42/#53 + #18(新)、sheet3 #141/#142 全標部分修正 — 對應 commit 93d1186 第六輪改動。',
    t: 's',
  };

  console.log(`sheet3 stats: ${counts.fixed}/${counts.total} = ${((counts.fixed / counts.total) * 100).toFixed(1)}% (partial ${counts.partial}, pending ${counts.pending})`);
}

XLSX.writeFile(wb, file, { compression: true });
console.log(`Total updated: sheet2 ${sheet2Updated} + sheet3 ${sheet3Updated} = ${sheet2Updated + sheet3Updated} rows.`);
