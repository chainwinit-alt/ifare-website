// Round 14 followup — append #67-#72 後台「資料分析」遺漏問題到後臺優化 sheet
//   來源：Emma 2026-05-18 要求盤點「後台的資料分析現在還有哪些問題」
//   既有條目：#62 GA4 儀表板正式版 (大局) / PoC #10 搜尋行為分析 (站內搜尋)
//   本次補：6 條具體功能缺口（匯出 / 對比 / drill-down / 自動判讀 / RWD / 轉換漏斗）
// Run: node scripts/update-uiux-tracking-round14-add-analysis.mjs

import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(__dirname, '..', 'docs', 'iFare_UI_UX_問題追蹤清單.xlsx');

const wb = XLSX.readFile(FILE, { cellStyles: true });
const ws = wb.Sheets['後臺優化'];
const range = XLSX.utils.decode_range(ws['!ref']);

// 防呆：先檢查 #67-#72 不存在
const existingIds = new Set();
for (let r = 2; r <= range.e.r; r++) {
  const cell = ws[XLSX.utils.encode_cell({ r, c: 0 })];
  if (typeof cell?.v === 'number') existingIds.add(cell.v);
}
const collision = [67, 68, 69, 70, 71, 72].filter((id) => existingIds.has(id));
if (collision.length > 0) {
  console.log(`⚠️  以下編號已存在，跳過：${collision.map((n) => `#${n}`).join(', ')}`);
  process.exit(0);
}

const entries = [
  {
    no: 67,
    cells: [
      67, 'V', '資料分析', '報表匯出', '提升', '互動', '中',
      '分析儀表板缺匯出報表功能 — 主管/董事會無法直接拿走 PDF/Excel',
      'Analysis_DashboardView 目前只能在後台線上看；主管 / 董事會月報需求只能截圖或自己重打 Excel；現有 6 張 chart + KPI 整頁狀態無法一鍵打包帶走',
      '頁首 btnsRight 加「下載 PDF」「下載 Excel」按鈕；後端產報表（PuppeteerSharp / OpenXML / 純前端 html2pdf + xlsx），含時間戳與篩選條件當頁眉',
      'src/views/Analysis/Analysis_DashboardView.vue + 新增 AnalysisExportAppService',
      'Dev/Dev Code/iFare_Backend/src/views/Analysis/Analysis_DashboardView.vue + Dev/Dev Code/iFare_Backend_API/...',
      '跟 #62 GA4 正式版分開 — 這是 mock data 階段就可以先做的 UI/UX 改善；純前端 html2pdf 可先做 PoC',
      '待處理', '',
      '建議第一版用前端 html2pdf 截 DOM 為 PDF，後端產 Excel；命名規則含篩選區間 例：iFare_GA4_2026-05-01_to_2026-05-18.pdf',
    ],
  },
  {
    no: 68,
    cells: [
      68, 'V', '資料分析', '對比模式', '提升', '互動', '中',
      '對比區間寫死「前一週期」，缺任意對比選擇（如本月 vs 去年同月）',
      'Analysis_DashboardView 內 currentSummary vs previousSummary 計算寫死「前一週期」，無法選自訂對比；主管常要的「本月 vs 去年同月」「本季 vs 上季」做不到；對比 strip 文案固定',
      'filter bar 加第二個 datepicker「對比區間」，預設仍前一週期但可改任意；加 toggle 切「同期 (Year-over-Year) / 前期 (Period-over-Period)」；comparisonRows 改吃對比 daterange 而非自動推',
      'src/views/Analysis/Analysis_DashboardView.vue',
      'Dev/Dev Code/iFare_Backend/src/views/Analysis/Analysis_DashboardView.vue (filter-bar 段 line 51-101 + comparisonRows computed line 294)',
      '純前端改動可先做，不依賴 GA4 正式串接；mock data 也能展示功能',
      '待處理', '',
      '注意：對比區間 + 主區間長度不一定相同（去年同月可能 28 vs 31 天），KPI 對比要 normalize',
    ],
  },
  {
    no: 69,
    cells: [
      69, 'V', '資料分析', 'drill-down 鑽取', '提升', '互動', '低',
      '缺 drill-down — 點圖表峰值無法看當天 / 該頁面細節',
      '流量趨勢看到某天峰值，無法點下去看「當天熱門頁/來源/裝置」；熱門內容看到某頁面，無法點看「該頁面 30 天趨勢/來源組成」；目前所有 chart 都是「靜態 read-only」',
      'apexcharts chart click event → 開啟 el-drawer 顯示該維度細節；含對應日期/頁面的子報表（trend / source / device 縮小版）',
      'src/views/Analysis/Analysis_DashboardView.vue + 新增 components/AnalyticsDetailDrawer.vue',
      'Dev/Dev Code/iFare_Backend/src/views/Analysis/Analysis_DashboardView.vue (chart options 段 + dataPointSelection event)',
      '依賴 GA4 正式資料才有意義；mock 階段可先做 UI 框架但點下去不會有真實數據',
      '待處理', '',
      '優先級低 — 對主管/董事會非剛性需求；對深度分析使用者（行銷/編輯）才有強需求',
    ],
  },
  {
    no: 70,
    cells: [
      70, 'V', '資料分析', '自動判讀', '修復', '內容', '中',
      '「判讀重點」區塊 mock 寫死，不會跟 filter / 區間變化',
      'Analysis_DashboardView 第 177-191 行「判讀重點」listview「把圖表翻成可讀的營運訊號」目前是寫死陣列，切換 filter / 區間時內容不會更新；對使用者誤導 — 看起來是智慧分析但實際是裝飾',
      '第一版用規則式：偵測「sessions 跌 >20%」「top page 新進榜 / 跌出」「device 比例突變」自動產文字提示；進階版用 Gemini API 餵當期 summary 產自然語言摘要',
      'src/views/Analysis/Analysis_DashboardView.vue + 後端 LLM 整合（可選）',
      'Dev/Dev Code/iFare_Backend/src/views/Analysis/Analysis_DashboardView.vue (insight-list 段 line 184-191)',
      '第一階段純前端規則式即可，後端 LLM 是 v2；要呼應 #62 GA4 正式版 — 沒真資料前規則式也是 mock',
      '待處理', '',
      '至少在沒做之前明確標示「示範用判讀」避免誤以為是真的分析結果',
    ],
  },
  {
    no: 71,
    cells: [
      71, 'V', '資料分析', 'RWD', '修復', 'RWD', '中',
      '分析儀表板 RWD 不完整 — 6 個 chart + filter bar 桌機優先，手機/平板擠崩',
      'analytics-grid 含 6 張 chart card，桌機 2 欄；平板 (~768-1024) chart 寬度被擠縮 apexchart 容易破版；手機 (<768) 完全擠崩；filter bar 三組 filter (preset / 區間 / 年份) 並排在手機也擠',
      '參考前一輪 PageManagement RWD 改造模式：grid 子項目加 min-width:0 + word-break；斷點細化 ≤1024 切單欄 / ≤768 filter bar 垂直堆疊；hero-status-grid 同樣補 RWD',
      'src/views/Analysis/Analysis_DashboardView.vue',
      'Dev/Dev Code/iFare_Backend/src/views/Analysis/Analysis_DashboardView.vue (analytics-grid / filter-bar / hero-status-grid 段 + style scoped)',
      '可借用 #63 (PageManagement 編輯頁 RWD) 已驗證的斷點與技巧；本次只動 CSS，不動 chart 設定',
      '待處理', '',
      'apexcharts 對寬度變化是 reactive 的，CSS 改動後 chart 會自動 redraw 不需手動觸發',
    ],
  },
  {
    no: 72,
    cells: [
      72, 'V', '資料分析', '轉換漏斗', '提升', '數據', '中',
      '缺轉換漏斗報表 — 訪客 → 政策瀏覽 → 聯絡基金會的核心 KPI',
      '基金會核心 KPI 是「使用者是否真的找到福利並聯絡」，目前 dashboard 只顯示 Sessions / Active Users / Conversions 等通用 GA4 指標，缺自家業務漏斗；無法回答「100 個訪客有幾人最終聯絡基金會？」',
      '定義漏斗階段：首頁 / → /ifare/result 搜尋 → /ifare/info 詳情 → /ifare/contact 聯絡 / 公益夥伴連結；前台補對應 GA4 event；後端聚合 funnel API；前端 funnel chart (apexcharts 有 funnel type)',
      '前台 GA4 event 埋點 + src/views/Analysis/Analysis_DashboardView.vue + 後端 Ga4FunnelAppService',
      'Dev/Dev Code/iFare_Frontend/ (前台埋點) + Dev/Dev Code/iFare_Backend/src/views/Analysis/ + Dev/Dev Code/iFare_Backend_API/...',
      '依賴 #62 GA4 正式串接 + 前台 events 埋點齊全；先盤點前台已有哪些 event 才能定義漏斗',
      '待處理', '',
      '對基金會董事會 / 補助申請來源報告最有價值；建議在 #62 完成後馬上接著做',
    ],
  },
];

const startRow = range.e.r + 1;
let r = startRow;
for (const entry of entries) {
  for (let c = 0; c < entry.cells.length; c++) {
    const v = entry.cells[c];
    const t = typeof v === 'number' ? 'n' : 's';
    ws[XLSX.utils.encode_cell({ r, c })] = { t, v };
  }
  r += 1;
}

ws['!ref'] = XLSX.utils.encode_range({
  s: range.s,
  e: { r: r - 1, c: Math.max(range.e.c, 15) },
});

XLSX.writeFile(wb, FILE);

console.log(`✅ 後臺優化 sheet append 完成 — +${entries.length} 條 (#${entries[0].no}-#${entries.at(-1).no})`);
console.log('  ' + entries.map((e) => `#${e.no} ${e.cells[3]}`).join('\n  '));
console.log('提醒：跑 node scripts/compact-xlsx-theme.mjs 壓掉 theme1.xml 膨脹');
