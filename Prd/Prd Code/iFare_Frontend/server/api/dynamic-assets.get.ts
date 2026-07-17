/**
 * 2026-05-25 #95 — GET /api/dynamic-assets
 * 列出 server/data/dynamic-assets/ 目錄下所有圖片，供後台 ImagePicker 從媒體庫挑圖。
 * 回傳格式：{ ok: true, assets: [{ filename, size, mtime, url, path }] }
 *
 * 與 dynamic-pages 同一套 CORS / token 保護。
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { applyCors, requireDynamicApiToken } from '~/server/utils/cors';

const ASSET_DIR = path.resolve(process.cwd(), 'server/data/dynamic-assets');
const ALLOWED_EXT = new Set(['.avif', '.gif', '.jpg', '.jpeg', '.png', '.svg', '.webp']);

function getRequestOrigin(event: any) {
  const forwardedProto = String(getHeader(event, 'x-forwarded-proto') || '').toLowerCase();
  const proto = /^(https?)$/.test(forwardedProto) ? forwardedProto : 'http';
  const host = getHeader(event, 'x-forwarded-host') || getHeader(event, 'host') || 'localhost:3000';
  return `${proto}://${host}`;
}

export default defineEventHandler(async (event) => {
  applyCors(event);
  requireDynamicApiToken(event);

  // 確保目錄存在（首次部署可能沒）
  await fs.mkdir(ASSET_DIR, { recursive: true });

  const entries = await fs.readdir(ASSET_DIR, { withFileTypes: true });
  const origin = getRequestOrigin(event);

  const assets = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) continue;

    const filePath = path.join(ASSET_DIR, entry.name);
    const stat = await fs.stat(filePath);
    const urlPath = `/api/dynamic-assets/${encodeURIComponent(entry.name)}`;

    assets.push({
      filename: entry.name,
      size: stat.size,
      mtime: stat.mtime.toISOString(),
      path: urlPath,
      url: `${origin}${urlPath}`,
    });
  }

  // 最新上傳排前面
  assets.sort((a, b) => b.mtime.localeCompare(a.mtime));

  return { ok: true, count: assets.length, assets };
});
