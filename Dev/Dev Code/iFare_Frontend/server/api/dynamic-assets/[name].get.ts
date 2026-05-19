import fs from 'node:fs';
import path from 'node:path';
import { applyCors } from '~/server/utils/cors';

const ASSET_DIR = path.resolve(process.cwd(), 'server/data/dynamic-assets');

const MIME_TYPES: Record<string, string> = {
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

export default defineEventHandler((event) => {
  applyCors(event);

  const name = getRouterParam(event, 'name') || '';
  const filename = path.basename(decodeURIComponent(name));
  const filePath = path.join(ASSET_DIR, filename);

  if (!filename || !fs.existsSync(filePath)) {
    throw createError({ statusCode: 404, statusMessage: 'Image not found' });
  }

  const mimeType = MIME_TYPES[path.extname(filename).toLowerCase()] || 'application/octet-stream';
  setHeader(event, 'Content-Type', mimeType);
  setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable');

  return sendStream(event, fs.createReadStream(filePath));
});
