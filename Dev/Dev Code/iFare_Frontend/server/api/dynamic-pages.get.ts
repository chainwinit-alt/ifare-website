/**
 * GET /api/dynamic-pages — 回傳 PageBuilder 全部頁面（PoC v2）
 *
 * 資料來源：server/data/dynamic-pages.json（由後台 PUT 寫入）
 * 檔案不存在或解析失敗 → 回空陣列，前端 fallback 友善
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { applyCors } from '~/server/utils/cors';
import type { DynamicPage } from '~/types/dynamic-page';

const DATA_FILE = path.resolve(process.cwd(), 'server/data/dynamic-pages.json');

export default defineEventHandler(async (event): Promise<DynamicPage[]> => {
  applyCors(event);

  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as DynamicPage[]) : [];
  } catch {
    return [];
  }
});
