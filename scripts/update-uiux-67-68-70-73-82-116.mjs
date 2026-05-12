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
    id: 67,
    status: '部分修正',
    verify:
      'assets/style/_design-tokens.scss 已建立 $radius-xs/sm/md/lg/xl/2xl/pill/circle/bg-* 9 個語意化變數並透過 styleIFare.scss 全站可用。',
    note:
      '為避免全站視覺差異風險，舊 code 既有數值（4/5/6/8/12/14/16/20/22/24/28/32/44/377/656/750/880/999px）未做 search/replace，留下批 design system audit 處理。新 code 直接用 $radius-* 變數。',
  },
  {
    id: 68,
    status: '部分修正',
    verify:
      '_design-tokens.scss 已加 $shadow-rest / card / hover / lift / cta / focus 6 個語意化變數，涵蓋既有的 11px 30px -8px / 8px 22px / 18px 36px / 24px 44px / focus ring 等 pattern。',
    note:
      '_shadow-color() helper 用 rgba(black) 通用，呼叫端可改用既有 $color-orange / $color-primary / $color-shadow。下批可逐檔替換並驗證視覺。',
  },
  {
    id: 70,
    status: '已修正',
    verify:
      'rwd/_rwd.scss 已新增 $MAX_WIDTH_TABLET: 768px 變數，與本日 chatbot 手機版 / 福利專欄 chip grid 等 RWD 改動的 768px 邊界對齊。',
    note:
      '舊有 $MAX_WIDTH_MOBILE (1024) / $STANDARD_WIDTH_PHONE (516) 維持原樣。後續若新 RWD 規則用 768，可改用變數避免硬寫。',
  },
  {
    id: 73,
    status: '部分修正',
    verify:
      'components/_appBody_ifare.scss .item-recipient 從 height:0 → height:auto 改為 opacity + transform: translateY + max-height + will-change 組合，主視覺走 GPU composite，max-height 僅作為塌縮 fallback；FAQ 既有 max-height transition 保持不變。',
    note:
      '只示範一個典型 case（受助對象篩選器）。全站其他 max-height/height transition（faq-info 等）保留，下批 audit 可逐一遷移為 grid-template-rows: 0fr↔1fr 新技術或 transform 方案。',
  },
  {
    id: 82,
    status: '已修正',
    verify:
      'Dev/Dev Code/iFare_Frontend/error.vue 新建：根據 statusCode (404/403/500/503) 顯示對應標題與引導文案，三顆 CTA (回首頁 clearError redirect、上一頁 history.back、看 iFare 福利好幫手 NuxtLink)；5xx 補客服電話；RWD 手機 viewport 下三顆 CTA 直排 + 字級縮放。',
    note:
      'Nuxt 3 約定的 root error.vue，自動覆蓋預設 @nuxt/ui-templates 的 error-404/500。useHead 套標題 + role=alert + aria-live 滿足 a11y。',
  },
  {
    id: 116,
    status: '已修正',
    verify:
      'components/CompPage.vue isHide 邏輯重寫：抽出 recomputeVisibleWindow() helper 依容器寬度 / WIDTH_PAGEITEM 計算可見視窗，把 currentPage 居中。PageClick / PageNext / PagePrev 統一呼叫；onMounted + watch(pageList) 也觸發初次計算。',
    note:
      '修正原 PagePrev 只 unhide 當前頁、其他被 PageNext 隱藏的 page 永遠拉不回的 bug。同時補 _elnPageContent.value?.offsetWidth 的 null guard 避免初次掛載 race condition。',
  },
];

for (const item of updates) {
  const row = findRowById(item.id);
  setCell(row, 12, item.verify);
  setCell(row, 13, item.status);
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
    v: '更新 #67/#68/#70/#73/#82/#116：第五批 — design tokens / 768 斷點 / 動畫 layout 重繪 / 404 error 頁 / CompPage isHide bug',
    t: 's',
  };
}

XLSX.writeFile(wb, file, { compression: true });

console.log('Updated #67, #68, #70, #73, #82, #116.');
console.log(counts);
