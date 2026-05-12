type ChatHistoryItem = {
  role: 'user' | 'assistant';
  content: string;
};

type ChatbotErrorCode =
  | 'gemini_timeout'
  | 'gemini_auth'
  | 'gemini_quota'
  | 'gemini_bad_request'
  | 'gemini_server'
  | 'gemini_network'
  | 'gemini_unknown'
  | 'local_rate_limit';

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type KnowledgeEntry = {
  title: string;
  keywords: string[];
  answer: string;
};

const MAX_MESSAGE_LENGTH = 800;
const MAX_HISTORY_ITEMS = 10;
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_TIMEOUT_MS = 15000;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 12;

const rateLimitStore = new Map<string, RateLimitEntry>();

const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  {
    title: 'i-Fare 福利查詢',
    keywords: ['福利', '補助', '資格', '申請', '政策', 'ifare'],
    answer:
      '如果你想先找適合自己的福利政策，建議直接前往 i-Fare 福利查詢頁，依照地區、受助對象與條件逐步篩選。站內入口：/ifare',
  },
  {
    title: '公益夥伴',
    keywords: ['公益', '夥伴', '合作', '合作單位', '協力'],
    answer:
      '如果你想找合作單位、服務項目或民間資源，可以直接前往公益夥伴頁查看。站內入口：/collaborator',
  },
  {
    title: '捐款與支持',
    keywords: ['捐款', '支持', 'donate', 'donation'],
    answer:
      '若你想支持基金會，建議先到關於我們了解服務方向，再透過基金會提供的聯絡方式詢問合作或捐款細節。站內入口：/about',
  },
  {
    title: '最新消息',
    keywords: ['新聞', '最新', '活動', '公告'],
    answer:
      '如果你想看基金會最新公告、活動與更新，請直接前往最新消息頁。站內入口：/news',
  },
  {
    title: '文章專區',
    keywords: ['文章', '懶人包', '資源', '閱讀'],
    answer:
      '如果你想看政策整理、圖文內容與延伸資源，建議直接前往文章專區。站內入口：/articles',
  },
  {
    title: '聯絡資訊',
    keywords: ['聯絡', '客服', '電話', 'line', 'email', '真人'],
    answer:
      '基金會聯絡方式如下：電話 02-2797-8383、Email ifaretw@gmail.com、LINE 客服 https://lin.ee/eHw9VpL',
  },
  {
    title: '如何使用小幫手',
    keywords: ['怎麼用', '使用方式', '如何使用', '小幫手'],
    answer:
      '你可以直接提問福利政策、聯絡資訊、公益夥伴、捐款與最新消息。如果問題牽涉個案判斷，建議改由基金會真人協助。',
  },
  {
    title: '服務邊界',
    keywords: ['個案', '判斷', '專業', '法律', '醫療'],
    answer:
      '小幫手只能做站內導覽與一般資訊整理，不能取代專業個案判斷。若問題涉及申請資格、法律或醫療判斷，建議直接聯絡基金會或專業人員。',
  },
];

const KNOWLEDGE_BLOCK = KNOWLEDGE_BASE.map(
  (entry, index) => `${index + 1}. ${entry.title}: ${entry.answer}`,
).join('\n');

const FIXED_FALLBACK_REPLY =
  '目前聊天小幫手先使用固定問答模式。你可以試著詢問 i-Fare、公益夥伴、捐款合作、聯絡方式、最新消息或文章資訊；若需要真人協助，也可以直接使用 LINE 或電話聯絡基金會。';

const SYSTEM_PROMPT = [
  '你是 i-Fare 網站上的智慧小幫手。',
  '你的任務是整理站內資訊、引導使用者前往正確頁面，避免過度推測。',
  '回答時優先使用下列固定知識庫；若知識庫無法支撐結論，就明確說明你不確定，並引導使用者到對應頁面或真人客服。',
  '不要編造不存在的方案、金額、資格與聯絡方式。',
  '若問題與福利政策、公益夥伴、文章、最新消息、聯絡方式相關，盡量附上站內入口。',
  '固定知識庫如下：',
  KNOWLEDGE_BLOCK,
].join('\n');

function normalizeMessage(value: unknown) {
  return typeof value === 'string' ? value.trim().slice(0, MAX_MESSAGE_LENGTH) : '';
}

function normalizeHistory(value: unknown): ChatHistoryItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .slice(-MAX_HISTORY_ITEMS)
    .map((item) => {
      const role = item?.role === 'assistant' ? 'assistant' : item?.role === 'user' ? 'user' : null;
      const content = normalizeMessage(item?.content);
      if (!role || !content) return null;
      return { role, content };
    })
    .filter((item): item is ChatHistoryItem => Boolean(item));
}

function buildTranscript(message: string, history: ChatHistoryItem[]) {
  const transcriptHistory = history.length > 0 ? history : [{ role: 'user' as const, content: message }];

  return transcriptHistory
    .map((item) => `${item.role === 'assistant' ? '小幫手' : '使用者'}：${item.content}`)
    .join('\n');
}

function normalizeGeminiModel(value: unknown) {
  const model = typeof value === 'string' ? value.trim() : '';
  return (model || DEFAULT_GEMINI_MODEL).replace(/^models\//, '');
}

function getClientKey(event: any) {
  const forwardedFor = getHeader(event, 'x-forwarded-for');
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = getHeader(event, 'x-real-ip');
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim();
  }

  return event.node?.req?.socket?.remoteAddress || 'unknown';
}

function checkRateLimit(clientKey: string) {
  const now = Date.now();
  const current = rateLimitStore.get(clientKey);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(clientKey, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true, retryAfter: 0 };
  }

  current.count += 1;

  if (current.count <= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: true, retryAfter: 0 };
  }

  return {
    allowed: false,
    retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}

function getFriendlyErrorReply(code: ChatbotErrorCode) {
  const replies: Record<ChatbotErrorCode, string> = {
    local_rate_limit: '目前提問次數有點密集，請稍等約 1 分鐘後再試，或直接前往 i-Fare / 公益夥伴頁面查看。',
    gemini_timeout: '小幫手回覆逾時了，建議你重試一次，或先改用站內頁面查找資訊。',
    gemini_auth: '智慧小幫手目前設定異常，暫時無法連到 AI 服務。你可以先使用站內頁面，或改由基金會人工協助。',
    gemini_quota: '智慧小幫手目前流量較高，請稍後再試，或先到 i-Fare、公益夥伴與最新消息頁面查看。',
    gemini_bad_request: '這次提問格式無法正確處理，建議換個問法再試一次。',
    gemini_server: '智慧小幫手服務暫時忙碌中，請稍後再試，或先改用站內導覽入口。',
    gemini_network: '目前無法連到智慧小幫手服務，請確認網路後再試一次。',
    gemini_unknown: '智慧小幫手暫時遇到未預期錯誤，建議稍後重試，或直接改走站內頁面。',
  };

  return replies[code];
}

function parseGeminiError(status: number, body: string): ChatbotErrorCode {
  const normalized = body.toLowerCase();

  if (status === 401 || status === 403) return 'gemini_auth';
  if (status === 429 || normalized.includes('quota') || normalized.includes('rate')) return 'gemini_quota';
  if (status === 400 || status === 404) return 'gemini_bad_request';
  if (status >= 500) return 'gemini_server';

  return 'gemini_unknown';
}

async function parseErrorBody(response: Response) {
  const text = await response.text();
  if (!text) return '';

  try {
    const json = JSON.parse(text);
    return json?.error?.message || text;
  } catch {
    return text;
  }
}

function extractResponseText(data: any) {
  const parts: string[] = [];

  for (const candidate of data?.candidates || []) {
    for (const part of candidate?.content?.parts || []) {
      if (typeof part?.text === 'string') {
        parts.push(part.text);
      }
    }
  }

  return parts.join('\n').trim();
}

function matchKnowledgeEntry(message: string) {
  const text = message.toLowerCase();

  return KNOWLEDGE_BASE.find((entry) =>
    entry.keywords.some((keyword) => text.includes(keyword.toLowerCase())),
  );
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const message = normalizeMessage(body?.message);

  if (!message) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Message is required',
    });
  }

  const rateLimit = checkRateLimit(getClientKey(event));
  if (!rateLimit.allowed) {
    setHeader(event, 'Retry-After', String(rateLimit.retryAfter));
    return {
      configured: true,
      errorCode: 'local_rate_limit',
      retryable: true,
      reply: getFriendlyErrorReply('local_rate_limit'),
    };
  }

  const knowledgeMatch = matchKnowledgeEntry(message);
  if (knowledgeMatch) {
    return {
      configured: true,
      source: 'knowledge_base',
      reply: knowledgeMatch.answer,
    };
  }

  return {
    configured: false,
    source: 'fixed_faq_fallback',
    reply: FIXED_FALLBACK_REPLY,
  };

  /*
  const history = normalizeHistory(body?.history);
  const transcript = buildTranscript(message, history);
  const config = useRuntimeConfig();
  const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const model = normalizeGeminiModel(config.geminiModel || process.env.GEMINI_MODEL);

  if (!apiKey) {
    return {
      configured: false,
      reply:
        '目前智慧小幫手沒有啟用外部 AI 金鑰，但你仍可直接查看 i-Fare、公益夥伴、最新消息、文章專區，或聯絡基金會取得協助。',
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'x-goog-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: transcript }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 500,
            temperature: 0.25,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorBody = await parseErrorBody(response);
      const errorCode = parseGeminiError(response.status, errorBody);

      return {
        configured: true,
        model,
        errorCode,
        retryable: errorCode !== 'gemini_auth' && errorCode !== 'gemini_bad_request',
        reply: getFriendlyErrorReply(errorCode),
      };
    }

    const data = await response.json();
    const reply = extractResponseText(data);

    return {
      configured: true,
      model,
      source: 'gemini',
      reply:
        reply ||
        '我目前沒有足夠把握直接回答這題，建議你改從 i-Fare、公益夥伴、文章專區或基金會聯絡方式繼續查找。',
    };
  } catch (error: any) {
    const errorCode: ChatbotErrorCode =
      error?.name === 'AbortError' || error?.cause?.name === 'AbortError'
        ? 'gemini_timeout'
        : 'gemini_network';

    return {
      configured: true,
      model,
      errorCode,
      retryable: true,
      reply: getFriendlyErrorReply(errorCode),
    };
  } finally {
    clearTimeout(timeout);
  }
  */
});
