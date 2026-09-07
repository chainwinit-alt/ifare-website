/**
 * CORS helper for dynamic-pages endpoints（PoC v2 自動同步）
 *
 * 後台 (localhost:5173) 跨域 PUT 到前端 Nuxt server，PUT JSON 會觸發 preflight。
 * dev 環境 wildcard 允許所有來源；prod 要把 Allow-Origin 改為白名單。
 */

import { timingSafeEqual } from 'node:crypto';
import type { H3Event } from 'h3';

const DEV_ALLOWED_ORIGINS = [
  'http://10.200.0.39',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:4173',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:4173',
  'http://127.0.0.1:5173',
];

function splitConfigList(value: unknown): string[] {
  if (typeof value !== 'string') return [];

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getAllowedOrigins(event: H3Event): string[] {
  const config = useRuntimeConfig(event);
  const configuredOrigins = splitConfigList(config.dynamicApiAllowedOrigins);

  if (configuredOrigins.length > 0) return configuredOrigins;
  if (process.env.NODE_ENV !== 'production') return DEV_ALLOWED_ORIGINS;

  return [];
}

function isAllowedOrigin(event: H3Event, origin: string): boolean {
  return getAllowedOrigins(event).includes(origin);
}

function getBearerToken(value: string): string {
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || '';
}

function safeTokenEqual(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);

  if (actualBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(actualBuffer, expectedBuffer);
}

export function applyCors(event: H3Event): void {
  const origin = getHeader(event, 'origin');

  if (origin && isAllowedOrigin(event, origin)) {
    setHeader(event, 'Access-Control-Allow-Origin', origin);
    setHeader(event, 'Vary', 'Origin');
  }

  setHeader(event, 'Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  setHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, Authorization, X-iFare-Sync-Token');
  setHeader(event, 'Access-Control-Max-Age', '600');
}

/**
 * requireDynamicApiToken — 授權檢查改為 fail-closed。
 *
 * 為何改成 fail-closed：舊版在「未設定 token 且 NODE_ENV !== 'production'」時直接 return 放行，
 * 而這台機器的 NODE_ENV 不是 production，等於寫入端點完全沒有授權保護。
 * 現在不再依賴 NODE_ENV 判斷：只要沒有設定 dynamicApiToken 就一律拒絕（503），
 * 也就是「沒設 token = 全部擋掉」，避免因環境變數不同而意外放行寫入端點。
 */
export function requireDynamicApiToken(event: H3Event): void {
  const config = useRuntimeConfig(event);
  const expectedToken = String(config.dynamicApiToken || '').trim();

  if (!expectedToken) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Dynamic API token is not configured',
    });
  }

  const syncToken = String(getHeader(event, 'x-ifare-sync-token') || '').trim();
  const authorizationToken = getBearerToken(String(getHeader(event, 'authorization') || ''));
  const actualToken = syncToken || authorizationToken;

  if (!actualToken || !safeTokenEqual(actualToken, expectedToken)) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid dynamic API token',
    });
  }
}
