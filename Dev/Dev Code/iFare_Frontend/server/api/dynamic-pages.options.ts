/**
 * OPTIONS /api/dynamic-pages — CORS preflight handler（PoC v2）
 *
 * 後台 (localhost:5173) PUT JSON 觸發 preflight，這支 handler 回 204 + CORS headers。
 */

import { applyCors } from '~/server/utils/cors';

export default defineEventHandler((event) => {
  applyCors(event);
  setResponseStatus(event, 204);
  return '';
});
