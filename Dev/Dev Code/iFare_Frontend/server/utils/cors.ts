/**
 * CORS helper for dynamic-pages endpoints（PoC v2 自動同步）
 *
 * 後台 (localhost:5173) 跨域 PUT 到前端 Nuxt server，PUT JSON 會觸發 preflight。
 * dev 環境 wildcard 允許所有來源；prod 要把 Allow-Origin 改為白名單。
 */

import type { H3Event } from 'h3';

export function applyCors(event: H3Event): void {
  setHeader(event, 'Access-Control-Allow-Origin', '*');
  setHeader(event, 'Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  setHeader(event, 'Access-Control-Allow-Headers', 'Content-Type');
}
