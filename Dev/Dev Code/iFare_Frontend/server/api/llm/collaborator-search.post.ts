import { GoogleGenAI } from '@google/genai';
import {
  DEFAULT_GEMINI_MODELS,
  parseModelList,
} from '../../utils/llm/freeTier';
import { normalizeRespectfulPolicyTerm } from '../../../utils/ifareIntent';
// 限流與快取改用共用工具：getClientKey 取 XFF「最後一段」的可信來源（不可偽造），
// createRateLimiter 會清過期項並設硬上限，createBoundedTtlCache 讓結果快取有上限、
// 自動過期與 LRU，取代本檔原本會被繞過、又只增不減的行內 Map。
import { createRateLimiter, getClientKey } from '~/server/utils/rateLimit';
import { createBoundedTtlCache } from '~/server/utils/boundedCache';

interface CollaboratorCandidate {
  id?: number;
  title?: string;
  serviceItem?: string;
}

interface CollaboratorSearchPayload {
  query?: string;
  collaborators?: CollaboratorCandidate[];
}

interface AiMatchResponse {
  matchedIds?: Array<number | string>;
  intent?: string;
}

const SEARCH_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 15000;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 20;
// 結果快取：以整包請求內容當 key，過期與 LRU 淘汰交給工具處理，max 設 500 為單行程上限。
const resultCache = createBoundedTtlCache<Record<string, unknown>>({
  max: 500,
  ttlMs: SEARCH_CACHE_TTL_MS,
});
// 限流器：沿用原本的視窗與次數常數（60 秒 / 20 次）。
const collaboratorSearchRateLimiter = createRateLimiter({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
});

const COLLABORATOR_SEARCH_SYSTEM_PROMPT = [
  'You match a Traditional Chinese user request to nonprofit partner records supplied in the prompt.',
  'Use only each supplied record ID, title, and serviceItem. Never use outside knowledge or invent an organization.',
  'Understand full questions, colloquial wording, related terms, target groups, and service needs.',
  'Interpret outdated or stigmatizing disability wording respectfully as a disability, intellectual disability, developmental-delay, or early-intervention service need when the wording supports that meaning.',
  'Include an ID only when its title or serviceItem reasonably supports the user need. It is valid to return no IDs.',
  'Return JSON only in this form: {"matchedIds":[1,2],"intent":"簡短繁體中文需求"}.',
].join(' ');

function normalizeQuery(value: unknown) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, 100) : '';
}

function normalizeCandidates(value: unknown): Required<CollaboratorCandidate>[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<number>();

  return value
    .slice(0, 100)
    .map((item) => ({
      id: Number(item?.id),
      title: String(item?.title || '').trim().slice(0, 120),
      serviceItem: String(item?.serviceItem || '').trim().slice(0, 500),
    }))
    .filter((item) => {
      if (!Number.isInteger(item.id) || item.id <= 0 || seen.has(item.id)) return false;
      seen.add(item.id);
      return Boolean(item.title || item.serviceItem);
    });
}

function parseAiMatch(text: string): AiMatchResponse {
  const normalized = String(text || '')
    .replace(/^```(?:json)?\s*/iu, '')
    .replace(/\s*```$/u, '')
    .trim();
  const jsonText = normalized.match(/\{[\s\S]*\}/u)?.[0] || normalized;
  if (!jsonText) return {};

  try {
    return JSON.parse(jsonText) as AiMatchResponse;
  } catch {
    return {};
  }
}

function buildPrompt(query: string, collaborators: Required<CollaboratorCandidate>[]) {
  const respectfulQuery = normalizeRespectfulPolicyTerm(query);
  return [
    '請分析使用者想找的服務對象、議題或協助內容，從候選公益夥伴中選出合理符合者。',
    '只能依候選資料判斷；不要因名稱看起來相近就選入，也不要加入清單以外的機構。',
    '口語或不合宜的舊稱須先轉成尊重的現代福利用語再比對。例如「低能兒」應理解為智能障礙兒童，優先比對身心障礙、智能障礙、發展遲緩或早期療育服務。',
    `使用者原始輸入：${JSON.stringify(query)}`,
    `尊重用語需求：${JSON.stringify(respectfulQuery)}`,
    `候選公益夥伴：${JSON.stringify(collaborators)}`,
  ].join('\n');
}

async function requestGroq(apiKey: string, model: string, prompt: string) {
  const isGptOss = /^openai\/gpt-oss-/iu.test(model);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
      model,
      reasoning_effort: isGptOss ? 'low' : 'none',
      ...(!isGptOss ? { reasoning_format: 'hidden' } : {}),
        temperature: 0.1,
        max_completion_tokens: 350,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: COLLABORATOR_SEARCH_SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
      }),
    });
    const data: any = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(`Groq request failed with status ${response.status}. ${data?.error?.message || ''}`.trim());
    }
    return String(data?.choices?.[0]?.message?.content || '');
  } finally {
    clearTimeout(timeout);
  }
}

async function requestGemini(apiKey: string, model: string, prompt: string) {
  const ai = new GoogleGenAI({ apiKey, apiVersion: 'v1beta' });
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: COLLABORATOR_SEARCH_SYSTEM_PROMPT,
      responseMimeType: 'application/json',
    },
  });
  return response.text || '';
}

function getFallbackIds(query: string, collaborators: Required<CollaboratorCandidate>[]) {
  const normalized = normalizeRespectfulPolicyTerm(query).toLowerCase().replace(/\s+/g, '');
  const synonymGroups: Array<{ pattern: RegExp; terms: string[] }> = [
    { pattern: /兒童|兒少|孩子|小孩|嬰幼兒|青少年/, terms: ['兒童', '兒少', '嬰幼兒', '青少年', '青年', '親子'] },
    { pattern: /老人|長者|長輩|年長|高齡|銀髮|照顧/, terms: ['老人', '長者', '銀髮', '照顧', '長照'] },
    { pattern: /身心障礙|身障|障礙|失能|智能障礙|發展遲緩|早療/, terms: ['身心障礙', '障礙', '失能', '智能障礙', '發展遲緩', '早療'] },
    { pattern: /婦女|女性|媽媽|母親/, terms: ['婦女', '女性', '媽媽', '母親'] },
    { pattern: /弱勢|家庭|經濟|貧困|生活困難/, terms: ['弱勢', '家庭', '脫貧', '經濟', '生活'] },
    { pattern: /環境|保育|生態|氣候/, terms: ['環境', '保育', '生態', '氣候'] },
    { pattern: /教育|培育|人才|學習/, terms: ['教育', '培育', '人才', '學習'] },
  ];
  const terms = new Set<string>();
  for (const group of synonymGroups) {
    if (group.pattern.test(normalized)) group.terms.forEach(term => terms.add(term));
  }
  normalized
    .split(/[，。！？、,!?;；：:]/u)
    .map(term => term.trim())
    .filter(term => term.length >= 2)
    .forEach(term => terms.add(term));

  return collaborators
    .filter(item => {
      const text = `${item.title}${item.serviceItem}`.toLowerCase();
      return [...terms].some(term => text.includes(term.toLowerCase()));
    })
    .map(item => item.id);
}

export default defineEventHandler(async (event) => {
  const body = (await readBody<CollaboratorSearchPayload>(event)) || {};
  const query = normalizeQuery(body.query);
  const collaborators = normalizeCandidates(body.collaborators);
  if (!query || collaborators.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Query and collaborators are required' });
  }

  // 限流移到快取查詢之前：連 cacheKey 的雜湊成本（大 payload 的 JSON.stringify）
  // 都受限流保護。副作用是快取命中也會計入限流，這是刻意取捨，可接受。
  const rl = collaboratorSearchRateLimiter(getClientKey(event));
  if (!rl.allowed) {
    setHeader(event, 'Retry-After', String(rl.retryAfter));
    throw createError({ statusCode: 429, statusMessage: 'Too many AI searches' });
  }

  const cacheKey = JSON.stringify({
    query,
    collaborators: collaborators.map(item => [item.id, item.title, item.serviceItem]),
  });
  // 命中即代表未過期（過期項在 get 內部已清掉並回 undefined），直接回。
  const cached = resultCache.get(cacheKey);
  if (cached) return { ...cached, cached: true };

  const config = useRuntimeConfig();
  const llmConfig = (config as any).llm || {};
  const groqModels = parseModelList(llmConfig.groqIntentModels || llmConfig.groqModels, [
    'qwen/qwen3.6-27b',
    'openai/gpt-oss-120b',
  ]);
  const geminiModels = parseModelList(
    llmConfig.geminiModels || llmConfig.geminiModel,
    DEFAULT_GEMINI_MODELS,
  );
  const candidates = [
    ...groqModels.map(model => ({ provider: 'groq', model, apiKey: String(llmConfig.groqApiKey || '') })),
    ...geminiModels.map(model => ({ provider: 'gemini', model, apiKey: String(llmConfig.geminiApiKey || '') })),
  ];
  const prompt = buildPrompt(query, collaborators);
  const validIds = new Set(collaborators.map(item => item.id));
  const errors: string[] = [];

  for (const candidate of candidates) {
    if (!candidate.apiKey) continue;
    try {
      const text = candidate.provider === 'groq'
        ? await requestGroq(candidate.apiKey, candidate.model, prompt)
        : await requestGemini(candidate.apiKey, candidate.model, prompt);
      const parsed = parseAiMatch(text);
      if (!Array.isArray(parsed.matchedIds)) throw new Error('LLM returned invalid matchedIds.');
      const llmMatchedIds = [...new Set(
        parsed.matchedIds.map(Number).filter(id => Number.isInteger(id) && validIds.has(id)),
      )];
      if (llmMatchedIds.length === 0) {
        throw new Error('LLM returned no matching collaborators; trying the next provider.');
      }
      const matchedIds = llmMatchedIds;
      const result = {
        matchedIds,
        intent: String(parsed.intent || '').replace(/\s+/g, ' ').trim().slice(0, 80),
        source: candidate.provider,
        model: candidate.model,
        cached: false,
        errorMessage: '',
      };
      resultCache.set(cacheKey, result);
      return result;
    } catch (error: any) {
      const message = error?.message || String(error);
      errors.push(`${candidate.provider}:${candidate.model}: ${message}`);
      console.warn(`[LLM][collaborator-search][${candidate.provider}:${candidate.model}]`, message);
    }
  }

  // 去敏：上游原始錯誤可能夾帶供應商內部訊息，只保留在伺服器端記錄
  //（每個候選的錯誤在迴圈內已逐一 console.warn，這裡再彙整一筆，方便對照為何走到兜底）。
  if (errors.length) {
    console.warn('[LLM][collaborator-search] 全部供應商失敗，改用關鍵字兜底：', errors.join(' | '));
  }
  return {
    matchedIds: getFallbackIds(query, collaborators),
    intent: '',
    source: 'fallback',
    model: 'script',
    cached: false,
    // 回應只給通用訊息，不把上游錯誤字串洩漏給前端
    errorMessage: 'AI 服務暫時無法使用',
  };
});
