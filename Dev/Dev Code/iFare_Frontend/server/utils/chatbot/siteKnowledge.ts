// 芒寶自動知識庫 — 站內內容自動同步
//
// 目的：基金會不需要定期手動補答案卡，芒寶的知識跟著網站內容自動長。
//   1. 後台維護的「常見問題（FareQA）」自動轉成答案卡：
//      回覆文字仍是人在後台寫的，口吻 100% 固定，且後台改完最慢 10 分鐘生效。
//   2. 「最新消息」與「福利專欄」的最新標題自動成為 Layer 3 生成層的站內資料，
//      訪客問「最近有什麼活動」時芒寶答得出實際標題。
//
// 與 cardStore 相同的守則：這個模組永遠不拋錯——任何來源失敗都回空集合，
// 芒寶頂多少一份知識，不會因此啞掉。
// 開關：runtimeConfig.chatbotRagEnabled（環境變數 NUXT_CHATBOT_RAG_ENABLED，預設開）。

import { tokenize } from './matcher';
import type { ChatbotCard } from './types';

const CACHE_TTL_MS = 10 * 60 * 1000;
const ERROR_CACHE_TTL_MS = 60 * 1000;
const FETCH_TIMEOUT_MS = 4000;
const MAX_QA_CARDS = 60;
const MAX_QA_ANSWER_LENGTH = 220;
const MAX_CONTEXT_LINES = 5;

export type SiteKnowledge = {
  /** 常見問題自動轉出的答案卡（文字為後台人寫，口吻固定） */
  qaCards: ChatbotCard[];
  /** 「標題（日期）」格式的最新消息清單 */
  latestNewsLines: string[];
  /** 「標題（日期）」格式的福利專欄清單 */
  latestArticleLines: string[];
};

const EMPTY_KNOWLEDGE: SiteKnowledge = {
  qaCards: [],
  latestNewsLines: [],
  latestArticleLines: [],
};

type CacheEntry = {
  knowledge: SiteKnowledge;
  expiresAt: number;
};

let cache: CacheEntry | null = null;
let inFlight: Promise<SiteKnowledge> | null = null;

/** 問句裡的功能詞，不適合當比對關鍵字（誤命中率太高） */
const KEYWORD_STOPWORDS = new Set([
  '請問', '如何', '怎麼', '怎樣', '什麼', '甚麼', '可以', '哪裡', '那裡',
  '是否', '有沒有', '需要', '要怎麼', '我要', '我想', '想要', '有哪些',
  '嗎', '呢', '的', '要', '會', '是', '在', '有', '跟', '與', '及',
]);

function stripHtml(value: unknown) {
  return String(value ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 答案過長時在句尾裁切，維持完整句子 */
function truncateAnswer(text: string) {
  const characters = Array.from(text);
  if (characters.length <= MAX_QA_ANSWER_LENGTH) return text;

  for (let index = MAX_QA_ANSWER_LENGTH - 1; index >= Math.floor(MAX_QA_ANSWER_LENGTH * 0.5); index -= 1) {
    if (/[。！？!?]/u.test(characters[index] || '')) {
      return characters.slice(0, index + 1).join('');
    }
  }
  return `${characters
    .slice(0, MAX_QA_ANSWER_LENGTH - 1)
    .join('')
    .replace(/[，、；：,;:\s]+$/u, '')}。`;
}

/** 從問句自動萃取比對關鍵字：整句 + 有意義的斷詞 */
function deriveKeywords(question: string): string[] {
  const keywords = new Set<string>();
  const trimmed = question.trim();
  if (trimmed) keywords.add(trimmed);

  for (const token of tokenize(question)) {
    if (token.length < 2 || KEYWORD_STOPWORDS.has(token)) continue;
    keywords.add(token);
    if (keywords.size >= 10) break;
  }
  return [...keywords];
}

function toQaCard(raw: any): ChatbotCard | null {
  const id = Number(raw?.id ?? raw?.Id);
  const question = stripHtml(raw?.question ?? raw?.Question);
  const answer = stripHtml(raw?.answer ?? raw?.Answer);
  // id 1 是資料庫的佔位列，前台 QA 頁同樣排除
  if (!Number.isFinite(id) || id <= 1 || !question || !answer) return null;

  return {
    id: `qa-${id}`,
    title: question,
    keywords: deriveKeywords(question),
    answer: truncateAnswer(answer),
    linkKeys: ['ifare'],
    // 低於人工卡片（1.0），同分時人工維護的答案卡優先
    priority: 0.9,
    sort: 1000 + id,
  };
}

function formatReleaseDate(value: unknown) {
  const text = String(value ?? '').trim();
  const match = text.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})/);
  return match ? `${match[1]}/${match[2]}/${match[3]}` : '';
}

function toTitleLine(raw: any): string {
  const title = stripHtml(raw?.title ?? raw?.Title);
  if (!title) return '';
  const date = formatReleaseDate(raw?.releaseTime ?? raw?.ReleaseTime);
  return date ? `${title}（${date}）` : title;
}

/** ABP 包裝：實際資料在 payload.result.result（與 cardStore.extractList 同邏輯） */
function extractList(payload: any): any[] {
  const candidates = [
    payload?.result?.result,
    payload?.result?.Result,
    payload?.Result,
    payload?.result,
    payload,
  ];
  return candidates.find(Array.isArray) || [];
}

async function fetchList(baseUrl: string, path: string): Promise<any[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`${path} responded with ${response.status}.`);
    return extractList(await response.json());
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchKnowledge(baseUrl: string): Promise<SiteKnowledge> {
  const normalizedBase = baseUrl.replace(/\/$/, '');
  const [qaRows, newsRows, articleRows] = await Promise.all([
    fetchList(normalizedBase, '/FareQA/GetIFareQAList').catch((error) => {
      console.warn('[chatbot][knowledge] FareQA 讀取失敗：', error?.message || error);
      return [] as any[];
    }),
    fetchList(normalizedBase, '/News/GetTopsNewsList').catch((error) => {
      console.warn('[chatbot][knowledge] News 讀取失敗：', error?.message || error);
      return [] as any[];
    }),
    fetchList(normalizedBase, '/ArticlesWelfare/GetArticlesWelfareTops').catch((error) => {
      console.warn('[chatbot][knowledge] Articles 讀取失敗：', error?.message || error);
      return [] as any[];
    }),
  ]);

  return {
    qaCards: qaRows
      .map(toQaCard)
      .filter((card): card is ChatbotCard => Boolean(card))
      .slice(0, MAX_QA_CARDS),
    latestNewsLines: newsRows.map(toTitleLine).filter(Boolean).slice(0, MAX_CONTEXT_LINES),
    latestArticleLines: articleRows.map(toTitleLine).filter(Boolean).slice(0, MAX_CONTEXT_LINES),
  };
}

/**
 * 取得站內自動知識。失敗回空集合、沿用短快取，永不拋錯。
 * @param baseUrl runtimeConfig.frontendApiServerBase
 */
export async function loadSiteKnowledge(baseUrl: string): Promise<SiteKnowledge> {
  if (!baseUrl) return EMPTY_KNOWLEDGE;

  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache.knowledge;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const knowledge = await fetchKnowledge(baseUrl);
      cache = { knowledge, expiresAt: Date.now() + CACHE_TTL_MS };
      return knowledge;
    } catch (error: any) {
      console.warn('[chatbot][knowledge] 站內知識同步失敗：', error?.message || error);
      const fallback = cache?.knowledge ?? EMPTY_KNOWLEDGE;
      cache = { knowledge: fallback, expiresAt: Date.now() + ERROR_CACHE_TTL_MS };
      return fallback;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

/** 組出 Layer 3 生成層用的「站內最新內容」區塊；沒有資料時回空字串 */
export function buildSiteContextBlock(knowledge: SiteKnowledge) {
  const sections: string[] = [];
  if (knowledge.latestNewsLines.length) {
    sections.push(`最新消息（僅標題，內容請引導到「最新消息」頁查看）：\n${knowledge.latestNewsLines.map(line => `- ${line}`).join('\n')}`);
  }
  if (knowledge.latestArticleLines.length) {
    sections.push(`福利專欄（僅標題，內容請引導到「福利專欄」頁查看）：\n${knowledge.latestArticleLines.map(line => `- ${line}`).join('\n')}`);
  }
  return sections.join('\n');
}

/** 供測試與後台內容更新後主動失效使用 */
export function invalidateSiteKnowledgeCache() {
  cache = null;
}
