type ChatHistoryItem = {
  role: 'user' | 'assistant';
  content: string;
};

const MAX_MESSAGE_LENGTH = 800;
const MAX_HISTORY_ITEMS = 10;
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_TIMEOUT_MS = 15000;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 12;

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

const rateLimitStore = new Map<string, RateLimitEntry>();

const SYSTEM_PROMPT = [
  '你是長穩基金會 i-Fare 網站右下角的問題小幫手。',
  '請用繁體中文回答，語氣親切、簡短、具體。',
  '你可以協助使用者理解 i-Fare 福利查詢、公益夥伴、福利專欄、最新消息、聯絡方式與捐助/志工參與方向。',
  '如果使用者詢問個人是否符合補助資格，請提醒需依主管機關或實際辦理單位審核，並建議使用 i-Fare 福利查詢或聯絡相關單位確認。',
  '不要編造不存在的政策、金額、申請條件或聯絡資訊；不確定時請說明需要由人工確認。',
  '回答中若有站內導引，可自然提到 /ifare、/collaborator、/articles、/news 等路徑，但不要輸出不可信外部連結。',
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
  const normalizedHistory = history.length > 0 ? history : [{ role: 'user' as const, content: message }];

  return normalizedHistory
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
  if (typeof realIp === 'string' && realIp.trim()) return realIp.trim();

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
  if (current.count <= RATE_LIMIT_MAX_REQUESTS) return { allowed: true, retryAfter: 0 };

  return {
    allowed: false,
    retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}

function getFriendlyErrorReply(code: ChatbotErrorCode) {
  const replies: Record<ChatbotErrorCode, string> = {
    local_rate_limit: '你剛剛詢問得比較快，我先幫你暫停一下。請稍等約 1 分鐘再試一次，或改用更精簡的問題詢問。',
    gemini_timeout: '小幫手目前回應比較久，請稍後再試一次。你也可以先使用站內的 i-Fare 福利查詢或聯絡基金會確認。',
    gemini_auth: '小幫手目前的 Gemini API key 設定可能需要管理者確認。你可以先使用站內查詢功能，或稍後再試。',
    gemini_quota: '小幫手目前可能遇到 API 額度或流量限制，請稍後再試。若問題較急，建議直接聯絡基金會。',
    gemini_bad_request: '小幫手目前無法處理這個問題格式，請換個更簡短、明確的問法再試一次。',
    gemini_server: 'Gemini 服務目前回應不穩定，請稍後再試。你也可以先使用站內搜尋或聯絡基金會。',
    gemini_network: '小幫手目前連線到 Gemini 服務時失敗，請稍後再試。',
    gemini_unknown: '小幫手目前暫時無法產生回覆，請稍後再試，或改用站內搜尋查詢。',
  };

  return replies[code];
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

function categorizeGeminiError(status: number, body: string): ChatbotErrorCode {
  const normalized = body.toLowerCase();

  if (status === 401 || status === 403) return 'gemini_auth';
  if (status === 429 || normalized.includes('quota') || normalized.includes('rate')) return 'gemini_quota';
  if (status === 400 || status === 404) return 'gemini_bad_request';
  if (status >= 500) return 'gemini_server';

  return 'gemini_unknown';
}

function extractResponseText(data: any): string {
  const parts: string[] = [];
  for (const candidate of data?.candidates || []) {
    for (const part of candidate?.content?.parts || []) {
      if (typeof part?.text === 'string') parts.push(part.text);
    }
  }

  return parts.join('\n').trim();
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

  const config = useRuntimeConfig();
  const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const model = normalizeGeminiModel(config.geminiModel || process.env.GEMINI_MODEL);

  if (!apiKey) {
    return {
      configured: false,
      reply: '小幫手已經接好 Google AI Studio / Gemini API，但目前伺服器尚未設定 GEMINI_API_KEY。設定完成並重啟後，我就可以用 Gemini 回答問題。',
    };
  }

  const history = normalizeHistory(body?.history);
  const transcript = buildTranscript(message, history);
  const rateLimit = checkRateLimit(getClientKey(event));
  if (!rateLimit.allowed) {
    setHeader(event, 'Retry-After', String(rateLimit.retryAfter));
    return {
      configured: true,
      model,
      errorCode: 'local_rate_limit',
      retryable: true,
      reply: getFriendlyErrorReply('local_rate_limit'),
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  let data: any;
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
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
          temperature: 0.3,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await parseErrorBody(response);
      const errorCode = categorizeGeminiError(response.status, errorBody);
      console.warn('[chatbot] Gemini request failed', {
        status: response.status,
        errorCode,
        message: errorBody,
      });

      return {
        configured: true,
        model,
        errorCode,
        retryable: errorCode !== 'gemini_auth' && errorCode !== 'gemini_bad_request',
        reply: getFriendlyErrorReply(errorCode),
      };
    }

    data = await response.json();
  } catch (error: any) {
    const errorCode: ChatbotErrorCode =
      error?.name === 'AbortError' || error?.cause?.name === 'AbortError'
        ? 'gemini_timeout'
        : 'gemini_network';

    console.warn('[chatbot] Gemini request error', {
      errorCode,
      message: error?.message || String(error),
    });

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

  const reply = extractResponseText(data);

  return {
    configured: true,
    model,
    reply: reply || '目前沒有產生回覆，請稍後再試一次。',
  };
});
