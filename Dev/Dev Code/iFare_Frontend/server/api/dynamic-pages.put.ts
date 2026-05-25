/**
 * PUT /api/dynamic-pages — 後台儲存時整批覆蓋 PageBuilder 頁面（PoC v2）
 *
 * 後台 useDynamicPages.writeAll() 在 localStorage.setItem 後 fire-and-forget 呼叫此 endpoint。
 * 寫入 server/data/dynamic-pages.json（recursive mkdir）。
 * dev 環境用 wildcard CORS，prod 上線要改白名單。
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { applyCors, requireDynamicApiToken } from '~/server/utils/cors';
import type { DynamicPage } from '~/types/dynamic-page';

const DATA_FILE = path.resolve(process.cwd(), 'server/data/dynamic-pages.json');

export default defineEventHandler(async (event) => {
  applyCors(event);
  requireDynamicApiToken(event);

  const body = await readBody<DynamicPage[]>(event);

  if (!Array.isArray(body)) {
    throw createError({ statusCode: 400, statusMessage: 'Body must be an array of DynamicPage' });
  }

  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(body, null, 2), 'utf-8');

  return { ok: true, count: body.length };
});
