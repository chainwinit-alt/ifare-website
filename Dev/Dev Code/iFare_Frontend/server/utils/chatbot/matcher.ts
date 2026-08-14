// 芒寶答案卡 — 中文比對引擎
//
// 取代原本的 `text.includes()` 子字串比對。零外部相依，只用 Node 18+ 內建的
// Intl.Segmenter 做中文斷詞，再輔以字元 bigram 相似度處理沒斷準的情況。
//
// 為什麼不用 Fuse.js：其預設分詞會把一整串中文視為單一 token（官方文件明載），
// 仍須自行接 Intl.Segmenter，等於只用到 bitap 模糊比對。而中文短句 FAQ 比對
// 用「詞重疊 + bigram Dice 係數」效果更穩，也省下一個相依套件與部署風險。

import type { ChatbotCard, CardMatch } from './types';

/** 直接採用卡片答案的門檻，不呼叫任何 LLM */
export const DIRECT_MATCH_THRESHOLD = 0.62;
/** 納入 LLM 選卡候選清單的門檻 */
export const CANDIDATE_THRESHOLD = 0.2;
/**
 * 兜底時可以直接拿來回答的門檻。
 * 比候選門檻高：候選只要「值得讓 LLM 看一眼」，兜底卻是直接講給訪客聽，
 * 分數太低就寧可回罐頭，也不要拿一張沾邊的卡去答非所問。
 */
export const FALLBACK_MATCH_THRESHOLD = 0.45;
/** 送給 LLM 的候選卡片數上限 */
export const MAX_CANDIDATES = 5;

let segmenter: Intl.Segmenter | null | undefined;

function getSegmenter() {
  if (segmenter !== undefined) return segmenter;
  try {
    // Node 18+ 內建 full-icu，可做中文詞典斷詞
    segmenter = new Intl.Segmenter('zh-Hant', { granularity: 'word' });
  } catch {
    segmenter = null;
  }
  return segmenter;
}

/**
 * 正規化：全形轉半形、統一小寫、去除標點與空白。
 * i-Fare / ifare / Ｉ－ＦＡＲＥ 之類的寫法會收斂成同一種形式。
 */
export function normalizeText(value: string) {
  return String(value || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s　]+/g, '')
    .replace(/[!-/:-@[-`{-~？！，。、；：「」『』（）《》〈〉…—～·]/g, '');
}

/** 中文斷詞。Intl.Segmenter 不可用時退回 bigram，不會整個失效。 */
export function tokenize(value: string): string[] {
  const text = normalizeText(value);
  if (!text) return [];

  const seg = getSegmenter();
  if (!seg) return bigrams(text);

  const tokens: string[] = [];
  for (const part of seg.segment(text)) {
    if (part.isWordLike && part.segment.trim()) tokens.push(part.segment);
  }
  return tokens.length ? tokens : bigrams(text);
}

/** 字元 bigram。單字會原樣回傳，避免短查詢得到空集合。 */
export function bigrams(value: string): string[] {
  const chars = Array.from(normalizeText(value));
  if (chars.length <= 1) return chars;

  const result: string[] = [];
  for (let i = 0; i < chars.length - 1; i += 1) {
    result.push(chars[i] + chars[i + 1]);
  }
  return result;
}

/** Dice 係數，衡量兩組字串的重疊程度，值域 0..1 */
function diceCoefficient(a: string[], b: string[]) {
  if (!a.length || !b.length) return 0;
  const setB = new Map<string, number>();
  for (const item of b) setB.set(item, (setB.get(item) || 0) + 1);

  let overlap = 0;
  for (const item of a) {
    const remaining = setB.get(item) || 0;
    if (remaining > 0) {
      overlap += 1;
      setB.set(item, remaining - 1);
    }
  }
  return (2 * overlap) / (a.length + b.length);
}

/**
 * 關鍵字比對得分。
 * 越長的關鍵字代表越具體的問法，命中時給越高的分；
 * 命中多個關鍵字會再往上加，但收斂於 1。
 */
function keywordScore(normalizedQuery: string, keywords: string[]) {
  const hits: string[] = [];
  let best = 0;
  let accumulated = 0;

  for (const keyword of keywords) {
    const normalizedKeyword = normalizeText(keyword);
    if (!normalizedKeyword) continue;

    // 整句就等於某個關鍵字（例如只打「嗨」「懶人包」）視為明確命中，
    // 不受下方長度門檻限制——單字關鍵字只有在這種情況才算數。
    if (normalizedQuery === normalizedKeyword) {
      hits.push(keyword);
      best = Math.max(best, 0.95);
      continue;
    }

    // 單字關鍵字若只是出現在長句中，誤命中率太高，不予採計
    if (normalizedKeyword.length < 2) continue;
    if (!normalizedQuery.includes(normalizedKeyword)) continue;

    hits.push(keyword);
    // 2 字 → 0.70、3 字 → 0.78、4 字 → 0.84、6 字以上 → 0.92 上限
    const specificity = Math.min(0.92, 0.62 + normalizedKeyword.length * 0.055);
    best = Math.max(best, specificity);
    accumulated += 0.06;
  }

  if (!hits.length) return { score: 0, hits };
  return { score: Math.min(1, best + Math.min(0.08, accumulated - 0.06)), hits };
}

/** 針對單張卡片計算 0..1 的匹配分數 */
export function scoreCard(query: string, card: ChatbotCard): CardMatch {
  const normalizedQuery = normalizeText(query);
  const queryTokens = tokenize(query);
  const queryBigrams = bigrams(query);

  const { score: kwScore, hits } = keywordScore(normalizedQuery, card.keywords);

  // 語意重疊：逐一比對每個關鍵字與標題，取最高分。
  // 不能把關鍵字串成一整段再比——那樣分母會被拉長，
  // 「我想當志工」對上「成為志工」這種部分重疊會被稀釋到接近 0。
  // 也不比對答案本文，避免長答案裡的常見字（基金會、頁面…）讓分數趨同。
  let fuzzyScore = 0;
  for (const phrase of [card.title, ...card.keywords]) {
    const tokenOverlap = diceCoefficient(queryTokens, tokenize(phrase));
    const bigramOverlap = diceCoefficient(queryBigrams, bigrams(phrase));
    fuzzyScore = Math.max(fuzzyScore, tokenOverlap * 0.6 + bigramOverlap * 0.4);
  }

  // 關鍵字命中是主要訊號，模糊比對只用來補足；兩者取較大值再微幅互補。
  const blended = Math.max(kwScore, fuzzyScore) + Math.min(kwScore, fuzzyScore) * 0.12;
  const score = Math.min(1, blended) * (card.priority ?? 1);

  return { card, score, hits };
}

/** 對整份卡片集評分並由高到低排序，只回傳達到候選門檻的結果 */
export function rankCards(query: string, cards: ChatbotCard[]): CardMatch[] {
  if (!query.trim()) return [];

  return cards
    .filter(card => card.enabled !== false)
    .map(card => scoreCard(query, card))
    .filter(match => match.score >= CANDIDATE_THRESHOLD)
    .sort((a, b) => b.score - a.score);
}

/**
 * 使用者在問某個具體資料（電話、金額、人數、日期…），而卡片答案裡沒有這個東西。
 *
 * 關鍵字比對分不出「董事長是誰」和「董事長的電話幾號」——兩句都命中「董事長」，
 * 但後者網站根本沒有答案。這種情況必須擋下直接命中、交給 LLM 判斷，
 * 否則芒寶會用很肯定的語氣回一段答非所問的話。
 */
const SPECIFIC_DATUM_PATTERN =
  /幾號|幾個|幾位|幾人|幾間|幾點|幾歲|幾年|多少錢|多少元|多少人|多少|哪一天|名單|電話|地址|信箱|email|薪水|待遇|預算|費用|價格|金額/gi;

function requestsMissingDatum(query: string, card: ChatbotCard) {
  const normalizedQuery = normalizeText(query);
  const markers = normalizedQuery.match(SPECIFIC_DATUM_PATTERN);
  if (!markers?.length) return false;

  // 卡片答案本身就談到那個資料時（例如問「電話」而卡片寫了「聯絡電話」），視為答得出來
  const normalizedAnswer = normalizeText(card.answer);
  return !markers.some(marker => normalizedAnswer.includes(normalizeText(marker)));
}

/**
 * Layer 1：信心足夠時直接回卡片，完全不呼叫 LLM。
 * 額外要求與第二名拉開差距，避免兩張卡分數接近時選錯。
 */
export function findDirectMatch(matches: CardMatch[], query: string): CardMatch | null {
  const [first, second] = matches;
  if (!first || first.score < DIRECT_MATCH_THRESHOLD) return null;
  if (second && first.score - second.score < 0.04) return null;
  if (requestsMissingDatum(query, first.card)) return null;
  return first;
}
