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
const trackingSheetName = wb.SheetNames.find((name) => name.includes('UIUX')) || wb.SheetNames[2];
const summarySheetName = wb.SheetNames[wb.SheetNames.length - 1];
const ws = wb.Sheets[trackingSheetName];
const summary = wb.Sheets[summarySheetName];

if (!ws) {
  throw new Error('Tracking worksheet not found.');
}

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
    if (Number(ws[cell(r, 0)]?.v) === id) {
      return r;
    }
  }

  throw new Error(`Issue #${id} not found.`);
};

const updates = [
  {
    id: 2,
    verify:
      'ifare.vue 已把 isVisibleRecipient 預設改為 false，使用者選擇受助情境後才透過 CSS transition 淡入展開受助者年齡區間，原本動畫無感的問題已修正。',
    note:
      '靠 .item-recipient.visible 既有 opacity / height 動畫，預設隱藏 + 選擇情境後切 true，符合漸進式揭露 UX。',
  },
  {
    id: 11,
    verify:
      'ifare/info.vue 洽辦單位區塊拆成三段明確互動：撥電話 <a href="tel:">、跳洽辦單位 <button @click="JumpTo"> 帶 aria-label，外層 <div @click> 已移除，<label> 改 <span> 避免誤用表單元素。',
    note:
      '同時把整塊 cursor-pointer 拿掉，避免使用者誤點觸發雙動作；電話按鈕補上「撥打電話 {號碼}」aria-label。',
  },
  {
    id: 12,
    verify:
      'ifare/info.vue 補上 Facebook、Email、複製連結三種分享通道；新增 composables/useShareUrl.ts 提供 SSR-safe 的 getCurrentUrl / copyCurrentUrl / shareCurrentUrlToFacebook / shareCurrentUrlToEmail，沿用 useShareToLine 的 useRequestURL + import.meta.client pattern。',
    note:
      '複製連結成功後顯示「✓ 已複製」2 秒 toast；FB 用 sharer.php popup 並偵測被瀏覽器擋下；Email 用 mailto 帶 subject/body。RWD 手機把 .share-bar 改 static 避免 4 顆 absolute 跑版。',
  },
  {
    id: 13,
    verify:
      '_rwd_ifare.scss 已把 contact 頁手機版改成 chip 水平滑動列表（與桌面 .part-areas 一致），原本 .part-filter 下拉選單在手機隱藏，整站「桌面列表 / 手機下拉」雙呈現的不一致問題已修正。',
    note:
      '.area-list 在手機切換 flex-direction:row + overflow-x:auto + 自訂 scrollbar；.area-item 改 pill 樣式 (radius 999 + 淡色背景)；保留 jumpTo 錨點切換邏輯不變。',
  },
  {
    id: 86,
    verify:
      'ifare/result.vue 搜尋空狀態改寫：加入 .empty-illustration 圓形 ic-search 圖示、引導文案「試試放寬篩選條件、調整關鍵字，或看看所有福利政策」、兩顆 CTA（修改搜尋條件 → scrollIntoView 到 .section-filter / 看全部福利 → ResetParam）。',
    note:
      '_appBodyChild_ifare.scss 新增 .result-empty 規則：覆寫 .result-loading 的 spinner ::before、改 column flex、CTA 按鈕 min-width 140 + flex-wrap，確保手機也能整齊顯示。',
  },
  {
    id: 87,
    verify:
      'ifare.vue FAQ 區塊鍵盤操作早已具備（role=button + tabindex=0 + @keydown.enter/.space + aria-expanded + aria-controls），本次加強 :focus-visible 樣式：outline 2px solid rgba($color-primary-dark, .7) + outline-offset 4px + 6px 淡色 box-shadow，對比度從 .35 拉到 .7 符合 WCAG。',
    note:
      'outline 跟 box-shadow 並用，讓鍵盤聚焦時即使在不同背景色都明顯可見，並保留 active hover 的 .faq-logo orange 變化。',
  },
];

for (const item of updates) {
  const row = findRowById(item.id);
  setCell(row, 12, item.verify);
  setCell(row, 13, '已修正');
  setCell(row, 14, today);
  setCell(row, 15, item.note);
}

const rows = XLSX.utils
  .sheet_to_json(ws, { header: 1, defval: '' })
  .slice(2)
  .filter((row) => row[0]);

const counts = {
  total: rows.length,
  fixed: rows.filter((row) => row[13] === '已修正').length,
  partial: rows.filter((row) => row[13] === '部分修正').length,
  pending: rows.filter((row) => row[13] === '待處理' || row[13] === '未修正').length,
};

if (summary) {
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
    v: '更新 #2/#11/#12/#13/#86/#87：第四批 i-Fare 收尾（受助篩選動畫、洽辦互動拆分、多通道分享、contact RWD 統一、result 空狀態 CTA、FAQ focus-visible 強化）',
    t: 's',
  };
}

XLSX.writeFile(wb, file, { compression: true });

console.log('Updated #2, #11, #12, #13, #86, #87.');
console.log(counts);
