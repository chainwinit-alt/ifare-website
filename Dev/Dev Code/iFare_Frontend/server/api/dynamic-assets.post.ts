import fs from 'node:fs/promises';
import path from 'node:path';
import { applyCors } from '~/server/utils/cors';

const ASSET_DIR = path.resolve(process.cwd(), 'server/data/dynamic-assets');
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'image/webp',
]);

function getExtension(filename: string, mimeType: string) {
  const ext = path.extname(filename).toLowerCase();
  if (ext) return ext;

  switch (mimeType) {
    case 'image/avif':
      return '.avif';
    case 'image/gif':
      return '.gif';
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/svg+xml':
      return '.svg';
    case 'image/webp':
      return '.webp';
    default:
      return '';
  }
}

function makeSafeFilename(filename: string, mimeType: string) {
  const basename = path
    .basename(filename, path.extname(filename))
    .replace(/[^\w.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'image';
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return `${basename}-${suffix}${getExtension(filename, mimeType)}`;
}

function getRequestOrigin(event: any) {
  const forwardedProto = String(getHeader(event, 'x-forwarded-proto') || '').toLowerCase();
  const proto = /^(https?)$/.test(forwardedProto) ? forwardedProto : 'http';
  const host = getHeader(event, 'x-forwarded-host') || getHeader(event, 'host') || 'localhost:3000';

  return `${proto}://${host}`;
}

export default defineEventHandler(async (event) => {
  applyCors(event);

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
