// 2026-05-05 — 聊天機器人 wireframe spec v1 — 拆 7 個 row 進 UIUX 表
// 來源：使用者 2026-05-05 提供 Chatbot Wireframe Spec v1（長穩基金會）
// 銜接 PoC研究 sheet #13 (聊天機器人 PoC 提案，已存在)
// Run: node scripts/add-uiux-136-142-chatbot.mjs

import XLSX from 'xlsx-js-style';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(__dirname, '..', 'docs', 'iFare_UI_UX_問題追蹤清單.xlsx');

const wb = XLSX.readFile(FILE, { cellStyles: true });
const ws = wb.Sheets['UIUX問題追蹤清單'];
const range = XLSX.utils.decode_range(ws['!ref']);

// 共用屬性（7 row 都套用）
const COMMON = {
  area: '全站通用',
  type: '提升',
  category: '互動',
  priority: '高',
  validateNote: 'PoC研究 sheet #13 衍生：使用者提供 Chatbot Wireframe Spec v1 (2026-05-05)。任務型互動引導助手，非陪聊。',
  status: '待處理',
};

// 7 個 row 內容
const rows = [
  {
    id: 136,
    sub: '聊天機器人 - 浮動入口按鈕',
    title: '聊天機器人浮動入口按鈕（收合狀態） — 右下角圓形按鈕',
    desc: '全站右下角浮動聊天按鈕，使用者點擊後展開機器人視窗。Hover 顯示 tooltip 提示「需要幫忙嗎？」。',
    suggest: '尺寸：56×56 px / 圓角：100% (圓形) / 陰影：soft shadow / 位置：右下角距邊 24px / 內容：可放 icon 或吉祥物頭像 / Hover tooltip：「需要幫忙嗎？」/ 行動裝置同樣位置（避免擋住底部主操作）',
    files: '新增 components/CompChatbotEntry.vue（或 layouts/default.vue 全站固定 mount）',
    notes: 'v1 先用 icon，吉祥物 Q 版設計另案 (PoC 0505 提案 3 個方向：繪本延伸 / 數位簡約 / 陪伴療癒)。',
  },
  {
    id: 137,
    sub: '聊天機器人 - Welcome 開場畫面',
    title: '聊天機器人 Welcome 開場畫面（首次展開）',
    desc: '使用者點開機器人後第一個看到的畫面。包含 Header / Welcome Block / Quick Actions / Suggestion Chips / Input Bar。',
    suggest: '結構：Header (左：頭像 + 名稱「長穩小幫手」/ 右：關閉按鈕，高度 56px) + Welcome Block (歡迎文案「哈囉，我是長穩基金會的小幫手 👋 我可以幫你找到需要的資訊」padding 16px 行高 1.5) + Quick Actions (2×2 grid，按鈕高度 40px，圓角 12px) + Suggestion Chips (膠囊型 padding 8x12，橫向 scroll) + Input Bar (高度 48px 固定底部) + 主選單 icon。',
    files: '新增 components/CompChatbotWelcome.vue',
    notes: 'Quick Actions 4 個按鈕內容待定（建議：常見問題 / 找福利政策 / 聯絡我們 / 線上資源）。Suggestion Chips 從熱門 query log 抽。',
  },
  {
    id: 138,
    sub: '聊天機器人 - Conversation 對話畫面',
    title: '聊天機器人 Conversation 對話畫面 — User / Bot 對話流',
    desc: '使用者送出第一句後進入此畫面。包含 User Bubble (右側) / Bot Bubble (左側) / CTA Buttons / Suggestion Chips。',
    suggest: '結構：User Bubble (靠右、淡色背景) + Bot Bubble (靠左、白底或深色背景) + CTA Buttons (primary + secondary，可 full width 或 inline) + Suggestion Chips (推薦延伸問題)。每個 Bot 回答必須有 CTA + Suggestion Chips（強制設計規範）。',
    files: '新增 components/CompChatbotConversation.vue + CompChatBubble.vue (User/Bot 變體)',
    notes: '對話狀態管理建議用 pinia store 或 composable (useChatbot)。訊息結構建議：{ role, content, ctaButtons[], suggestionChips[] }。',
  },
  {
    id: 139,
    sub: '聊天機器人 - Contact Card',
    title: '聊天機器人 Contact Card 聯絡卡片 — 導向真人客服',
    desc: '當使用者問題涉及複雜或機器人答不出時，回應內含此卡片，導向 LINE / 電話 / Email 等真人聯絡管道。',
    suggest: '卡片內容：基金會聯絡資訊（電話 02-2797-8383 / Email ifaretw@gmail.com / LINE 連結 https://lin.ee/eHw9VpL / 服務時間）+ CTA 按鈕（「加入 LINE 好友」「聯絡我們」「發 email」）。卡片視覺對齊整站 .card-partner 風格。',
    files: '新增 components/CompChatbotContactCard.vue',
    notes: '聯絡資訊源同 AppFooter，避免散落。建議抽 composables/useContactInfo.ts 統一管理。',
  },
  {
    id: 140,
    sub: '聊天機器人 - Fallback 錯誤處理',
    title: '聊天機器人 Fallback 錯誤處理 — 答不出時的引導文案',
    desc: '當機器人遇到無法理解 / 無資料 / 系統錯誤時的標準回應。確保使用者不會卡住或感到被拋下。',
    suggest: '文案規範：避免「我不知道」直接拋。範例：「這個問題我可能還不太會回答，你可以試試看用更具體的詞，或是直接 LINE 我們的客服 ❤️」。CTA 必含：「重新提問」+「LINE 聯絡我們」。Suggestion Chips 提示熱門問題。',
    files: 'components/CompChatbotConversation.vue 內整合 fallback 邏輯',
    notes: '需與後端 chat API 約定 errCode（如 9001 不理解 / 9002 系統錯誤），對應不同 fallback 文案。設計補充規範：「查不到一定要導向 LINE / 聯絡我們」。',
  },
  {
    id: 141,
    sub: '聊天機器人 - 元件庫',
    title: '聊天機器人 元件庫 — 5 個共用元件 (Button/Chip/Bubble/Card/InputBar)',
    desc: '聊天機器人視窗內使用的 5 個共用 UI 元件，需獨立設計與實作以利後續維護與重用。',
    suggest: '(1) Button — Primary（主色橘）/ Secondary（灰）/ Ghost（透明）三種變體。(2) Chip — 膠囊型，用於推薦問題與快速回覆，與 collaborator chip 同一視覺語言。(3) Chat Bubble — User（右、淡色）/ Bot（左、白底）兩種變體。(4) Card — 聯絡資訊卡 / 導頁卡。(5) Input Bar — 輸入框 + 送出按鈕，48px 高度。',
    files: '新增 components/Chatbot/ 資料夾，內含 Button.vue / Chip.vue / Bubble.vue / Card.vue / InputBar.vue',
    notes: 'Chip 與 collaborator 公益夥伴頁的 .chip 共用樣式，可考慮抽 components/CompChip.vue 全站共用。Bubble 與 Card 內可塞 v-html (記得用 useSanitize composable 防 XSS)。',
  },
  {
    id: 142,
    sub: '聊天機器人 - 尺寸規範 + 設計補充',
    title: '聊天機器人 整體尺寸規範 + 設計補充原則',
    desc: '機器人視窗整體尺寸與設計鐵則文件化。',
    suggest: 'Desktop 尺寸：寬 360-400px / 高 500-640px / 圓角 16px / 陰影中等。設計補充鐵則：(1) 保留「主選單」icon 隨時可返回首頁 (2) 每個 Bot 回答都要有 CTA (3) 每個 Bot 回答都要有 Suggestion Chips (4) 查不到的內容一定要導向 LINE 或 聯絡我們 (即 #139 Contact Card 或 #140 Fallback)。RWD 行動裝置改全螢幕或下半屏 sheet 模式。',
    files: 'components/Chatbot/ 各元件 scoped style；建議 layouts/default.vue 加 chatbot 容器固定定位',
    notes: '尺寸規範與整站設計系統 (#64-#66 色彩/字級/間距規範) 同步。陰影建議使用 box-shadow: 0 8px 24px rgba(0,0,0,0.12) 中等深度。',
  },
];

let nextRow = range.e.r + 1;
const startRow = nextRow + 1; // 1-indexed for log

for (const r of rows) {
  const cells = [
    { c: 0,  v: r.id, t: 'n' },
    { c: 1,  v: 'V', t: 's' },
    { c: 2,  v: COMMON.area, t: 's' },
    { c: 3,  v: r.sub, t: 's' },
    { c: 4,  v: COMMON.type, t: 's' },
    { c: 5,  v: COMMON.category, t: 's' },
    { c: 6,  v: COMMON.priority, t: 's' },
    { c: 7,  v: r.title, t: 's' },
    { c: 8,  v: r.desc, t: 's' },
    { c: 9,  v: r.suggest, t: 's' },
    { c: 10, v: r.files, t: 's' },
    { c: 11, v: r.files, t: 's' },
    { c: 12, v: COMMON.validateNote, t: 's' },
    { c: 13, v: COMMON.status, t: 's' },
    { c: 14, v: '', t: 's' },
    { c: 15, v: r.notes, t: 's' },
  ];
  for (const { c, v, t } of cells) {
    ws[XLSX.utils.encode_cell({ r: nextRow, c })] = { t, v };
  }
  console.log(`✅ #${r.id} ${r.sub} 加入 (row ${nextRow + 1})`);
  nextRow += 1;
}

ws['!ref'] = XLSX.utils.encode_range({
  s: range.s,
  e: { r: nextRow - 1, c: Math.max(range.e.c, 15) },
});

XLSX.writeFile(wb, FILE);
console.log('---');
console.log(`✅ 7 個聊天機器人 row 已加入 (rows ${startRow}-${nextRow})`);
console.log('   #136 浮動入口按鈕 / #137 Welcome / #138 Conversation / #139 Contact Card');
console.log('   #140 Fallback / #141 元件庫 / #142 尺寸規範 + 設計補充');
