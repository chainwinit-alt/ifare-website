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
const ws = wb.Sheets['後臺優化'];
if (!ws) throw new Error('Worksheet not found: 後臺優化');

const correctedRows = new Map([
  [80, [80, 'V', '內容品質', '政策健康檢查', '提升', '品質', '中', '政策缺欄位會讓前台申請助手與文件清單失效', '若政策缺條件、文件、窗口、截止日或連結失效，前台新功能會呈現不完整資訊。', '內容健康檢查新增政策檢查規則：缺申請條件、缺文件、缺承辦窗口、缺截止日、連結失效。', 'Content health dashboard', 'Dev/Dev Code/iFare_Backend/src/views/Analysis/**\r\nDev/Dev Code/iFare_Backend_API/src/**', '支援前台 #168 / #174，並延伸既有 #59 內容健康檢查中心。', '待處理', '', '可與 #59 合併規劃，不一定獨立開發。']],
  [81, [81, 'V', '後台通用', '發布 / 下架排程', '提升', '效率', '高', '政策上架下架與截止提醒需要排程管理', '政策有效期間直接影響前台搜尋與提醒，人工管理容易漏掉或延遲。', '建立發布 / 下架排程中心，含排程狀態、失敗重試、即將到期提醒與操作紀錄。', 'Scheduler / FarePolicy', 'Dev/Dev Code/iFare_Backend/src/views/**\r\nDev/Dev Code/iFare_Backend_API/src/**', '支援前台 #171，並延伸既有 #57 定時上架 / 下架排程中心。', '待處理', '', '可與 #55 任務中心、#57 排程中心合併。']],
  [82, [82, 'V', '後台通用', '審核 / 操作紀錄', '提升', '流程', '高', '福利政策內容需要審核與操作追溯', '福利政策屬高信任內容，若沒有誰改、誰審、何時上架的紀錄，後續難以追責與維護。', '政策修改進入待審，記錄修改者、審核者、審核時間、差異內容與退回原因。', 'Audit log / Review workflow', 'Dev/Dev Code/iFare_Backend/src/views/**\r\nDev/Dev Code/iFare_Backend_API/src/**', '支援前台內容可信度，並延伸 #50 操作紀錄與 #58 審核工作流。', '待處理', '', '建議與版本 diff / snapshot 一起規劃。']],
]);

const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
for (let r = 2; r < rows.length; r += 1) {
  const id = Number(rows[r][0]);
  const corrected = correctedRows.get(id);
  if (!corrected) continue;

  for (let c = 0; c < corrected.length; c += 1) {
    const addr = XLSX.utils.encode_cell({ r, c });
    ws[addr] = {
      ...(ws[addr] || {}),
      t: typeof corrected[c] === 'number' ? 'n' : 's',
      v: corrected[c],
    };
  }
}

XLSX.writeFile(wb, file);
console.log('Fixed backend rows #80-#82 column alignment.');
