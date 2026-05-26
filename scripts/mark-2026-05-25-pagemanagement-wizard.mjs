// 2026-05-25 — Round 14 第九批：後台新增頁面 wizard + 多項 UX 改良
//
// 後臺優化 sheet：
//   #91 已修正 — 答題式 wizard（5 題答完直接建好頁）
//   #92 已修正 — 範本庫擴充 4→7 個 + 編輯頁加「常用組合」一鍵插入
//   #93 已修正 — 一鍵複製（DataList「另存新頁」深拷 + slug 自動避衝突 + draft）
//   #94 部分修正 — 內容完整度檢查上方卡（必填紅 / 建議橘 / 通過綠 + 進度條）
//   #65 加備註 — autosave UI 折衷補回 header 右上小 chip（不違反原視覺瘦身意圖）
//   #66 加備註 — frontendSync 改 await + 降級提示（解假成功）
//   #63 加備註 — 補 RWD 斷點 1440→1600 + 中文 label nowrap + drop zone 浮現式
//
// UIUX問題追蹤清單 sheet：
//   #181 加備註 — PreviewPane.vue:66 FRONTEND_URL 環境變數化（補最後一處硬寫）
//
// Run: node scripts/mark-2026-05-25-pagemanagement-wizard.mjs
// 跑完務必：node scripts/compact-xlsx-theme.mjs（避免 theme1.xml 脹大）

import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.resolve(__dirname, '..', 'docs', 'iFare_問題追蹤與AI維運規劃.xlsx');

const TODAY = '2026-05-25';

const BACKEND_MARKS = {
  91: {
    status: '已修正',
    date: TODAY,
    note: '2026-05-25：DataListView「快速新增頁面」對話框改造成 5 題答題式 wizard：Q1 用途（介紹/活動報名/公告/聯絡/自由）→ Q2 標題 → Q3 區塊多選（依用途自動預選） → Q4 主要 CTA 文字+連結 → Q5 草稿/立即發布。submitQuickCreate 直接 insert + 自動帶入 Hero 標題、CTA 區塊內容、image-text 左右交錯、slug 自動避衝突，跳轉編輯頁時頁面已組好。',
  },
  92: {
    status: '已修正',
    date: TODAY,
    note: '2026-05-25：兩條一起補完 — (1) pagePresets 從 4 個（blank/story/service/campaign）擴到 7 個，新增 event 活動報名頁 / news 最新公告頁 / contact 聯絡頁，AddEditView + DataListView 同步；(2) SectionList 加「常用組合」卡（藍色 badge），4 個一鍵插入：📖介紹組 / 🎯服務介紹組 / 🎟️活動報名組 / ✨故事敘述組（自動左右交錯）。SECTION_COMBOS + buildSectionsFromCombo 抽到 useDynamicPages.ts。',
  },
  93: {
    status: '已修正',
    date: TODAY,
    note: '2026-05-25：useDynamicPages 加 duplicate(id) — 深拷整筆 + id/section.id 重生 + title 加「副本」+ slug 自動避衝突（-copy / -copy-2…）+ status 強制 draft + publishTime 清空 + createDate/updateDate now。DataListView「複製新增」鈕改名「另存新頁」，呼叫 duplicate 後直接跳編輯頁，不再用 query 假複製造成 sections/meta/cover/tags 全丟失。',
  },
  94: {
    status: '部分修正',
    date: TODAY,
    note: '2026-05-25 第一版：AddEditView 加「完成度檢查」卡（位於基本欄位下方、頁面畫布上方）— 6 個動態檢查項：title/slug/sections（必填，缺則紅）、metaDescription/coverImage（建議，缺則橘）、imageAlt / ctaLink（只在有對應內容時出現）。上方有 progress bar + 標題（依整體狀態變綠/橘/紅）+ 摘要文字。下一步可考慮：(a) 點 chip 滾到對應欄位、(b) 改成側欄常駐而非編輯區內。',
  },
  65: {
    status: '已修正',
    date: '2026-05-19',
    note: '2026-05-19 完成視覺瘦身（刪 quick-start-head / draft-status / status-explainer 三段純說明性卡片）。2026-05-25 補：autosave 進度顯示折衷補回 header 右上「.draft-chip」小膠囊（saving 橘 / saved 綠 / restored 藍），約 32x100px 不擾畫面，使用者仍能看到「草稿暫存中… / 已暫存 14:32 / 已還原草稿」狀態。SCSS .draft-status 大卡片保留刪除，未復原。',
  },
  66: {
    status: '已修正',
    date: '2026-05-19',
    note: '2026-05-19 完成 fire-and-forget PUT 同步 + successWithLink toast。2026-05-25 補：frontendSync.ts 改 async 回 Promise<SyncResult>，writeAll 內部仍 fire-and-forget 但結果記入 lastSyncPromise；useDynamicPages export waitForLastSync；AddEditView.onSave 改 async 在 insert/update 後 await 結果，失敗顯示 9 秒橘 toast「已寫入後台，但同步前台失敗：xxx，請確認 dev server 已啟動」，解掉「儲存成功但前台 404」假成功問題。',
  },
  63: {
    status: '已修正',
    date: '2026-05-19',
    note: '2026-05-19 完成預覽區寬度 / 字斷 / 斷點細化基本版。2026-05-25 補：(1) layout.preview-open 斷點 1440px→1600px 涵蓋一般筆電 1366-1500 視窗下預覽開啟時 edit-pane 仍會被擠的場景；(2) basic-grid > * 移除 overflow-wrap:anywhere（中文逐字斷直書元凶），input-title 加 white-space:nowrap；(3) SectionList builder-shell 斷點 1200→1440 + canvas-head 加 flex-wrap + panel-title nowrap；(4) drop zone 浮現式設計（拖拽中才撐高 56px 橘虛線，hover 變實心橘 + 「↧ 放開插入到這裡」）；(5) SectionEditor 拖把手從 ⋮⋮ 換 6 點 SVG grip + 動態 draggable 避免擋表單輸入 + 收合 toolbar 整條可拖。',
  },
};

const UIUX_MARKS = {
  181: {
    status: '部分修正',
    date: TODAY,
    note: '2026-04-13 部分修正 dev/staging 設定。2026-05-25 補最後一處：PreviewPane.vue line 66-68 FRONTEND_URL 原寫死 http://localhost:3000，改讀 import.meta.env.VITE_FRONTEND_BASE（其他檔案如 AddEditView / DataListView / SectionEditor / frontendSync 都已用 env var，這個漏網）。後續正式部署只需設 VITE_FRONTEND_BASE=https://prod.example.com。',
  },
};

const wb = XLSX.readFile(file, { cellStyles: true });

function updateSheet(sheetName, marks) {
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error(`Worksheet not found: ${sheetName}`);
  const range = XLSX.utils.decode_range(ws['!ref']);
  const updated = [];

  for (let r = 2; r <= range.e.r; r += 1) {
    const id = Number(ws[XLSX.utils.encode_cell({ r, c: 0 })]?.v);
    if (!marks[id]) continue;
    const m = marks[id];
    ws[XLSX.utils.encode_cell({ r, c: 13 })] = {
      ...(ws[XLSX.utils.encode_cell({ r, c: 13 })] || {}),
      v: m.status,
      t: 's',
    };
    ws[XLSX.utils.encode_cell({ r, c: 14 })] = {
      ...(ws[XLSX.utils.encode_cell({ r, c: 14 })] || {}),
      v: m.date,
      t: 's',
    };
    ws[XLSX.utils.encode_cell({ r, c: 15 })] = {
      ...(ws[XLSX.utils.encode_cell({ r, c: 15 })] || {}),
      v: m.note,
      t: 's',
    };
    updated.push(id);
  }

  const missing = Object.keys(marks).map(Number).filter((id) => !updated.includes(id));
  if (missing.length) throw new Error(`[${sheetName}] Missing IDs: ${missing.join(', ')}`);

  return { sheetName, updated };
}

const results = [
  updateSheet('後臺優化', BACKEND_MARKS),
  updateSheet('UIUX問題追蹤清單', UIUX_MARKS),
];

XLSX.writeFile(wb, file);

for (const { sheetName, updated } of results) {
  console.log(`[${sheetName}] Updated IDs: ${updated.join(', ')}`);
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils
    .sheet_to_json(ws, { header: 1, defval: '' })
    .slice(2)
    .filter((row) => row[0]);
  console.log(`  總計 ${rows.length}：已修正 ${rows.filter((r) => r[13] === '已修正').length} / 部分修正 ${rows.filter((r) => r[13] === '部分修正').length} / 待處理 ${rows.filter((r) => r[13] === '待處理').length}`);
}

console.log('\nDone. 記得跑：node scripts/compact-xlsx-theme.mjs');
