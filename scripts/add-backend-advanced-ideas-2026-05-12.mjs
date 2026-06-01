// 2026-05-12 — 依使用者需求補充後台進階功能建議到「後臺優化」sheet
// 重點：把值得規劃的高價值後台能力寫進 Excel，供後續排程與修正追蹤使用。
// Run: node scripts/add-backend-advanced-ideas-2026-05-12.mjs

import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(__dirname, '..', 'docs', 'iFare_問題追蹤與AI維運規劃.xlsx');
const SHEET = '後臺優化';
const COLS_17 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q'];
const SOURCE_NOTE = '來源：2026-05-12 使用者要求補充後台進階功能建議；由 Codex 依現有後台 / API 架構提出。';

function setCell(ws, row, col, value) {
  ws[XLSX.utils.encode_cell({ r: row, c: col })] = {
    t: typeof value === 'number' ? 'n' : 's',
    v: value,
  };
}

function writeRow(ws, row, values) {
  COLS_17.forEach((_, index) => {
    setCell(ws, row, index, values[index] ?? '');
  });
}

function ensureRangeToQ(ws, lastRow) {
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  ws['!ref'] = XLSX.utils.encode_range({
    s: { r: range.s.r, c: 0 },
    e: { r: Math.max(range.e.r, lastRow), c: 16 },
  });
}

const wb = XLSX.readFile(FILE, { cellStyles: true });
const ws = wb.Sheets[SHEET];
if (!ws) {
  throw new Error(`Sheet not found: ${SHEET}`);
}

setCell(ws, 1, 16, '主軸'); // Q2

const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
const existingIds = new Set();
for (let r = 2; r <= range.e.r; r++) {
  const id = ws[XLSX.utils.encode_cell({ r, c: 0 })]?.v;
  if (id !== undefined && id !== null && String(id).trim() !== '') {
    existingIds.add(Number(id));
  }
}

const ideas = [
  {
    id: 62,
    area: '資料分析',
    sub: 'GA4 儀表板整合',
    type: '提升',
    category: '數據',
    priority: '高',
    title: 'GA4 分析儀表板正式版 — 背景同步快取，不直接即時打外部 API',
    desc: '目前後台分析頁已可先做 mock dashboard，但正式版若每次開頁都直接打 GA4 API，會造成頁面慢、多人重複查詢、外部配額消耗與正式環境不穩定。',
    fix: '建立 GA4 Data API 同步架構：排程每 30 或 60 分鐘抓 KPI / 趨勢 / 熱門頁面 / 來源 / 裝置，先寫入本地快取資料表，後台只讀快取並顯示最後同步時間。',
    file: 'Analysis_DashboardView / VisitorAppService / 新增 Ga4AppService',
    detail: 'Dev/Dev Code/iFare_Backend/src/views/Analysis/Analysis_DashboardView.vue\nDev/Dev Code/iFare_Backend_API/src/IFare_BDAPI.Application/Visitor/VisitorAppService.cs\n新增 IFare_BDAPI.Application/Ga4/Ga4AppService.cs\n新增 IFare_BDAPI.Core/TaskManager/Ga4/*\n新增 GA4 cache tables',
    note: `${SOURCE_NOTE} 建議採「背景排程同步 + DB 快取 + 後台讀快取」模式，避免伺服器與 GA4 quota 壓力。`,
    axis: '看得懂',
  },
  {
    id: 55,
    area: '後台通用',
    sub: '排程 / 任務中心',
    type: '提升',
    category: '維護性',
    priority: '高',
    title: '同步與排程任務中心 — 匯入 / 匯出 / GA4 / 發布排程都可看狀態',
    desc: '未來若加入 GA4 同步、定時發布、批次匯入匯出，管理者需要知道「現在有什麼任務正在跑」「哪個失敗」「上次成功是什麼時候」，否則一出錯很難追。',
    fix: '新增 JobCenter / TaskCenter 頁面，列出任務名稱、觸發方式、開始時間、結束時間、執行結果、錯誤訊息與重跑按鈕。可先涵蓋 GA4 sync、匯入匯出、排程發布三類任務。',
    file: '新建 JobCenterView + 後端 JobLog API',
    detail: '新增 src/views/JobCenter/JobCenterView.vue\nsrc/router/index.ts\nsrc/plugins/WebAPI.ts\n新增 IFare_BDAPI.Application/JobCenter/*\n新增 job_log table',
    note: `${SOURCE_NOTE} 這是把「背景工作」從黑盒子變成可觀察、可追查。`,
    axis: '出事能追回來',
  },
  {
    id: 56,
    area: '共用元件',
    sub: '編輯保護',
    type: '提升',
    category: '互動',
    priority: '高',
    title: '自動儲存草稿 + 離開提醒 + 多人編輯鎖定',
    desc: '大型表單如 PageManagement、News、Policy 若編到一半斷線、誤關頁面或兩個人同時改同一筆資料，目前容易丟資料，且後台使用者通常不會每一步都手動存檔。',
    fix: 'AddEditView 共用層加入三件事：(1) autosave draft (2) route leave / tab close unsaved changes 警示 (3) record editing lock 或至少 optimistic concurrency 版本檢查。',
    file: '各 AddEditView + PageManagement + 後端版本欄位',
    detail: 'src/views/*/AddEditView.vue\nsrc/views/PageManagement/PageManagement_AddEditView.vue\n新增 src/composables/useDraftGuard.ts\n後端 entity 加 RowVersion / UpdateToken',
    note: `${SOURCE_NOTE} 這項對內容型後台的實際保護價值很高，優先級應高。`,
    axis: '出事能追回來',
  },
  {
    id: 57,
    area: '後台通用',
    sub: '發布排程',
    type: '提升',
    category: '效率',
    priority: '高',
    title: '定時上架 / 下架排程中心 — 不要靠人工守時間',
    desc: '若消息、文章、活動頁或政策需在指定時間上架 / 下架，目前若只能靠人工操作，容易漏掉時間點，尤其跨日晚間、週末或活動檔期時風險更高。',
    fix: '建立發布排程中心：內容可設定 publishAt / unpublishAt；後端排程自動切換狀態；後台可看到即將上架 / 即將下架清單，並支援取消排程。',
    file: 'News / Articles / Policy AddEdit + 後端排程',
    detail: 'src/views/News/News_AddEditView.vue\nsrc/views/Articles/Welfare/ArticlesWelfare_AddEditView.vue\nsrc/views/IFare/Policy/IFarePolicy_AddEditView.vue\n新增 publish_schedule table\n新增排程 worker',
    note: `${SOURCE_NOTE} 這是典型能降低人工操作錯誤的後台能力。`,
    axis: '做得快',
  },
  {
    id: 58,
    area: '後台通用',
    sub: '審核工作流',
    type: '提升',
    category: '流程',
    priority: '中',
    title: '審稿指派與 SLA 提醒 — 誰負責審、卡多久一眼可見',
    desc: '目前即使有草稿 / 待審概念，也缺「指派給誰」「多久沒處理」「快到 SLA 了沒」這層管理資訊，容易造成內容卡在中間但沒人知道是誰手上。',
    fix: '在待審資料加入 assignee、assignedAt、dueAt、overdue flag；首頁待辦與通知中心一起顯示。支援重新指派與逾時提醒。',
    file: 'Dashboard / 待辦 / 後端審核欄位',
    detail: 'src/views/Dashboard/*.vue\nsrc/views/News/*\nsrc/views/Articles/Welfare/*\n新增 review assignment 欄位與 API',
    note: `${SOURCE_NOTE} 這比單純「待審」多了責任歸屬與時效管理。`,
    axis: '找得到',
  },
  {
    id: 59,
    area: '內容品質',
    sub: '健康檢查中心',
    type: '提升',
    category: '品質',
    priority: '中',
    title: '內容健康檢查中心 — 一次掃出缺圖、缺 SEO、失效連結、未填欄位',
    desc: '內容後台常見問題不是功能壞掉，而是資料品質不一致，例如沒封面圖、沒 meta、URL 錯、外連失效、欄位缺漏。這些問題不會在儲存當下全部發現，但會影響前台品質。',
    fix: '建立內容健康檢查頁，定期掃描 News / Articles / Pages，列出缺漏項並可直接跳到對應編輯頁修復。第一版可先檢查：封面圖、摘要、SEO title、SEO description、外連格式、發布狀態異常。',
    file: '新建 ContentHealthView + 掃描 API',
    detail: '新增 src/views/ContentHealth/ContentHealthView.vue\nsrc/router/index.ts\n新增 IFare_BDAPI.Application/ContentHealth/*\n後端批次檢查 service',
    note: `${SOURCE_NOTE} 這類功能對內容營運很實用，且能和 Dashboard 今日待辦整合。`,
    axis: '不容易錯',
  },
  {
    id: 60,
    area: '後台通用',
    sub: '通知中心',
    type: '提升',
    category: '互動',
    priority: '中',
    title: '通知中心 (Bell) — 待審、同步失敗、匯入完成、即將下架集中顯示',
    desc: '目前重要事件多半只能靠使用者自己進模組檢查，缺少集中通知入口。像 GA4 sync 失敗、匯入完成、內容待審、內容即將下架，都應主動提醒而不是被動發現。',
    fix: 'AppHeader 增加 Bell 通知中心，至少先支援 4 類：待審提醒、同步失敗、匯入匯出結果、即將上架 / 下架。通知可點擊直達對應頁面，並支援已讀 / 未讀。',
    file: 'AppHeader + 通知 API',
    detail: 'src/components/AppHeader.vue\n新增 src/components/AppNotificationCenter.vue\n新增 notification table / API / read status',
    note: `${SOURCE_NOTE} 這是把散落在各模組的事件集中回到同一個入口。`,
    axis: '找得到',
  },
  {
    id: 61,
    area: '圖片管理',
    sub: '資產治理',
    type: '提升',
    category: '維護性',
    priority: '中',
    title: '媒體資產治理中心 — 找出未引用圖片、重複檔案、超大檔與過期素材',
    desc: '圖片管理不只要能上傳，更要能管理。若後台長期累積未引用圖片、重複圖、超大圖與已下架內容殘留素材，之後會讓資產庫越來越亂，內容編輯也更難找資料。',
    fix: '圖片管理增加治理視圖：顯示未引用素材、重複檔名 / hash、過大檔案、最近 N 天未使用資產、可疑過期素材。可加批次標記、下載報表、清理建議。',
    file: 'ImgManager + 後端檔案關聯掃描',
    detail: 'src/views/ImgManager/ImgManager_DataListView.vue\n新增 src/views/ImgManager/ImgManager_GovernanceView.vue\n後端增加資產引用掃描 service',
    note: `${SOURCE_NOTE} 這是圖片庫從「檔案倉庫」升級為「可治理資產中心」。`,
    axis: '做得快',
  },
];

let nextRow = range.e.r + 1;
const addedIds = [];

for (const idea of ideas) {
  if (existingIds.has(idea.id)) {
    continue;
  }

  writeRow(ws, nextRow, [
    idea.id,
    'V',
    idea.area,
    idea.sub,
    idea.type,
    idea.category,
    idea.priority,
    idea.title,
    idea.desc,
    idea.fix,
    idea.file,
    idea.detail,
    idea.note,
    '待處理',
    '',
    '',
    idea.axis,
  ]);

  addedIds.push(idea.id);
  nextRow++;
}

ensureRangeToQ(ws, Math.max(range.e.r, nextRow - 1));
XLSX.writeFile(wb, FILE);

console.log(`✅ 已更新 ${FILE}`);
if (addedIds.length === 0) {
  console.log('   無新增：這批建議 ID 已存在');
} else {
  console.log(`   新增後臺優化建議 ${addedIds.length} 項：${addedIds.map((id) => `#${id}`).join(', ')}`);
  console.log(`   寫入 rows ${range.e.r + 2}-${nextRow}`);
}
