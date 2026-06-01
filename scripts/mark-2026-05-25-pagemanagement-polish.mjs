// 2026-05-25 — Round 14 第十批：後台新增頁面 polish 衝刺
//
// 後臺優化 sheet：
//   #94 部分修正 — 加備註：B 完成度 chip 點擊跳欄位（advanced 自動展開）
//   #95 已修正 — ImagePicker 媒體庫（library / 上傳 / 貼網址 三 tab）取代手打圖片網址
//   #96 已修正 — LinkPicker 站內連結選擇器（動態頁 / 站內固定頁 / 外部 URL 三 tab）取代手打 ctaUrl
//   #97 已修正 — 發布前 checklist modal（只在 status=published 且有 warn 才攔）
//   #98 部分修正 — 欄位白話化首批：URL Slug → 頁面網址、OG Image → 社群分享圖；其他術語未動
//
// 同批附帶但未列入 xlsx 編號的補強（記錄於相關行備註）：
//   S — 匯入 JSON 加 version 包裝 + diff confirm 列出會覆蓋的頁
//   M — 列表頁加搜尋/狀態篩選/排序/分頁
//   N — 刪除復原 toast（8 秒內可救回）
//
// Run: node scripts/mark-2026-05-25-pagemanagement-polish.mjs
// 跑完務必：node scripts/compact-xlsx-theme.mjs

import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.resolve(__dirname, '..', 'docs', 'iFare_問題追蹤與AI維運規劃.xlsx');

const TODAY = '2026-05-25';

const BACKEND_MARKS = {
  94: {
    status: '部分修正',
    date: TODAY,
    note: '2026-05-25 第一版：AddEditView「完成度檢查」卡 — 6 個動態檢查項（title/slug/sections 必填紅；metaDescription/coverImage 建議橘；imageAlt/ctaLink 條件出現）+ progress bar。2026-05-25 同日強化（B）：每個 chip 變按鈕，點擊後自動展開「進階設定」+ 平滑 scrollIntoView 對應欄位 + focus 游標（focusTarget 對應 data-focus 屬性 — title/slug/sections/meta/cover）。下一步可補：點 imageAlt/ctaLink chip 跳到第一個有缺的 section（目前只滾到 sections 卡）。',
  },
  95: {
    status: '已修正',
    date: TODAY,
    note: '2026-05-25：建立共用 ImagePicker.vue（src/components/PageBuilder/）— 3 個 tab：(1) 🖼️ 媒體庫 grid 顯示已上傳 dynamic-assets，含縮圖 / 檔名 / 大小 / 時間；(2) ⬆️ 上傳新圖片，拖放或點擊上傳，自動 POST /api/dynamic-assets；(3) 🔗 貼網址（驗 https?://）。Nuxt 端新增 GET /api/dynamic-assets 端點（server/api/dynamic-assets.get.ts）列出資料夾內檔案。AddEditView 封面圖 + 社群分享圖 + SectionEditor 圖文區塊 imageSrc 三處全部換成 ImagePicker。',
  },
  96: {
    status: '已修正',
    date: TODAY,
    note: '2026-05-25：建立共用 LinkPicker.vue — 3 個 tab：(1) 📄 後台動態頁列表（從 useDynamicPages.pages 自動取，可搜尋，顯示 slug + 狀態 tag）；(2) 🏠 站內固定頁（7 個：/、/about、/news、/collaborator、/ifare、/contact、/future）；(3) 🌐 外部連結（驗 https?://）。SectionEditor 圖文 ctaUrl + 雙欄 CTA cards[*].ctaUrl 兩處全部換成 LinkPicker。開啟時自動偵測現值切到對應 tab。',
  },
  97: {
    status: '已修正',
    date: TODAY,
    note: '2026-05-25：AddEditView.onSave 在 validation 通過、進入 saving 前加 checklist modal — 只在 form.status === "published" 且 completenessWarnCount > 0 時觸發。Modal 用 ElMessageBox.confirm + dangerouslyUseHTMLString 列出所有 warn chips（如 SEO 描述太短 / 缺封面 / 缺圖 alt / CTA 缺連結），confirmButton「我知道，繼續發布」、cancelButton「返回修改」。必填沒過會被 validatePage 提前擋；草稿模式不會彈；全綠也不彈。',
  },
  98: {
    status: '部分修正',
    date: TODAY,
    note: '2026-05-25 首批：(1) AddEditView slug 欄位 label「URL Slug」→「頁面網址」；(2) DataList 表格欄「URL Slug」→「頁面網址」；(3) AddEditView 進階「分享圖（OG Image）」→「社群分享圖」placeholder 補一句「也叫 OG image」；(4) useDynamicPages.validatePage 三條 slug 相關錯誤訊息「URL Slug ...」→「頁面網址 ...」；(5) AddEditView.getSlugValidationMessage 兩條同步改。其他術語（isEnabled / state_data / UpdateUserId / discontinuedTime / meta description）尚未動，跨模組（News/Policy/Account）需另外盤點與設計討論。',
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

const results = [updateSheet('後臺優化', BACKEND_MARKS)];

XLSX.writeFile(wb, file);

for (const { sheetName, updated } of results) {
  console.log(`[${sheetName}] Updated IDs: ${updated.join(', ')}`);
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils
    .sheet_to_json(ws, { header: 1, defval: '' })
    .slice(2)
    .filter((row) => row[0]);
  console.log(
    `  總計 ${rows.length}：已修正 ${rows.filter((r) => r[13] === '已修正').length} / 部分修正 ${rows.filter((r) => r[13] === '部分修正').length} / 待處理 ${rows.filter((r) => r[13] === '待處理').length}`,
  );
}

console.log('\nDone. 記得跑：node scripts/compact-xlsx-theme.mjs');
