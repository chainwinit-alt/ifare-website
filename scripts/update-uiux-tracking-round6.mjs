// Round 6 (2026-05-04) — 後臺優化 加 16 個人性化主軸項目 (#39-#54)
//   + Q 欄「主軸」加入 schema (5 主軸: 看得懂 / 找得到 / 做得快 / 不容易錯 / 出事能追回來)
//   + 為 #1-#38 既有項目補上主軸 mapping
// UIUX問題追蹤清單 sheet 不動
// Run: node scripts/update-uiux-tracking-round6.mjs

import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const COLS_17 = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q'];

function writeRow17(ws, row, data) {
  COLS_17.forEach((col, i) => {
    const val = data[i] ?? '';
    ws[`${col}${row}`] = { t: typeof val === 'number' ? 'n' : 's', v: val };
  });
}

function setCell(ws, addr, val) {
  ws[addr] = { t: typeof val === 'number' ? 'n' : 's', v: val };
}

function expandRangeToQ(ws, lastRow) {
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  const newRange = {
    s: { r: range.s.r, c: 0 },
    e: { r: Math.max(range.e.r, lastRow), c: 16 },  // Q = col 16
  };
  ws['!ref'] = XLSX.utils.encode_range(newRange);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(__dirname, '..', 'docs', 'iFare_問題追蹤與AI維運規劃.xlsx');

const wb = XLSX.readFile(FILE, { cellStyles: true });
const wsBackend = wb.Sheets['後臺優化'];

// ============================================================
// 1. 加 Q 欄 header「主軸」
// ============================================================
setCell(wsBackend, 'Q2', '主軸');

// ============================================================
// 2. #1-#38 既有項目補 Q 欄主軸 mapping
// ============================================================
const existingMapping = {
  // Row → 主軸 (對應 #編號 = Row - 2)
  3: '看得懂',           // #1 CRUD 統一
  4: '不容易錯',         // #2 表單驗證
  5: '做得快',           // #3 表格分頁/搜尋
  6: '不容易錯',         // #4 上傳驗證
  7: '不容易錯',         // #5 確認 dialog
  8: '找得到',           // #6 全域搜尋
  9: '看得懂',           // #7 訊息通知
  10: '—',               // #8 baseURL env var
  11: '出事能追回來',    // #9 token 生命週期
  12: '看得懂',          // #10 設計規範
  13: '做得快',          // #11 圖片管理
  14: '出事能追回來',    // #12 結構文件
  15: '—',               // #13 News VideoUrl (功能)
  16: '—',               // #14 後台 baseURL (環境)
  17: '不容易錯',        // #15 News 驗證
  18: '—',               // #16 Visitor 404 (技術)
  19: '看得懂',          // #17 表格列寬
  20: '不容易錯',        // #18 表單驗證
  21: '看得懂',          // #19 儲存反饋
  22: '做得快',          // #20 搜尋重置
  23: '不容易錯',        // #21 刪除確認
  24: '不容易錯',        // #22 下拉預設值
  25: '不容易錯',        // #23 檔案驗證
  26: '看得懂',          // #24 Account read-only
  27: '看得懂',          // #25 空狀態
  28: '做得快',          // #26 日期快捷
  29: '看得懂',          // #27 欄位提示
  30: '做得快',          // #28 分頁 reset
  31: '找得到',          // #29 側邊欄高亮
  32: '找得到',          // #30 麵包屑
  33: '不容易錯',        // #31 API 錯誤
  34: '看得懂',          // #32 圖片預覽進度
  35: '找得到',          // #33 變更密碼入口
  36: '不容易錯',        // #34 代碼去重
  37: '看得懂',          // #35 狀態區分
  38: '不容易錯',        // #36 Caps Lock
  39: '看得懂',          // #37 編輯器 loading
  40: '看得懂',          // #38 NoPermission
};

for (const [row, axis] of Object.entries(existingMapping)) {
  setCell(wsBackend, `Q${row}`, axis);
}

// ============================================================
// 3. Round 6 新增 #39-#54 (rows 41-56)
// ============================================================
const round6Rows = [
  // ===== 看得懂 =====
  { id: 39, blk: '後台通用', sub: 'Dashboard / 角色化首頁', typ: '提升', cat: '設計', pri: '高',
    title: '角色化 Dashboard — 不同角色 (管理者 / 操作員 / 客服) 首頁不同',
    desc: '目前所有 user 進後台看到同一個首頁，但實際上：管理者要看整體 KPI 與系統健康；操作員要看待辦清單與快速建立入口；客服要看查詢工具與最近處理紀錄',
    fix: '依 user.role 動態切換 Dashboard 內容版面：(1) 管理者 → KPI 卡 + 異常告警 (2) 操作員 → 今日待辦 + 快速新增 (3) 客服 → 全站搜尋 + 最近 X 筆 query 紀錄。建立 Dashboard 設定文件',
    file: 'views/HomeView.vue / 新建 DashboardAdminView / DashboardOperatorView / DashboardCSView',
    detail: 'src/views/HomeView.vue\n新增 src/views/Dashboard/AdminView.vue / OperatorView.vue / CSView.vue\nsrc/router/index.ts (Home route 改判 role)',
    note: '對應使用者主軸「尊重不同角色」',
    axis: '看得懂' },
  { id: 40, blk: '後台通用', sub: 'Dashboard / 待辦清單', typ: '提升', cat: '設計', pri: '高',
    title: '「今日待辦」首頁區塊 — 一打開就看到該處理什麼',
    desc: '目前首頁無「需要我關注」的整合入口，使用者要進到各模組才知道有沒有東西。例如：未審核的文章、即將下架的政策、新增帳號待覆核',
    fix: 'Dashboard 加 .card-todo 區塊，aggregate 跨模組待處理項目 (待審 News / 即將下架 Policy / 待覆核 Account)，每項可直接點擊跳到該模組。需要新 API endpoint /Dashboard/GetMyTodos',
    file: 'views/HomeView 或 Dashboard 群組',
    detail: 'src/views/HomeView.vue\n後端新增 /Dashboard/GetMyTodos endpoint',
    note: '使用者明確要求「把今天要處理什麼放最前面」',
    axis: '看得懂' },
  { id: 41, blk: '後台通用', sub: 'Dashboard / 資訊組織', typ: '提升', cat: '設計', pri: '高',
    title: 'Dashboard 卡片化分區 — KPI / 異常 / 待審 / 待處理 各自獨立',
    desc: '若 Dashboard 把所有資訊堆在一起，使用者一打開資訊轟炸無從下手。需要明確分區、視覺層級、不同顏色強度',
    fix: 'Dashboard 分 4 區：(1) KPI 卡 (本月新增/啟用數，藍色) (2) 異常告警 (錯誤、過期，紅色) (3) 待審核 (橘色，可點即跳) (4) 待處理 (灰色，可點即跳)。每區可摺疊',
    file: 'views/Dashboard/* + components/Card*',
    detail: 'src/views/Dashboard/*.vue\nsrc/components/CardKPI.vue (新)\nsrc/components/CardAlert.vue (新)\nsrc/components/CardPending.vue (新)',
    note: '使用者明確要求「KPI、異常、待審核、待處理分開」、「不要一打開就資訊轟炸」',
    axis: '看得懂' },
  { id: 45, blk: '共用元件', sub: '欄位 / 標籤命名', typ: '提升', cat: '視覺', pri: '中',
    title: '欄位 / 標籤白話化規範 — 改掉系統術語',
    desc: '目前部分欄位用程式術語：「isEnabled」、「state_data」、「UpdateUserId」、「discontinuedTime」直接顯示給使用者；中文 label 也用「資料狀態」這種抽象名稱，新人需要猜',
    fix: '建立術語對照表：isEnabled → 啟用、discontinuedTime → 下架時間、UpdateUserId → 最後修改者、state_data → 啟用狀態。整理 docs/iFare_欄位術語對照.md，所有 view template 套用',
    file: '所有 views + 新增 docs/iFare_欄位術語對照.md',
    detail: '所有 src/views/*/AddEditView.vue + DataListView.vue\n新增 docs/iFare_欄位術語對照.md',
    note: '使用者明確要求「欄位名稱講人話，不要只寫系統術語」',
    axis: '看得懂' },
  { id: 49, blk: '共用元件', sub: '狀態流程視覺化', typ: '提升', cat: '視覺', pri: '中',
    title: '狀態流程視覺化 — 進度條 / step indicator 讓人知道現在卡在哪',
    desc: 'News / Policy 等內容有「草稿 → 待審 → 上架 → 下架」流程，但目前只用「啟用/停用」單一 boolean 表達，使用者無法快速看出資料目前位於哪階段',
    fix: '建立 CompStateFlow.vue 元件，吃 currentStage + stages 陣列，渲染水平 step indicator。News/Policy/Articles AddEditView 與 DetailView 都加上方狀態列',
    file: 'components/CompStateFlow.vue (新) + 多 AddEditView / DetailView',
    detail: '新增 src/components/CompStateFlow.vue\nsrc/views/News/News_AddEditView.vue + ItemDetailView.vue\nsrc/views/IFare/Policy/* (同)\nsrc/views/Articles/Welfare/* (同)',
    note: '使用者明確要求「狀態流程要明確，讓人知道現在卡在哪」',
    axis: '看得懂' },
  // ===== 找得到 =====
  { id: 44, blk: '後台通用', sub: '全域搜尋', typ: '提升', cat: '互動', pri: '中',
    title: '全域快速搜尋與跳轉 (Cmd+K 風格) — 補強 #6',
    desc: '#6 指出後台缺全域搜尋。具體做法：實作鍵盤快捷鍵 (Ctrl+K / Cmd+K) 開啟搜尋彈窗，可以模糊搜：(1) 模組名 (新增News) (2) 已有資料 (3) 帳號',
    fix: '用 Element Plus el-dialog + el-autocomplete 實作 GlobalSearch 元件；支援 fuzzy match (例如 fuse.js)；列出常用 action shortcut；ESC 關閉',
    file: 'components/GlobalSearch.vue (新) + App.vue 引入',
    detail: '新增 src/components/GlobalSearch.vue\nsrc/App.vue (引入 + 鍵盤監聽)\n新增 src/composables/useShortcuts.ts',
    note: '使用者明確要求「搜尋、篩選、排序不要藏太深」',
    axis: '找得到' },
  // ===== 做得快 =====
  { id: 42, blk: '共用元件', sub: '表格批次操作', typ: '提升', cat: '互動', pri: '高',
    title: '表格批次操作支援 — 多選 + 批次刪除 / 啟用 / 匯出',
    desc: 'CardTable 目前每筆資料只能個別點操作；要刪 50 筆要點 50 次。缺多選核取 + 批次工具列',
    fix: 'CardTable 加 :show-selection-column 顯示多選 checkbox；表格上方出現批次操作 bar (已選 N 筆 [批次刪除] [批次啟用] [批次匯出])。WebAPI.ts 加 BatchDelete/BatchUpdate 對應端點',
    file: 'components/CardTable.vue + plugins/WebAPI.ts',
    detail: 'src/components/CardTable.vue (加 selection column)\nsrc/components/CardBatchAction.vue (新)\nsrc/plugins/WebAPI.ts (BatchDelete / BatchUpdate)\n後端 .NET 對應 batch endpoints',
    note: '使用者明確要求「批次操作要明顯」',
    axis: '做得快' },
  { id: 43, blk: '共用元件', sub: '搜尋條件儲存', typ: '提升', cat: '互動', pri: '中',
    title: '儲存常用搜尋條件 — 命名 + 快速套用',
    desc: '使用者要查「最近一週新增的福利文章」每次都要重設條件；目前無記憶或儲存功能',
    fix: 'CardSearchParam 加「儲存此搜尋」按鈕，命名後存到 user.savedFilters (localStorage 或 backend)；加「快速套用」下拉選最近搜尋',
    file: 'components/CardSearchParam.vue + stores/user.ts',
    detail: 'src/components/CardSearchParam.vue\nsrc/stores/user.ts (savedFilters 欄位)\n後端可選 endpoint /Account/SaveFilter (跨裝置同步)',
    note: '使用者明確要求「常用條件可儲存」',
    axis: '做得快' },
  { id: 53, blk: '效能', sub: '大列表優化', typ: '提升', cat: '效能', pri: '高',
    title: '大列表 lazy load / 虛擬滾動 — 萬筆資料不卡',
    desc: '目前 CardTable 一次渲染所有 row，pageSize 100 已會卡；若資料數萬筆且使用者沒搜尋，瀏覽器會明顯停頓',
    fix: '(1) 強制最大 pageSize 限制 (建議 100) (2) 用 el-table 內建 virtual scroll (height + overflow) 或第三方 vue-virtual-scroller (3) 後端 API 強制 SkipCount/MaxResultCount，server-side 分頁',
    file: 'components/CardTable.vue + 各 DataListView',
    detail: 'src/components/CardTable.vue (加 virtual scroll)\nsrc/views/*/DataListView.vue\n後端 confirm pagination',
    note: '使用者明確要求「不卡、不等，就是最基本的人性化」、「大列表分頁、快取、延遲載入」',
    axis: '做得快' },
  { id: 54, blk: '共用元件', sub: '匯出 / 匯入進度', typ: '提升', cat: '互動', pri: '中',
    title: '匯入匯出進度提示 — 大檔不會以為當機',
    desc: '若使用者匯出整份 News/Policy 為 CSV 或匯入 100 筆 Account，目前無進度條或預估時間；按下後使用者只能等',
    fix: '建立 CompExportProgress 元件 (彈出 dialog 顯示 X% + ETA)；後端用 SignalR 或 polling endpoint 回報進度；完成後 toast 通知 + 下載連結',
    file: 'components/CompExportProgress.vue (新) + 各 DataListView',
    detail: '新增 src/components/CompExportProgress.vue\nsrc/views/*/DataListView.vue (匯出按鈕觸發)\n後端 .NET 加 Hub or polling endpoint',
    note: '使用者明確要求「匯出匯入要給進度與完成提示」',
    axis: '做得快' },
  // ===== 不容易錯 =====
  { id: 46, blk: '共用元件', sub: '危險操作預覽', typ: '提升', cat: '互動', pri: '高',
    title: '危險操作影響範圍預覽 — 「將影響 X 筆 / Y 個關聯」',
    desc: '刪除某一筆 Code (e.g., Domicile)，可能連動到 50 筆 Policy 失去戶籍地連結；目前無事前提示，按下「確認」後才知道副作用',
    fix: '危險操作前先呼叫 backend GetImpactCount API，DialogAlert 顯示「將影響 50 筆福利政策的戶籍地關聯，確定？」；危險操作清單：刪除 Code / 變更 Account 權限 / 變更 Policy 上下架',
    file: 'components/DialogAlert.vue + plugins/WebAPI.ts',
    detail: 'src/components/DialogAlert.vue (加 impact info 顯示)\nsrc/plugins/WebAPI.ts (各 GetImpactCount)\n後端 .NET 對應 endpoints',
    note: '使用者明確要求「危險操作前提醒影響範圍」',
    axis: '不容易錯' },
  { id: 47, blk: '共用元件', sub: '預設值規範', typ: '提升', cat: '互動', pri: '中',
    title: '合理預設值規範 — Radio / Select 預設選項、日期預設今天',
    desc: '新增 News 時 ReleaseTime / DiscontinuedTime 是空 (使用者要手動點開選日期)；新增 Account 時權限欄位無預設選項；多選欄位無預設常用組合',
    fix: '建立預設值規範文件，AddEditView 各欄位都應有合理預設：(1) 上架日期 = 今天 (2) 下架日期 = 今天 + 1 年 (3) 帳號權限 = 操作員 (4) 啟用狀態 = 啟用',
    file: '各 AddEditView + 新增 docs/iFare_預設值規範.md',
    detail: '所有 src/views/*/AddEditView.vue 的 ref 初始值\n新增 docs/iFare_預設值規範.md',
    note: '使用者明確要求「有預設值就給合理預設值」',
    axis: '不容易錯' },
  { id: 48, blk: '共用元件', sub: '錯誤訊息引導', typ: '提升', cat: '視覺', pri: '中',
    title: '錯誤訊息附下一步建議 — 不只說「失敗」，還說該怎麼辦',
    desc: '目前錯誤多是 "errMsg" 直接拋出 (e.g., "無法儲存")；使用者不知道是 (a) 必填漏 (b) 格式錯 (c) 後端問題；缺修復建議',
    fix: '錯誤訊息規範化：(1) 標題：說現象 (e.g., "無法儲存") (2) 描述：說原因 (e.g., "標題不可空") (3) 建議：說怎麼解 (e.g., "請補上「標題」欄位後再試一次")。可選加「複製錯誤碼回報 IT」按鈕',
    file: 'components/DialogAlert / Message + plugins/WebAPI 統一處理',
    detail: 'src/plugins/WebAPI.ts (錯誤格式包裝)\n各 SaveAction (改用結構化錯誤)\n新增 src/composables/useErrorMessage.ts',
    note: '使用者明確要求「不只是顯示錯誤，要告訴他下一步怎麼做」',
    axis: '不容易錯' },
  // ===== 出事能追回來 =====
  { id: 50, blk: '後台通用', sub: '操作紀錄 (audit log)', typ: '提升', cat: '維護性', pri: '高',
    title: '操作紀錄 (audit log) UI — 誰、何時、做了什麼',
    desc: '後台所有操作 (新增/編輯/刪除/權限變更) 目前無集中查詢介面；要知道「上週誰刪了某筆 News」沒辦法',
    fix: '新增 AuditLogView，列出所有後台操作 (時間 / user / action / target / 詳情 diff)。後端 .NET ABP 已有 AuditLog 機制，只需要做前端 UI 列表 + 篩選 (時間範圍 / user / action type)',
    file: 'views/AuditLog/AuditLogView.vue (新) + 路由',
    detail: '新增 src/views/AuditLog/AuditLogView.vue\nsrc/router/index.ts (加 /AuditLog)\nWebAPI.ts (加 GetAuditLog)\n.NET 確認 ABP AuditLog 已開',
    note: '使用者明確要求「操作紀錄清楚」',
    axis: '出事能追回來' },
  { id: 51, blk: '共用元件', sub: '變更歷史 / 版本', typ: '提升', cat: '維護性', pri: '中',
    title: '重要變更歷史 (版本 / diff) — 文章、政策、設定可看歷史版本',
    desc: 'News / Policy / Articles 文章編輯後，原版本完全消失；若編錯想復原沒辦法；無法看「上週這篇文章原本長怎樣」',
    fix: 'AddEditView 加「版本歷史」按鈕，彈窗列出 N 個歷史版本 (時間 / user)，可預覽 + 一鍵還原。後端 .NET 需加 NewsHistory / PolicyHistory table 在 Update 時 snapshot',
    file: '各 AddEditView + 新增 DialogVersionHistory + 後端',
    detail: '所有重要 src/views/*/AddEditView.vue\n新增 src/components/DialogVersionHistory.vue\n後端 .NET News/Policy/Articles 加 *_History entity + Update 時 snapshot',
    note: '使用者明確要求「重要變更可追溯」',
    axis: '出事能追回來' },
  { id: 52, blk: '後台通用', sub: '軟刪除 + 復原', typ: '提升', cat: '維護性', pri: '高',
    title: '軟刪除 + 復原機制 — 30 天內可救回',
    desc: '目前刪除是 hard delete，誤刪後資料完全消失；後端 ABP 框架支援 ISoftDelete，但前端無「資源回收筒」UI',
    fix: '(1) 後端確認所有 Entity 改 ISoftDelete (改 IsDeleted flag) (2) 前端各模組加「已刪除資料」tab 列出 30 天內被刪除的 (3) 列表加「復原」按鈕。Cron job 30 天後 hard delete',
    file: '前後端整合 + 各 DataListView',
    detail: '後端 .NET Entity 改 ISoftDelete\n各 src/views/*/DataListView.vue 加 [已刪除] tab\n新增 src/views/Trash/TrashView.vue\n.NET cron job 處理 30 天後 hard delete',
    note: '使用者明確要求「能取消、返回、復原的地方盡量有」、「不要讓人一按就無法挽回」',
    axis: '出事能追回來' },
];

round6Rows.forEach((u, idx) => {
  const row = 41 + idx;  // start at row 41 (after row 40 #38)
  writeRow17(wsBackend, row, [
    u.id, 'V', u.blk, u.sub, u.typ, u.cat, u.pri, u.title,
    u.desc, u.fix, u.file, u.detail, u.note, '待處理', '', '', u.axis
  ]);
});

// ============================================================
// 4. 擴展 sheet range 到 Q 欄 + 最後 row
// ============================================================
expandRangeToQ(wsBackend, 41 + round6Rows.length - 1 - 1);

// ============================================================
// 5. 寫回
// ============================================================
XLSX.writeFile(wb, FILE);
console.log('✅ 已更新', FILE);
console.log('   後臺優化 新增 Round 6:', round6Rows.length, '個 (#39-#54)');
console.log('   #1-#38 既有項目補主軸:', Object.keys(existingMapping).length, '個');
console.log('   後臺優化 sheet schema: 16 欄 → 17 欄 (Q = 主軸)');
