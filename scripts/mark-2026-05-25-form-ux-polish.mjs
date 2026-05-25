// 2026-05-25 — Round 14 第十一批：5 條快速 polish 收尾「新增頁面」主線
//
// 後臺優化 sheet：
//   #94 已修正（從部分修正提升）— 完成度檢查全部到位：
//     - 第一版 6 個檢查項 + progress bar
//     - B 強化：chip 點擊跳對應欄位 + advanced 自動展開
//     - B+ 強化：imageAlt / ctaLink chip 直接跳到第一個有缺的 section（含展開）
//     - O 配套：slug 衝突時自動建議 -2/-3 可用版本（不算 #94 範圍但同批做）
//     - P 配套：多錯誤儲存時自動滾到第一個錯誤欄位 + focus
//
// 本批附帶但未列入 xlsx 編號（commit 紀錄即可）：
//   O — slug 衝突自動建議 chip
//   P — onSave 失敗 scrollIntoView 第一個錯誤欄位
//   R — four-card / cta-card 達上限時 disabled 鈕加「最多 X 張」提示
//   T — DataList summary 加儲存空間 stat（顯示已用 MB + 進度條 + 三段警示色）
//
// Run: node scripts/mark-2026-05-25-form-ux-polish.mjs
// 跑完務必：node scripts/compact-xlsx-theme.mjs

import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.resolve(__dirname, '..', 'docs', 'iFare_UI_UX_問題追蹤清單.xlsx');

const TODAY = '2026-05-25';

const BACKEND_MARKS = {
  94: {
    status: '已修正',
    date: TODAY,
    note: '2026-05-25 三輪迭代全部完成：(1) 第一版 — AddEditView「完成度檢查」卡，6 個動態檢查項（title/slug/sections 必填紅；metaDescription/coverImage 建議橘；imageAlt/ctaLink 條件出現）+ progress bar + 整體狀態文字。(2) B — chip 變按鈕，點擊後 advanced 自動展開 + 平滑 scrollIntoView 對應欄位 + input focus。(3) B+ — imageAlt / ctaLink chip 直接跳到第一個有缺的 section（找出 form.sections 中第一個 imageSrc 有但 imageAlt 空的、或 ctaText 有但 ctaUrl 空的 section，掛 focusSectionId；SectionEditor 加 data-section-id 屬性；scrollToField 優先用 sectionId 命中後 element.click() 觸發展開）。同批配套：O slug 衝突自動建議可用替代版本（-2/-3，跳過已佔用的）；P 多錯誤 onSave 自動 scrollToField 第一個錯誤欄位。下一步若要：擴充欄位範圍（如 unpublishTime data-focus、區塊內部欄位 anchor）。',
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
