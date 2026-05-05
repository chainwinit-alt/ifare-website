// 重新設計 統計摘要 sheet — 多區塊結構，一眼看出進度
//   區塊 1: 整體進度 (3 個 sheet 各自 status 分布)
//   區塊 2: Round 時間軸 (Round 1-6 做了什麼)
//   區塊 3: 後臺優化 5 主軸分布
//   區塊 4: UIUX 各區塊進度
//   區塊 5: 你做了什麼 — 已完成項目清單 (by Round)
// Run: node scripts/rebuild-stats-summary.mjs

import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const COLS_ALL = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

// ===== 樣式 =====
const STYLE_TITLE = {
  fill: { patternType: 'solid', fgColor: { rgb: '4472C4' } },
  font: { color: { rgb: 'FFFFFF' }, bold: true, sz: 14 },
  alignment: { vertical: 'center', horizontal: 'left', wrapText: true },
};
const STYLE_HEADER = {
  fill: { patternType: 'solid', fgColor: { rgb: 'D9E2F3' } },
  font: { color: { rgb: '1F3864' }, bold: true, sz: 11 },
  alignment: { vertical: 'center', horizontal: 'center', wrapText: true },
};
const STYLE_CELL = {
  alignment: { vertical: 'center', horizontal: 'left', wrapText: true },
  font: { sz: 11 },
};
const STYLE_NUM = {
  alignment: { vertical: 'center', horizontal: 'center', wrapText: true },
  font: { sz: 11 },
};
const STYLE_GREEN = {
  fill: { patternType: 'solid', fgColor: { rgb: 'C6EFCE' } },
  font: { color: { rgb: '006100' }, sz: 11 },
  alignment: { vertical: 'center', horizontal: 'center' },
};
const STYLE_YELLOW = {
  fill: { patternType: 'solid', fgColor: { rgb: 'FFEB9C' } },
  font: { color: { rgb: '9C5700' }, sz: 11 },
  alignment: { vertical: 'center', horizontal: 'center' },
};
const STYLE_GRAY = {
  fill: { patternType: 'solid', fgColor: { rgb: 'F2F2F2' } },
  font: { color: { rgb: '595959' }, sz: 11 },
  alignment: { vertical: 'center', horizontal: 'center' },
};

function setCell(ws, addr, val, style) {
  const t = typeof val === 'number' ? 'n' : 's';
  ws[addr] = { t, v: val };
  if (style) ws[addr].s = style;
}

function setRow(ws, row, vals, styles) {
  vals.forEach((v, i) => {
    const addr = `${COLS_ALL[i]}${row}`;
    const style = Array.isArray(styles) ? styles[i] : styles;
    setCell(ws, addr, v ?? '', style);
  });
}

// ===== 讀取現況 =====
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(__dirname, '..', 'docs', 'iFare_UI_UX_問題追蹤清單.xlsx');
const wb = XLSX.readFile(FILE, { cellStyles: true });
const wsUiux = wb.Sheets['UIUX問題追蹤清單'];
const wsBackend = wb.Sheets['後臺優化'];
const wsPoC = wb.Sheets['PoC研究'];

function statsBy(ws, statusCol = 13, axisCol = null) {
  const range = XLSX.utils.decode_range(ws['!ref']);
  const status = { 已修正: 0, 部分修正: 0, 待處理: 0 };
  const axis = {};
  const region = {};
  const priority = { 高: { 已修正: 0, 部分修正: 0, 待處理: 0 }, 中: { 已修正: 0, 部分修正: 0, 待處理: 0 }, 低: { 已修正: 0, 部分修正: 0, 待處理: 0 } };
  for (let r = 2; r <= range.e.r; r++) {
    const s = ws[XLSX.utils.encode_cell({ r, c: statusCol })]?.v;
    if (status[s] != null) status[s]++;
    if (axisCol != null) {
      const a = ws[XLSX.utils.encode_cell({ r, c: axisCol })]?.v ?? '—';
      axis[a] = (axis[a] || 0) + 1;
    }
    const reg = ws[XLSX.utils.encode_cell({ r, c: 2 })]?.v ?? '其他';
    region[reg] = (region[reg] || 0) + 1;
    const p = ws[XLSX.utils.encode_cell({ r, c: 6 })]?.v;
    if (p && priority[p] && status[s] != null) priority[p][s]++;
  }
  return { status, axis, region, priority, total: status.已修正 + status.部分修正 + status.待處理 };
}

const uiuxStats = statsBy(wsUiux, 13);
const backendStats = statsBy(wsBackend, 13, 16);  // Q col = 主軸
const pocStats = statsBy(wsPoC, 13);

// ===== 重建 統計摘要 sheet =====
const wsName = '統計摘要';
const wsStat = wb.Sheets[wsName];

// 清掉舊內容
for (const key of Object.keys(wsStat)) {
  if (key !== '!ref' && key !== '!margins') delete wsStat[key];
}

let row = 1;

// ===== 區塊 1: 整體進度 =====
setCell(wsStat, `A${row}`, '【1】整體進度', STYLE_TITLE);
['B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach(c => setCell(wsStat, `${c}${row}`, '', STYLE_TITLE));
row++;
setRow(wsStat, row, ['Sheet 名稱', '總計', '已修正', '部分修正', '待處理', '完成率', '備註', ''], STYLE_HEADER);
row++;
setRow(wsStat, row, [
  'UIUX問題追蹤清單 (前台)',
  uiuxStats.total,
  uiuxStats.status.已修正,
  uiuxStats.status.部分修正,
  uiuxStats.status.待處理,
  `${((uiuxStats.status.已修正 / uiuxStats.total) * 100).toFixed(1)}%`,
  '已歷經 Round 1-4 改版',
  '',
], [STYLE_CELL, STYLE_NUM, STYLE_GREEN, STYLE_YELLOW, STYLE_GRAY, STYLE_NUM, STYLE_CELL, STYLE_CELL]);
row++;
setRow(wsStat, row, [
  '後臺優化 (admin)',
  backendStats.total,
  backendStats.status.已修正,
  backendStats.status.部分修正,
  backendStats.status.待處理,
  `${((backendStats.status.已修正 / backendStats.total) * 100).toFixed(1)}%`,
  'Round 5-6 規劃完成 / 全待開始',
  '',
], [STYLE_CELL, STYLE_NUM, STYLE_GREEN, STYLE_YELLOW, STYLE_GRAY, STYLE_NUM, STYLE_CELL, STYLE_CELL]);
row++;
setRow(wsStat, row, [
  'PoC研究',
  pocStats.total,
  pocStats.status.已修正,
  pocStats.status.部分修正,
  pocStats.status.待處理,
  `${((pocStats.status.已修正 / pocStats.total) * 100).toFixed(1)}%`,
  '研究方向，未啟動',
  '',
], [STYLE_CELL, STYLE_NUM, STYLE_GREEN, STYLE_YELLOW, STYLE_GRAY, STYLE_NUM, STYLE_CELL, STYLE_CELL]);
row += 2;

// ===== 區塊 2: Round 時間軸 =====
setCell(wsStat, `A${row}`, '【2】Round 時間軸 — 每輪做了什麼', STYLE_TITLE);
['B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach(c => setCell(wsStat, `${c}${row}`, '', STYLE_TITLE));
row++;
setRow(wsStat, row, ['Round', '日期', '主題', 'UIUX 標完成', 'UIUX 新增', '後臺新增', 'Schema', '主要產出'], STYLE_HEADER);
row++;
const rounds = [
  ['Round 1', '2026-04-28', 'UI/UX 改版 (搜尋 / Footer / 全站動畫 / RWD)', 7, 3, 0, '-', 'pages/ifare 加關鍵字搜尋 + URL query 初始化；全站 NuxtPage transition；卡片/按鈕 hover translateY'],
  ['Round 2', '2026-04-28', 'Footer 整理 + RWD 修正', 2, 2, 0, '-', 'LINE/FB 統一 .btn-social 並排；4 個聯絡資訊加 icon (Tel/Mail/Address/Clock)；footer 觸控 44px'],
  ['Round 3', '2026-04-28', 'About 靈動島 + News 卡片升級 + 社群外連結', 4, 5, 0, '-', 'About 三大核心 morph 卡 (cf47cfa)；News 浮起卡 + stagger fade-up + NEW pill；外連結 target="_blank" rel="noopener"'],
  ['Round 4', '2026-05-04', '切回 master + 開新分支 feat/uiux-round4 + 補做 (環境/補回/新功能)', 0, 8, 4, '-', 'cf47cfa+5dfbf91 補回 16 檔；devProxy/baseURL → 正式 API；nav 加未來規劃 + future.vue；News videoUrl wiring；tsconfig deprecation 清理；about hover bug 修；footer label 重複修'],
  ['Round 5', '2026-05-04', '前後台全面審查 — 後台 UX audit + 前台新 issue 掃描', 0, 26, 22, '-', '後台 22 個工程角度問題 (CRUD/驗證/錯誤處理)；前台 26 個新發現 (XSS/超時/console.log/無障礙/分頁元件重複)'],
  ['Round 6', '2026-05-04', '人性化主軸提案 — 5 主軸 + 16 後台項', 0, 0, 16, '+ Q 欄主軸', 'Dashboard 角色化 / 今日待辦 / KPI 分區；批次操作；軟刪除復原；audit log；危險操作預覽；錯誤訊息引導'],
];
rounds.forEach(r => {
  setRow(wsStat, row, r, [STYLE_CELL, STYLE_CELL, STYLE_CELL, STYLE_NUM, STYLE_NUM, STYLE_NUM, STYLE_CELL, STYLE_CELL]);
  row++;
});
row++;

// ===== 區塊 3: 後臺優化 5 主軸分布 (給提案用) =====
setCell(wsStat, `A${row}`, '【3】後臺優化 — 5 主軸分布 (拿這個去提案!)', STYLE_TITLE);
['B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach(c => setCell(wsStat, `${c}${row}`, '', STYLE_TITLE));
row++;
setRow(wsStat, row, ['主軸', '項目數', '比例', '主要訴求', '對應 #', '', '', ''], STYLE_HEADER);
row++;
const axisDesc = {
  '看得懂': ['首頁先給重點 / KPI / 異常 / 待辦分區 / 欄位白話 / 狀態流程視覺化', '#1, #7, #10, #17, #19, #24, #25, #27, #32, #35, #37, #38, #39, #40, #41, #45, #49'],
  '找得到': ['全域搜尋 / 麵包屑 / 側邊欄高亮 / 變更密碼入口', '#6, #29, #30, #33, #44'],
  '做得快': ['批次操作 / 儲存搜尋 / 大列表 lazy / 匯出進度 / 日期快捷', '#3, #11, #20, #26, #28, #42, #43, #53, #54'],
  '不容易錯': ['表單驗證 / 刪除確認 / 影響預覽 / 預設值 / 錯誤引導', '#2, #4, #5, #15, #18, #21, #22, #23, #31, #34, #36, #46, #47, #48'],
  '出事能追回來': ['audit log / 變更歷史 / 軟刪除復原 / token 管理 / 文件交接', '#9, #12, #50, #51, #52'],
  '—': ['純技術 / 環境設定 (不在 5 主軸範圍)', '#8, #13, #14, #16'],
};
const axisOrder = ['看得懂', '找得到', '做得快', '不容易錯', '出事能追回來', '—'];
for (const a of axisOrder) {
  const cnt = backendStats.axis[a] || 0;
  const pct = backendStats.total > 0 ? `${((cnt / backendStats.total) * 100).toFixed(1)}%` : '0%';
  const [desc, ids] = axisDesc[a] || ['', ''];
  setRow(wsStat, row, [a, cnt, pct, desc, ids, '', '', ''], [STYLE_CELL, STYLE_NUM, STYLE_NUM, STYLE_CELL, STYLE_CELL, STYLE_CELL, STYLE_CELL, STYLE_CELL]);
  row++;
}
row++;

// ===== 區塊 4: UIUX 優先級分布 (已修正進度) =====
setCell(wsStat, `A${row}`, '【4】UIUX — 優先級 × 狀態分布', STYLE_TITLE);
['B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach(c => setCell(wsStat, `${c}${row}`, '', STYLE_TITLE));
row++;
setRow(wsStat, row, ['優先級', '已修正', '部分修正', '待處理', '小計', '完成率', '', ''], STYLE_HEADER);
row++;
for (const p of ['高', '中', '低']) {
  const pri = uiuxStats.priority[p];
  const sub = pri.已修正 + pri.部分修正 + pri.待處理;
  const pct = sub > 0 ? `${(((pri.已修正 + pri.部分修正 * 0.5) / sub) * 100).toFixed(1)}%` : '0%';
  setRow(wsStat, row, [p, pri.已修正, pri.部分修正, pri.待處理, sub, pct, '', ''], [STYLE_CELL, STYLE_GREEN, STYLE_YELLOW, STYLE_GRAY, STYLE_NUM, STYLE_NUM, STYLE_CELL, STYLE_CELL]);
  row++;
}
row++;

// ===== 區塊 5: UIUX 區塊分布 =====
setCell(wsStat, `A${row}`, '【5】UIUX — 各區塊問題分布', STYLE_TITLE);
['B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach(c => setCell(wsStat, `${c}${row}`, '', STYLE_TITLE));
row++;
setRow(wsStat, row, ['區塊', '項目數', '佔比', '', '', '', '', ''], STYLE_HEADER);
row++;
const sortedRegions = Object.entries(uiuxStats.region).sort((a, b) => b[1] - a[1]);
for (const [reg, cnt] of sortedRegions) {
  if (!reg) continue;
  const pct = `${((cnt / uiuxStats.total) * 100).toFixed(1)}%`;
  setRow(wsStat, row, [reg, cnt, pct, '', '', '', '', ''], [STYLE_CELL, STYLE_NUM, STYLE_NUM, STYLE_CELL, STYLE_CELL, STYLE_CELL, STYLE_CELL, STYLE_CELL]);
  row++;
}
row++;

// ===== 區塊 6: 後臺優化 — 區塊分布 =====
setCell(wsStat, `A${row}`, '【6】後臺優化 — 各區塊問題分布', STYLE_TITLE);
['B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach(c => setCell(wsStat, `${c}${row}`, '', STYLE_TITLE));
row++;
setRow(wsStat, row, ['區塊', '項目數', '佔比', '', '', '', '', ''], STYLE_HEADER);
row++;
const sortedBackendRegions = Object.entries(backendStats.region).sort((a, b) => b[1] - a[1]);
for (const [reg, cnt] of sortedBackendRegions) {
  if (!reg) continue;
  const pct = `${((cnt / backendStats.total) * 100).toFixed(1)}%`;
  setRow(wsStat, row, [reg, cnt, pct, '', '', '', '', ''], [STYLE_CELL, STYLE_NUM, STYLE_NUM, STYLE_CELL, STYLE_CELL, STYLE_CELL, STYLE_CELL, STYLE_CELL]);
  row++;
}
row++;

// ===== 區塊 7: 你做了什麼 — Round 分組摘要 (緊湊格式) =====
setCell(wsStat, `A${row}`, '【7】你做了什麼 — 已完成項目摘要 (依 Round 分組)', STYLE_TITLE);
['B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach(c => setCell(wsStat, `${c}${row}`, '', STYLE_TITLE));
row++;
setRow(wsStat, row, ['Round', '日期', '已修正 (綠)', '部分修正 (黃)', '已修正 # 清單', '部分修正 # 清單', '主要重點', ''], STYLE_HEADER);
row++;

// 從 UIUX sheet 撈 已修正/部分修正 + 推斷 Round
const uiuxRange = XLSX.utils.decode_range(wsUiux['!ref']);
const byRound = { 'Round 1': { fixed: [], partial: [], date: '2026-04-28' }, 'Round 2': { fixed: [], partial: [], date: '2026-04-28' }, 'Round 3': { fixed: [], partial: [], date: '2026-04-28' }, 'Round 4': { fixed: [], partial: [], date: '2026-05-04' } };

for (let r = 2; r <= uiuxRange.e.r; r++) {
  const s = wsUiux[XLSX.utils.encode_cell({ r, c: 13 })]?.v;
  if (s !== '已修正' && s !== '部分修正') continue;
  const id = wsUiux[XLSX.utils.encode_cell({ r, c: 0 })]?.v;
  const date = wsUiux[XLSX.utils.encode_cell({ r, c: 14 })]?.v;
  let round;
  if (id >= 98 && id <= 105) round = 'Round 4';
  else if (id >= 91 && id <= 92) round = 'Round 2';
  else if (id >= 93 && id <= 97) round = 'Round 3';
  else if (id >= 88 && id <= 90) round = 'Round 1';
  else if (date === '2026-04-28') {
    if ([19, 73].includes(id)) round = 'Round 2';
    else if ([25, 26, 28, 46].includes(id)) round = 'Round 3';
    else round = 'Round 1';
  } else round = 'Round 1';
  if (s === '已修正') byRound[round].fixed.push(id);
  else byRound[round].partial.push(id);
}

const roundHighlights = {
  'Round 1': '搜尋優化 (移除 disabled / 結果摘要) + 全站動畫 + skeleton 載入 + 卡片/按鈕 hover translateY',
  'Round 2': 'Footer 整合 (LINE/FB 並列 .btn-social) + 觸控目標 44px',
  'Round 3': 'About 三大核心 morph 卡 + News 浮起卡 + 浮現動畫 + line-clamp + NEW pill + 社群 target="_blank"',
  'Round 4': 'cf47cfa+5dfbf91 補回 16 檔 + 環境設定 (devProxy/baseURL) + 未來規劃 nav + News videoUrl wiring + tsconfig + about hover bug + footer label 重複',
};

for (const round of ['Round 1', 'Round 2', 'Round 3', 'Round 4']) {
  const data = byRound[round];
  data.fixed.sort((a, b) => a - b);
  data.partial.sort((a, b) => a - b);
  setRow(wsStat, row, [
    round,
    data.date,
    data.fixed.length,
    data.partial.length,
    data.fixed.length > 0 ? '#' + data.fixed.join(', #') : '-',
    data.partial.length > 0 ? '#' + data.partial.join(', #') : '-',
    roundHighlights[round],
    '',
  ], [STYLE_CELL, STYLE_CELL, STYLE_GREEN, STYLE_YELLOW, STYLE_CELL, STYLE_CELL, STYLE_CELL, STYLE_CELL]);
  row++;
}
row++;

// ===== 設定欄寬 =====
wsStat['!cols'] = [
  { wch: 14 },  // A
  { wch: 12 },  // B
  { wch: 14 },  // C
  { wch: 14 },  // D
  { wch: 50 },  // E (清單)
  { wch: 25 },  // F
  { wch: 60 },  // G (重點)
  { wch: 14 },  // H
];

// 設範圍
wsStat['!ref'] = `A1:H${row - 1}`;

// 寫回
XLSX.writeFile(wb, FILE);

const totalCompleted = uiuxStats.status.已修正 + uiuxStats.status.部分修正;
console.log('✅ 統計摘要 sheet 已重建');
console.log(`   總共 ${row - 1} rows / 7 個區塊 (壓縮後 by Round 分組)`);
console.log(`   UIUX 完成項目: ${totalCompleted} 個 (${uiuxStats.status.已修正} 已修正 + ${uiuxStats.status.部分修正} 部分修正)`);
console.log(`   檔案: ${FILE}`);
