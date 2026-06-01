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
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
const existingIds = new Set(rows.slice(2).map((row) => Number(row[0])).filter(Boolean));

const issues = [
  [
    145,
    'V',
    '全站通用',
    'API 錯誤處理',
    '修復',
    '穩定性',
    '高',
    'API 失敗時多數頁面直接取 res.result.result，可能白畫面',
    'WebAPI.ts 逾時或網路錯誤會 return null，但多數頁面仍直接讀取 res.result.result；API timeout、資料不存在或 errCode 異常時容易拋錯，造成頁面無內容或 SSR hydration 問題。',
    '建立共用 API response parser，統一處理 success/result/errCode/null；各頁補 loading、empty、error、retry 狀態，避免直接存取深層欄位。',
    'plugins/WebAPI.ts pages/index.vue pages/articles.vue pages/articles/lazy.vue pages/articles/welfare.vue pages/collaborator.vue pages/ifare.vue pages/ifare/result.vue pages/news/info.vue',
    'Dev/Dev Code/iFare_Frontend/plugins/WebAPI.ts\r\nDev/Dev Code/iFare_Frontend/pages/**/*.vue',
    '已用 rg 驗證多處仍直接使用 res.result.result；news.vue 有局部防護，但其他頁尚未一致。',
    '待處理',
    '',
    '',
  ],
  [
    146,
    'V',
    '全站通用',
    'SEO 設定',
    '修復',
    'SEO',
    '高',
    '正式站 URL 設定混用 ifare.local、10.200.0.39 與正式網域',
    'runtimeConfig.public.siteUrl 預設為 http://ifare.local，site.url 預設為 http://10.200.0.39，API 註解與部署又指向 https://www.i-fare.org.tw。若正式環境未正確覆蓋，sitemap/canonical/分享 URL 可能產生測試或內網網址。',
    '統一正式預設為 https://www.i-fare.org.tw，並以 .env / IIS 環境變數覆蓋不同環境；同時檢查 sitemap、canonical、OG URL 與分享連結來源。',
    'nuxt.config.ts',
    'Dev/Dev Code/iFare_Frontend/nuxt.config.ts',
    'nuxt.config.ts 仍可看到 http://ifare.local 與 http://10.200.0.39 預設值。',
    '待處理',
    '',
    '',
  ],
  [
    147,
    'V',
    '全站通用',
    '內容詳情頁 SEO',
    '修復',
    'SEO',
    '高',
    '新聞、文章、政策詳情頁被 index:false 排除，可能無法被搜尋收錄',
    'routeRules 對 /news/info、/articles/welfare、/articles/lazy、/ifare/info、/ifare/result 等頁設 index:false。若這些內容頁是主要自然搜尋入口，noindex 會降低 SEO 價值。',
    '確認內容策略：若要收錄，改為可索引的動態路由（如 /news/:id、/articles/welfare/:id），補 canonical、title、description、OG 與動態 sitemap。',
    'nuxt.config.ts pages/news/info.vue pages/articles/welfare.vue pages/articles/lazy.vue pages/ifare/info.vue',
    'Dev/Dev Code/iFare_Frontend/nuxt.config.ts\r\nDev/Dev Code/iFare_Frontend/pages/news/info.vue\r\nDev/Dev Code/iFare_Frontend/pages/articles/welfare.vue\r\nDev/Dev Code/iFare_Frontend/pages/articles/lazy.vue\r\nDev/Dev Code/iFare_Frontend/pages/ifare/info.vue',
    'nuxt.config.ts routeRules 目前對多個詳情頁設定 index:false。',
    '待處理',
    '',
    '',
  ],
  [
    148,
    'V',
    '首頁',
    'Hero 首屏效能',
    '修復',
    '效能',
    '高',
    '首頁 Hero 圖片過大，最大約 2.86MB，影響 LCP',
    '首頁首屏使用多張大型 PNG：Index-Img-2 約 2.86MB、Index-Img-3 約 1.81MB、Index-Img-0 約 1.23MB。即使 build 可過，也會拖慢首屏載入與行動網路體驗。',
    '轉 WebP/AVIF，產生桌機/手機尺寸；首屏只 preload 第一張關鍵圖，其餘延後載入或改 CSS animation 後載；檢查 LCP 圖片是否可用 <NuxtImg> 或 picture/srcset。',
    'pages/index.vue assets/img/Index-Img-*.png assets/style/',
    'Dev/Dev Code/iFare_Frontend/pages/index.vue\r\nDev/Dev Code/iFare_Frontend/assets/img/Index-Img-*.png\r\nDev/Dev Code/iFare_Frontend/assets/style/**/*.scss',
    'build 輸出與檔案大小排序皆顯示首頁圖片偏大。',
    '待處理',
    '',
    '',
  ],
  [
    149,
    'V',
    '全站通用',
    '訪客紀錄 middleware',
    '修復',
    '效能',
    '中',
    '全域 route middleware 每次換頁都呼叫訪客紀錄 API，可能重複記錄',
    'route.global.ts 每次路由切換都呼叫 /Visitor/SetVisitorRecord。Nuxt middleware 可能在 SSR 與 client navigation 觸發，且未 debounce 或排除預覽/錯誤頁，可能造成重複記錄與 API 負載。',
    '改成 client-only 後送，加入 debounce/節流與排除規則；必要時後端以 session/path/time window 去重。',
    'middleware/route.global.ts',
    'Dev/Dev Code/iFare_Frontend/middleware/route.global.ts',
    'route.global.ts 目前未檢查 import.meta.client，直接在 middleware 中呼叫 WebApiPost。',
    '待處理',
    '',
    '',
  ],
  [
    150,
    'V',
    'preview 頁',
    'postMessage 安全',
    '修復',
    '安全性',
    '中',
    'preview.vue 回傳 postMessage 使用 *，建議指定來源',
    'preview.vue 接收訊息已檢查 ALLOWED_ORIGINS，但 ready 訊息回傳 parent 時使用 postMessage(msg, \"*\")。若頁面被非預期來源嵌入，仍有訊息外洩或整合誤用風險。',
    '以 event origin 或 runtimeConfig 設定的後台 origin 作為 targetOrigin；正式環境補上允許來源清單，不只 localhost。',
    'pages/preview.vue',
    'Dev/Dev Code/iFare_Frontend/pages/preview.vue',
    'preview.vue line 附近可看到 ALLOWED_ORIGINS 與 window.parent.postMessage(msg, \"*\")。',
    '待處理',
    '',
    '',
  ],
  [
    151,
    'V',
    '追蹤文件',
    '統計摘要',
    '修復',
    '維護性',
    '中',
    '統計摘要與實際 UIUX 問題追蹤資料列數量不一致',
    '統計摘要顯示前台已修正 61、部分修正 7、待處理 74，但直接讀 UIUX問題追蹤清單資料列為已修正 62、部分修正 10、待處理 72。摘要可能未隨最新批次更新。',
    '重建統計摘要，或將摘要改成公式/腳本產生；每次新增或改狀態後自動同步統計。',
    'docs/iFare_問題追蹤與AI維運規劃.xlsx scripts/rebuild-stats-summary.mjs',
    'docs/iFare_問題追蹤與AI維運規劃.xlsx\r\nscripts/rebuild-stats-summary.mjs',
    '本次直接讀 workbook 發現摘要與資料列不一致。',
    '待處理',
    '',
    '',
  ],
];

const templateRowIndex = range.e.r;
const nextRowStart = range.e.r + 1;
let appended = 0;

for (const issue of issues) {
  if (existingIds.has(issue[0])) continue;
  const r = nextRowStart + appended;
  for (let c = 0; c < issue.length; c += 1) {
    const addr = XLSX.utils.encode_cell({ r, c });
    const templateAddr = XLSX.utils.encode_cell({ r: templateRowIndex, c });
    ws[addr] = {
      v: issue[c],
      t: typeof issue[c] === 'number' ? 'n' : 's',
      s: ws[templateAddr]?.s ? JSON.parse(JSON.stringify(ws[templateAddr].s)) : undefined,
    };
  }
  appended += 1;
}

if (appended > 0) {
  const newRange = {
    s: range.s,
    e: { r: range.e.r + appended, c: Math.max(range.e.c, 15) },
  };
  ws['!ref'] = XLSX.utils.encode_range(newRange);
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
  summary['G3'] = { ...(summary['G3'] || {}), v: '已同步最新前台追蹤清單，新增 #145-#151', t: 's' };
}

XLSX.writeFile(wb, file);
console.log(`Appended ${appended} rows.`);
console.log(counts);
