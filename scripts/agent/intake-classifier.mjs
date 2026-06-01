/**
 * intake-classifier.mjs — rule-based classifier for free-form intake text.
 *
 * Pure functions. No LLM, no I/O. Used by /agent/intake to turn a user message
 * into a structured task card (category / priority / nextAction / needsApproval).
 */

const PRIORITY_RULES = [
  { priority: 'critical', pattern: /緊急|當機|壞掉|無法使用|critical|fatal|down/i },
  { priority: 'high', pattern: /重要|高優先|急著|急需|盡快|high\b|p1|p0/i },
  { priority: 'low', pattern: /不急|有空再|低優先|small|trivial|low\b|p3|p4/i },
];

const CATEGORY_RULES = [
  { category: 'report-ops', pattern: /報告|word|docx|產出|匯出|export|report\b/i },
  { category: 'backend-optimization', pattern: /後台|管理員|admin|backend|後端|api/i },
  { category: 'uiux', pattern: /ui|ux|畫面|介面|樣式|css|排版|按鈕|顏色|文案|loading|skeleton/i },
  { category: 'poc', pattern: /poc|實驗|研究|試做|spike|prototype/i },
];

const ACTION_RULES = [
  { action: 'verify', pattern: /驗收|verify|健康檢查|health\s*check|check\b/i },
  { action: 'dryRun', pattern: /預覽|不寫|不要寫|dry\s*run|preview/i },
  { action: 'status', pattern: /進度|狀態|紀錄|audit|log|history|查狀態/i },
  { action: 'report', pattern: /重產|重新產生|產報告|產生報告|今天的維護|今日報告|更新報告|重跑/i },
];

const AUTO_APPROVE = new Set(['report', 'dryRun', 'verify', 'status']);

function applyRules(rules, text, key, fallback) {
  for (const rule of rules) {
    if (rule.pattern.test(text)) return rule[key];
  }
  return fallback;
}

function buildTitle(text) {
  const cleaned = String(text || '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return '未命名任務';
  const firstClause = cleaned.split(/[，。,；;！!?？]/)[0] || cleaned;
  return firstClause.length > 40 ? `${firstClause.slice(0, 39)}…` : firstClause;
}

function buildSummary(text, category, priority, action) {
  const categoryLabel = {
    'backend-optimization': '後台優化',
    uiux: 'UI/UX 調整',
    poc: 'PoC 研究',
    'report-ops': '報告產出',
    meta: '雜項維護',
  }[category];
  const priorityLabel = {
    critical: '緊急',
    high: '高',
    medium: '中',
    low: '低',
  }[priority];
  const actionLabel = {
    report: '重新產生維護報告',
    dryRun: '預覽報告（不寫檔）',
    verify: '驗收檢查',
    status: '查詢執行紀錄',
    manual: '需人工處理',
  }[action];
  return `分類為「${categoryLabel}」、優先級「${priorityLabel}」，建議動作：${actionLabel}。`;
}

export function classifyMessage(text) {
  const raw = String(text || '').trim();
  const priority = applyRules(PRIORITY_RULES, raw, 'priority', 'medium');
  const category = applyRules(CATEGORY_RULES, raw, 'category', 'meta');
  const suggestedAction = applyRules(ACTION_RULES, raw, 'action', 'manual');
  const needsApproval = !AUTO_APPROVE.has(suggestedAction);
  return {
    title: buildTitle(raw),
    category,
    priority,
    suggestedAction,
    needsApproval,
    summary: buildSummary(raw, category, priority, suggestedAction),
  };
}
