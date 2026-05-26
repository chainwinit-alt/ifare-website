// Updates docs/iFare_問題追蹤與AI維運規劃.xlsx for Round 4 (2026-05-04 切回 master 開新分支 session):
//  UIUX 工作表 — 新增 8 個 issue (#98-#105)
//  後臺優化 工作表 — 新增 4 個 issue (#13-#16)
//  統計摘要 — 重算 UIUX 數量
// Run from repo root: `node scripts/update-uiux-tracking-round4.mjs`

import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FILL_FIXED = { patternType: 'solid', fgColor: { rgb: 'C6EFCE' } };
const FONT_FIXED = { color: { rgb: '006100' } };
const FILL_PARTIAL = { patternType: 'solid', fgColor: { rgb: 'FFEB9C' } };
const FONT_PARTIAL = { color: { rgb: '9C5700' } };
const COLS_ALL = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];

function paintRow(ws, row, fill, font) {
  for (const col of COLS_ALL) {
    const addr = `${col}${row}`;
    if (!ws[addr]) ws[addr] = { t: 's', v: '' };
    ws[addr].s = { ...(ws[addr].s || {}), fill, font, alignment: { vertical: 'center', wrapText: true } };
  }
}

function writeRow(ws, row, data) {
  COLS_ALL.forEach((col, i) => {
    const addr = `${col}${row}`;
    const val = data[i] ?? '';
    ws[addr] = { t: typeof val === 'number' ? 'n' : 's', v: val };
  });
}

function expandRange(ws, lastRow) {
  const ref = ws['!ref'] || 'A1';
  const range = XLSX.utils.decode_range(ref);
  if (lastRow > range.e.r) {
    range.e.r = lastRow;
    ws['!ref'] = XLSX.utils.encode_range(range);
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const FILE = path.join(REPO_ROOT, 'docs', 'iFare_問題追蹤與AI維運規劃.xlsx');
const TODAY = '2026-05-04';

const wb = XLSX.readFile(FILE, { cellStyles: true });
const wsUiux = wb.Sheets['UIUX問題追蹤清單'];
const wsBackend = wb.Sheets['後臺優化'];
const wsStat = wb.Sheets['統計摘要'];

// ============================================================
// Round 4 UIUX 新增 (rows 100-107, issues #98-#105, 0-indexed = 99-106)
// ============================================================
const uiuxNewRows = [
  {
    row: 100,
    status: '已修正',
    data: [
      98,
      'V',
      '關於長穩',
      '三大核心介紹',
      '修復',
      '互動',
      '中',
      'About 第一張卡 hover 完全無反應 (Round 3 副作用)',
      'cf47cfa Round 3 加的 .section-about-member::before 視覺裝飾 (z-index:48 + 1497x1497px 圓形 + top:-300px/left:-750px) 蓋住上方 about-how 區左半邊，攔截「環境保育」第一張 morph 卡的所有 hover/click events。第二、三張位置在中右側未被覆蓋，因此正常運作。',
      '裝飾性 ::before 加 pointer-events: none 讓 mouse events 穿透到下層的 .how-content',
      'pages/about.vue',
      'iFare_Frontend/assets/style/components/_appBody_about.scss',
      '修復 cf47cfa 副作用；不影響原視覺 (radial-gradient 橘色光暈仍可見)',
      '已修正',
      TODAY,
      '純 1 行 CSS 修法 (.section-about-member::before pointer-events: none)',
    ],
  },
  {
    row: 101,
    status: '已修正',
    data: [
      99,
      'V',
      '共用元件',
      'AppFooter',
      '修復',
      '視覺',
      '低',
      'Footer 聯絡資訊 label 文字重複 (新舊 CSS 共存 bug)',
      '5dfbf91/cf47cfa 把 AppFooter.vue 改用顯式 <span class="footer-info-label"> 顯示 label，但舊的 _font.scss `.footer-info-items [name="tel"]::before { content: "聯絡電話" }` 等 4 條規則沒清掉，造成「聯絡電話 📞 聯絡電話 (02)2797-8383」這種重複顯示',
      '移除 _font.scss 4 個 ::before content 規則 (tel/mail/address/datetime) 與通用 [name]::before 樣式',
      'assets/style/_font.scss',
      'iFare_Frontend/assets/style/_font.scss',
      '回歸測試 OK；保留 [name="tel"] font-family/color 與 [name="datetime"] span:nth-child Roboto 樣式',
      '已修正',
      TODAY,
      '5dfbf91 整理時的 leftover',
    ],
  },
  {
    row: 102,
    status: '已修正',
    data: [
      100,
      'V',
      '全站通用',
      '',
      '提升',
      '互動',
      '中',
      '缺乏全站一致的 hover 靈動回饋',
      '既有 hover 散落在 .relation-item / .article-item / .card-* 等個別元件，nav 連結、Footer 按鈕、btn-icon 等沒有統一浮起回饋；使用者「鼠標移到哪都該有靈動」需求未滿足',
      '_main.scss 加 .hover-lift utility class (Apple spring 0.22s + translateY -2px) + 自動套用到 .app-header nav / .app-footer .btn / .app-footer a / .btn-social / .btn-icon。既有自訂 hover (about morph 卡、news 浮起卡) 不受影響',
      'assets/style/_main.scss',
      'iFare_Frontend/assets/style/_main.scss',
      'cubic-bezier(0.32, 0.72, 0, 1) 與 about morph 卡同套 easing',
      '已修正',
      TODAY,
      '對應 #62 (.btn-filter/.btn-tag hover) 不重疊 — Round 4 涵蓋的是 nav/footer 類；ifare 搜尋按鈕的 ripple 仍待補',
    ],
  },
  {
    row: 103,
    status: '已修正',
    data: [
      101,
      'V',
      '共用元件',
      'AppHeader',
      '提升',
      '內容',
      '中',
      '缺少「未來規劃」頁面入口',
      '主管要求增加「未來規劃」展示基金會願景，nav 應有對應入口',
      'AppHeader 桌面 nav 在 公益夥伴 與 i-Fare 之間插入「未來規劃」連結；行動 nav 加在最後 (與既有 i-Fare/公益夥伴 mobile 順序一致)；新增 pages/future.vue 標題 + FUTURE shadow + 「內容建置中，敬請期待」佔位',
      'components/AppHeader.vue + pages/future.vue (新)',
      'iFare_Frontend/components/AppHeader.vue\r\niFare_Frontend/pages/future.vue (新)',
      'route /future 已 wire；之後接 CMS 內容由 admin 管理',
      '已修正',
      TODAY,
      '頁面為佔位，等內容/設計稿確認後再填內',
    ],
  },
  {
    row: 104,
    status: '部分修正',
    data: [
      102,
      'V',
      '最新消息',
      '文章詳情',
      '提升',
      '內容',
      '中',
      'News 詳情頁缺乏多媒體展示能力',
      '主管希望最新消息可內嵌 YouTube 影片，目前只有 HTML 編輯器內可手動貼連結，無內嵌影片渲染',
      '後台 admin 加「影片網址」el-input + WebAPI.ts InsertNews/UpdateNews 加 videoUrl 參數；前台 news/info.vue 加 iframe section + YouTube URL → embed URL parser (regex 抓 11 字元 video ID) + 16:9 響應式容器 (padding-top: 56.25%)',
      'pages/news/info.vue + News_AddEditView.vue (admin) + WebAPI.ts (admin)',
      'iFare_Frontend/pages/news/info.vue\r\niFare_Backend/src/views/News/News_AddEditView.vue\r\niFare_Backend/src/plugins/WebAPI.ts',
      'UI 端 wiring 完成；對應後臺優化 #13 (.NET News VideoUrl 欄位)',
      '部分修正',
      TODAY,
      '等 .NET 後端 News.cs entity + DTO + EF migration 加 VideoUrl 才能真實運作',
    ],
  },
  {
    row: 105,
    status: '已修正',
    data: [
      103,
      'V',
      '全站通用',
      '',
      '修復',
      '程式碼',
      '高',
      '本機開發 API 連線失敗 (環境設定指本機 .NET，但機器沒 .NET SDK)',
      '前台 nuxt.config.ts devProxy target 寫死 https://localhost:44312 / 後台 AjaxRef.ts baseURL prod 寫死 http://10.200.0.39 (公司內網 IP)，導致：(1) 本機 dev 抓 dropdown 全 404 (2) 後台 admin Login 失敗 (家用網路 reach 不到 10.200.0.39 內網 IP)',
      '前台 nuxt.config.ts devProxy target 改 https://www.i-fare.org.tw/ifare_api/api/services/app；後台 AjaxRef.getBaseUrl() 改 https://www.i-fare.org.tw/ifare_bdapi (固定走正式)',
      'nuxt.config.ts (前台) + AjaxRef.ts (後台)',
      'iFare_Frontend/nuxt.config.ts\r\niFare_Backend/src/plugins/AjaxRef.ts',
      'Login 已驗證可通；前台 dropdown 已能抓資料',
      '已修正',
      TODAY,
      '對應後臺優化 #8 / #14 (baseURL 環境變數化) — 目前是治標處理，等之後完整改成 .env',
    ],
  },
  {
    row: 106,
    status: '已修正',
    data: [
      104,
      'V',
      '全站通用',
      '',
      '修復',
      '程式碼',
      '低',
      'VS Code 顯示 3 個 TypeScript deprecation warning',
      'iFare_Backend/tsconfig.app.json 用 baseUrl + moduleResolution=node10 / iFare_Frontend/tsconfig.json 透過 .nuxt/tsconfig.json extend 也帶 node10，被 TypeScript 5.x 標 deprecated (TS 7.0 才停用)',
      '加 "ignoreDeprecations": "6.0" — 後台直接放 tsconfig.app.json compilerOptions；前台改透過 nuxt.config.ts typescript.tsConfig.compilerOptions 注入 .nuxt/tsconfig.json (因為 user-facing tsconfig.json 加 ignoreDeprecations 抑制不到 extend 的 .nuxt/tsconfig.json)',
      'tsconfig.app.json + tsconfig.json + nuxt.config.ts',
      'iFare_Backend/tsconfig.app.json\r\niFare_Frontend/tsconfig.json\r\niFare_Frontend/nuxt.config.ts',
      'TS 5.x 不影響執行 / build',
      '已修正',
      TODAY,
      '純 IDE 觀感修補；VS Code 需 Ctrl+Shift+P → Restart TS Server 才會 reload',
    ],
  },
  {
    row: 107,
    status: '已修正',
    data: [
      105,
      'V',
      '全站通用',
      '',
      '修復',
      '程式碼',
      '高',
      '主管手動合併 master 時漏合 5dfbf91/cf47cfa 部分改動',
      '切到 master 開 feat/uiux-round4 新分支後抽樣驗證發現：5dfbf91 漏合的 footer 樣式 (LINE 綠/FB 藍 SVG icon、_appFooter.scss 重新設計、_animation.scss page transition、_rwd_appFooter.scss、Mail/Clock SVG)；cf47cfa 整個沒合 (About 靈動島 + News 卡片升級 + 社群外連結) — 9 個檔',
      '從 frontend 分支 git show 補回 16 個檔到新分支對應路徑 (Dev/Dev Code/iFare_Frontend/...)；cf47cfa 9 檔以 d5a7674 commit；footer 7 檔以 e2b1cae commit',
      '16 個 SCSS / Vue / SVG',
      'Dev/Dev Code/iFare_Frontend/assets/style/components/_appFooter.scss\r\niFare_Frontend/assets/style/_animation.scss\r\niFare_Frontend/components/AppFooter.vue 等 16 檔',
      '修補 release 環境必要',
      '已修正',
      TODAY,
      '不是純 UI/UX 議題，但屬於 Round 1-3 work 真正落地的前提',
    ],
  },
];

for (const u of uiuxNewRows) {
  writeRow(wsUiux, u.row, u.data);
  if (u.status === '已修正') {
    paintRow(wsUiux, u.row, FILL_FIXED, FONT_FIXED);
  } else if (u.status === '部分修正') {
    paintRow(wsUiux, u.row, FILL_PARTIAL, FONT_PARTIAL);
  }
}
expandRange(wsUiux, uiuxNewRows[uiuxNewRows.length - 1].row - 1);

// ============================================================
// 後臺優化 新增 (rows 15-18, issues #13-#16)
// ============================================================
const backendNewRows = [
  {
    row: 15,
    data: [
      13,
      'V',
      '後台通用',
      'News',
      '提升',
      '資料',
      '中',
      'News table 缺 VideoUrl 欄位 (前台已上 iframe 渲染 wiring)',
      '前台 news/info.vue 已加 iframe section 與 YouTube URL parser (Round 4 #102)，後台 admin News_AddEditView.vue 已加「影片網址」input + WebAPI.ts 簽章已帶 videoUrl，但 .NET API/DB schema 仍無對應欄位 — admin 存了會被 .NET 丟掉、前台 GetNewsDetail response 也不會有 videoUrl',
      'News.cs entity 加 public string VideoUrl + NewsInputDataDto/NewsResultDto/NewsInputData/NewsResult value model 各加 VideoUrl + NewsTaskManager Insert/Update/Get 處理 + EF migration AddVideoUrlToNews，建議 nullable 容錯。同步在 iFare_Frontend_API 補 GetNewsDetail Result 含 VideoUrl',
      'iFare_Backend_API/src/IFare_BDAPI.Core/Model/IFare/News.cs',
      'iFare_Backend_API/src/IFare_BDAPI.Core/Model/IFare/News.cs\r\niFare_Backend_API/src/IFare_BDAPI.Application/News/Dto/NewsInputDataDto.cs\r\niFare_Backend_API/src/IFare_BDAPI.Application/News/Dto/NewsResultDto.cs\r\niFare_Backend_API/src/IFare_BDAPI.Core/TaskManager/News/ValueModel/NewsInputData.cs\r\niFare_Backend_API/src/IFare_BDAPI.Core/TaskManager/News/ValueModel/NewsResult.cs\r\niFare_Backend_API/src/IFare_BDAPI.Core/TaskManager/News/NewsTaskManager.cs\r\nEF migration: AddVideoUrlToNews',
      '對應前台 #102 (Round 4)',
      '待處理',
      '',
      '需後端工程師處理；至少 6 .cs + 1 EF migration',
    ],
  },
  {
    row: 16,
    data: [
      14,
      'V',
      '後台通用',
      'API 呼叫層',
      '修復',
      '程式碼',
      '中',
      '後台 baseURL 暫時硬寫正式 URL (補強 #8 環境變數化議題)',
      'Round 4 為了讓本機開發能 reach 後台 API，AjaxRef.getBaseUrl() 暫時改成寫死 https://www.i-fare.org.tw/ifare_bdapi。原本 dev/prod 切換邏輯 (localhost:44311 / 內網 10.200.0.39) 已不堪用；當前所有人不論本機 / staging / prod 都打同一個 URL',
      '改用 import.meta.env.VITE_API_BASE_URL；新增 .env.development (指 localhost) / .env.production (指 prod) / .env.example 範本；vite.config.ts 確認 base URL 注入；AjaxRef.getBaseUrl() 直接讀 env',
      'src/plugins/AjaxRef.ts',
      'iFare_Backend/src/plugins/AjaxRef.ts\r\niFare_Backend/.env.development (新)\r\niFare_Backend/.env.production (新)\r\niFare_Backend/.env.example (新)\r\niFare_Backend/vite.config.ts (確認)',
      '同 #8 主訴；Round 4 是治標',
      '待處理',
      '',
      '前台 nuxt.config.ts devProxy 也是同樣狀況 — 但 Nuxt 已有 runtimeConfig 機制，可直接搭 NUXT_FRONTEND_API_SERVER_BASE 環境變數',
    ],
  },
  {
    row: 17,
    data: [
      15,
      'V',
      '後台通用',
      'News',
      '修復',
      '互動',
      '低',
      'News SaveAction 表單驗證不完整',
      'News_AddEditView.vue SaveAction() 只驗證 title 不可空，影片網址 / 上下架日期 / 內容 detail 都沒驗證。Round 4 加 videoUrl input 後若使用者貼非 YouTube URL，前台 iframe parser 會回傳空字串靜默失敗',
      '加客戶端驗證：(1) videoUrl 非空時驗證符合 YouTube URL 格式 (regex) (2) 上架日期不可晚於下架日期 (3) detail 不可全空白。失敗時 ElMessage warning 顯示',
      'src/views/News/News_AddEditView.vue',
      'iFare_Backend/src/views/News/News_AddEditView.vue',
      '前端先擋 invalid 輸入，避免送 API 才發現',
      '待處理',
      '',
      '同類問題可能在 ArticlesWelfare / FarePolicy 各 AddEdit 也有 — 可一起做',
    ],
  },
  {
    row: 18,
    data: [
      16,
      'V',
      '前台通用',
      'Visitor',
      '修復',
      '程式碼',
      '中',
      'Visitor SetVisitorRecord 端點 prod 404 (前台一直噴錯)',
      'Round 4 切去正式 API 後，前台 dev server 持續噴 [WebAPI][POST] /Visitor/SetVisitorRecord statusCode: 404 — 看起來這個訪客追蹤端點在正式環境不存在 (或路徑改了)，每次首頁載入都打但都失敗',
      '(1) 確認正式環境是否真有 SetVisitorRecord 路由 — 看 iFare_Frontend_API/src/IFare_API.Web.Host/Startup 註冊狀況 (2) 若無，後端新增 endpoint，或前台拿掉呼叫 (3) URL query 異常 ?router=/api/services/app/Visitor/SetVisitorRecord 看起來是 proxy 行為怪',
      'iFare_Frontend/plugins/WebAPI.ts (前台)',
      '需確認 iFare_Frontend_API/src/IFare_API.Application/Visitor/* 是否實作\r\n或前台 plugins/WebAPI.ts 拿掉 SetVisitorRecord 呼叫',
      '正式 API 回 404 但不影響其他功能',
      '待處理',
      '',
      '低/中 priority，不是 blocker，但 console 噪音影響 debug 體驗',
    ],
  },
];

for (const u of backendNewRows) {
  writeRow(wsBackend, u.row, u.data);
}
expandRange(wsBackend, backendNewRows[backendNewRows.length - 1].row - 1);

// ============================================================
// 統計摘要 — 重算 UIUX 數量
// ============================================================
// 數 N 欄 (col 13) 的 status
const statusCount = { 待處理: 0, 部分修正: 0, 已修正: 0 };
const refRange = XLSX.utils.decode_range(wsUiux['!ref']);
for (let r = 2; r <= refRange.e.r; r++) {
  const cell = wsUiux[XLSX.utils.encode_cell({ r, c: 13 })];
  const v = cell?.v;
  if (v === '已修正' || v === '部分修正' || v === '待處理') {
    statusCount[v]++;
  }
}
const total = statusCount.待處理 + statusCount.部分修正 + statusCount.已修正;

console.log('UIUX 統計:', statusCount, '/ 共', total, '個');

// 統計摘要 sheet 結構 (從前面 dump 看到):
// Row 14-18 是 「狀態統計」區塊
// 找對應列更新
const statRange = XLSX.utils.decode_range(wsStat['!ref'] || 'A1');
for (let r = 0; r <= statRange.e.r; r++) {
  const cell = wsStat[XLSX.utils.encode_cell({ r, c: 0 })];
  const v = String(cell?.v ?? '');
  if (v === '已修正' || v === '部分修正' || v === '待處理') {
    const count = statusCount[v];
    wsStat[XLSX.utils.encode_cell({ r, c: 1 })] = { t: 'n', v: count };
    wsStat[XLSX.utils.encode_cell({ r, c: 2 })] = { t: 's', v: total > 0 ? `${(count / total * 100).toFixed(1)}%` : '0%' };
  }
}

// ============================================================
// 寫回
// ============================================================
XLSX.writeFile(wb, FILE);
console.log('✅ 已更新', FILE);
console.log('   Round 4 UIUX 新增', uiuxNewRows.length, '個 issue (#98-#105)');
console.log('   後臺優化 新增', backendNewRows.length, '個 issue (#13-#16)');
