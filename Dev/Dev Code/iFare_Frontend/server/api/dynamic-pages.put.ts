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
// 整檔覆寫的 body 上限，避免惡意超大 payload 撐爆記憶體或磁碟。
const MAX_BODY_SIZE = 2 * 1024 * 1024;
// 頁面數量上限；PoC 情境不會有這麼多頁，超過視為異常輸入直接擋掉。
const MAX_PAGES = 500;

export default defineEventHandler(async (event) => {
  applyCors(event);
  requireDynamicApiToken(event);

  // 先用 Content-Length 擋掉過大的 body，才不會等到 readBody 把整包讀進記憶體才發現超標。
  const contentLength = Number(getHeader(event, 'content-length') || 0);
  if (contentLength > MAX_BODY_SIZE) {
    throw createError({ statusCode: 413, statusMessage: 'Payload too large' });
  }

  const body = await readBody<DynamicPage[]>(event);

  if (!Array.isArray(body)) {
    throw createError({ statusCode: 400, statusMessage: 'Body must be an array of DynamicPage' });
  }

  // 輕量 schema 驗證：限制筆數上限，避免一次塞入過多頁面。
  if (body.length > MAX_PAGES) {
    throw createError({ statusCode: 400, statusMessage: `Too many pages (max ${MAX_PAGES})` });
  }

  // 每一筆都必須是非 null 的 plain object，擋掉塞入字串／數字／null／巢狀陣列等
  // 非預期結構，避免污染資料檔並讓後續讀取端崩潰。
  const isPlainObject = (item: unknown): boolean =>
    typeof item === 'object' && item !== null && !Array.isArray(item);

  if (!body.every(isPlainObject)) {
    throw createError({ statusCode: 400, statusMessage: 'Each page must be a plain object' });
  }

  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });

  // 原子寫檔：先寫到同目錄的暫存檔再 rename 成正式檔，避免寫到一半被讀到半截 JSON；
  // try/finally 確保任何失敗（寫入或 rename）都會清掉殘留的暫存檔（rename 成功後暫存檔已不存在，
  // force: true 會忽略 ENOENT）。
  const tempFile = `${DATA_FILE}.${Date.now()}.tmp`;
  try {
    await fs.writeFile(tempFile, JSON.stringify(body, null, 2), 'utf-8');
    await fs.rename(tempFile, DATA_FILE);
  } finally {
    await fs.rm(tempFile, { force: true });
  }

  return { ok: true, count: body.length };
});
