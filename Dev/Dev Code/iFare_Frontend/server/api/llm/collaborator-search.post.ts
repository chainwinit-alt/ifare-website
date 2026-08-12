import { GoogleGenAI } from '@google/genai';
import {
  DEFAULT_GEMINI_MODELS,
  parseModelList,
} from '../../utils/llm/freeTier';
import { normalizeRespectfulPolicyTerm } from '../../../utils/ifareIntent';

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
const resultCache = new Map<string, { expiresAt: number; result: Record<string, unknown> }>();
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

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

function getClientKey(event: any) {
  const forwardedFor = getHeader(event, 'x-forwarded-for');
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) return forwardedFor.split(',')[0].trim();
  return event.node?.req?.socket?.remoteAddress || 'unknown';
}

function checkRateLimit(clientKey: string) {
  const now = Date.now();
  const current = rateLimitStore.get(clientKey);
  if (!current || current.resetAt <= now) {
    rateLimitStore.set(clientKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  current.count += 1;
  return current.count <= RATE_LIMIT_MAX_REQUESTS;
}

export default defineEventHandler(async (event) => {
  const body = (await readBody<CollaboratorSearchPayload>(event)) || {};
  const query = normalizeQuery(body.query);
  const collaborators = normalizeCandidates(body.collaborators);
  if (!query || collaborators.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Query and collaborators are required' });
  }

  const cacheKey = JSON.stringify({
    query,
    collaborators: collaborators.map(item => [item.id, item.title, item.serviceItem]),
  });
  const cached = resultCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return { ...cached.result, cached: true };
  if (cached) resultCache.delete(cacheKey);

  if (!checkRateLimit(getClientKey(event))) {
    throw createError({ statusCode: 429, statusMessage: 'Too many AI searches' });
  }

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
      resultCache.set(cacheKey, { expiresAt: Date.now() + SEARCH_CACHE_TTL_MS, result });
      return result;
    } catch (error: any) {
      const message = error?.message || String(error);
      errors.push(`${candidate.provider}:${candidate.model}: ${message}`);
      console.warn(`[LLM][collaborator-search][${candidate.provider}:${candidate.model}]`, message);
    }
  }

  return {
    matchedIds: getFallbackIds(query, collaborators),
    intent: '',
    source: 'fallback',
    model: 'script',
    cached: false,
    errorMessage: errors.join(' | ') || 'No LLM provider is configured.',
  };
});
