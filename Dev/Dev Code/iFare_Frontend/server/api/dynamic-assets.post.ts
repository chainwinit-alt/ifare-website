import fs from 'node:fs/promises';
import path from 'node:path';
import { applyCors, requireDynamicApiToken } from '~/server/utils/cors';

const ASSET_DIR = path.resolve(process.cwd(), 'server/data/dynamic-assets');
const MAX_FILE_SIZE = 8 * 1024 * 1024;
// multipart body 除了檔案本身還有 boundary/欄位標頭，Content-Length 會略大於檔案；預留 8KB 餘裕。
const MAX_UPLOAD_SIZE = MAX_FILE_SIZE + 8 * 1024;
// MIME → 副檔名白名單對應表。存檔的副檔名一律由此表決定，完全不採用使用者檔名的副檔名，
// 避免被塞入 .html/.aspx 等可被伺服器執行的副檔名。下方仍用 .has() 做白名單檢查。
const ALLOWED_MIME_TYPES = new Map([
  ['image/avif', '.avif'],
  ['image/gif', '.gif'],
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
]);

function getExtension(mimeType: string) {
  // 副檔名一律由 MIME 決定，完全不沿用使用者檔名的副檔名（避免 .html/.aspx 等注入）。
  // mimeType 已在寫入前用白名單擋過，必定命中對應表；仍以 '' 保底以防萬一。
  return ALLOWED_MIME_TYPES.get(mimeType) ?? '';
}

function makeSafeFilename(filename: string, mimeType: string) {
  const basename = path
    .basename(filename, path.extname(filename))
    .replace(/[^\w.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'image';
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return `${basename}-${suffix}${getExtension(mimeType)}`;
}

function getRequestOrigin(event: any) {
  const forwardedProto = String(getHeader(event, 'x-forwarded-proto') || '').toLowerCase();
  const proto = /^(https?)$/.test(forwardedProto) ? forwardedProto : 'http';
  const host = getHeader(event, 'x-forwarded-host') || getHeader(event, 'host') || 'localhost:3000';

  return `${proto}://${host}`;
}

export default defineEventHandler(async (event) => {
  applyCors(event);
  requireDynamicApiToken(event);

  // 先用 Content-Length 擋掉過大的上傳，避免 readMultipartFormData 先把整個 body
  // 讀進記憶體才發現超標而吃滿記憶體（多留 8KB 給 multipart 邊界/欄位標頭）。
  const contentLength = Number(getHeader(event, 'content-length') || 0);
  if (contentLength > MAX_UPLOAD_SIZE) {
    throw createError({ statusCode: 413, statusMessage: 'Image must be smaller than 8MB' });
  }

  const parts = await readMultipartFormData(event);
  const file = parts?.find((part) => part.name === 'file' && part.data?.length);

  if (!file) {
    throw createError({ statusCode: 400, statusMessage: 'Missing image file' });
  }

  const mimeType = file.type || 'application/octet-stream';
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw createError({ statusCode: 415, statusMessage: 'Unsupported image type' });
  }

  if (file.data.length > MAX_FILE_SIZE) {
    throw createError({ statusCode: 413, statusMessage: 'Image must be smaller than 8MB' });
  }

  const filename = makeSafeFilename(file.filename || 'image', mimeType);
  const filePath = path.join(ASSET_DIR, filename);

  await fs.mkdir(ASSET_DIR, { recursive: true });
  await fs.writeFile(filePath, file.data);

  const pathUrl = `/api/dynamic-assets/${encodeURIComponent(filename)}`;

  return {
    ok: true,
    filename,
    path: pathUrl,
    url: `${getRequestOrigin(event)}${pathUrl}`,
  };
});
