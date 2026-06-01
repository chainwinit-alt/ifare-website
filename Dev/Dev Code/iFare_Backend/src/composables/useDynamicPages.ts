/**
 * UIUX 後臺優化 #X — 動態頁面管理 (CMS) v2 — Section 範本式
 *
 * v2 設計原則：「範本拉抓」式 — 後台選 iFare 設計語言的 section 範本，填內容，
 * 前端就會呈現跟 about / collaborator / news 等頁同樣的視覺。
 *
 * 拋棄 v1 的 10 種泛用 block，改提供 5 種 iFare 設計語言 section 範本：
 *   - hero         頁面標題（中文標 + 英文陰影副標 + 副標）— 像 PARTNER / NEWS / ARTICLE
 *   - text-section 內文段落（h2 副標 + 多段內文）
 *   - four-card    4 個 icon + 標題 + 描述卡片橫排（像 about purpose-list）
 *   - image-text   圖文左右並列（左圖右文 / 左文右圖）
 *   - cta-card     兩欄 CTA 卡（像 about 底部 .card-advance）
 */

import { ref, computed } from 'vue';
import { syncPagesToFrontend, type SyncResult } from '@/utils/frontendSync';

// ============================================================
// 類型定義
// ============================================================

export type IconKey =
  | 'heart'        // ♡ 心 — 一起加入行動
  | 'people'       // 👥 人 + plus — 成為志工
  | 'handshake'    // 🤝 連結 — 合作夥伴
  | 'gift'         // 🎁 禮物 — 支持
  | 'star'         // ⭐ 星
  | 'book'         // 📖 書
  | 'leaf'         // 🌿 葉
  | 'lightbulb';   // 💡 燈泡

export type SectionType =
  | 'hero'
  | 'text-section'
  | 'four-card'
  | 'image-text'
  | 'cta-card';

export interface HeroSection {
  id: string;
  type: 'hero';
  /** 中文主標題（大字） */
  title: string;
  /** 英文陰影副標（背景大字，像 PARTNER / ARTICLE） */
  shadowText: string;
  /** 副標（選填） */
  subtitle?: string;
}

export interface TextSectionSection {
  id: string;
  type: 'text-section';
  /** 區段標題（h2） */
  title: string;
  /** 多段內文（每段一個 paragraph） */
  paragraphs: string[];
}

export interface FourCardItem {
  icon: IconKey;
  title: string;
  description: string;
}

export interface FourCardSection {
  id: string;
  type: 'four-card';
  /** 區段標題（選填） */
  title?: string;
  /** 4 張卡（建議 4 張，最少 1 最多 6） */
  cards: FourCardItem[];
}

export interface ImageTextSection {
  id: string;
  type: 'image-text';
  /** 圖在左還是右 */
  imagePosition: 'left' | 'right';
  imageSrc: string;
  imageAlt: string;
  title: string;
  content: string;
  /** 可選 CTA 按鈕 */
  ctaText?: string;
  ctaUrl?: string;
}

export interface CtaCardItem {
  title: string;
  ctaText: string;
  ctaUrl: string;
}

export interface CtaCardSection {
  id: string;
  type: 'cta-card';
  /** 兩個 CTA 卡（也可 1 或 3） */
  cards: CtaCardItem[];
}

export type Section =
  | HeroSection
  | TextSectionSection
  | FourCardSection
  | ImageTextSection
  | CtaCardSection;

export type PageStatus = 'draft' | 'published' | 'unpublished';

export interface DynamicPage {
  id: string;
  slug: string;
  title: string;
  metaDescription: string;

  // 進階欄位（前台不一定用得到，但 SEO / 社群分享需要）
  coverImage?: string;
  coverImageAlt?: string;
  ogImage?: string;
  publishTime?: string | null;
  unpublishTime?: string | null;
  tags?: string[];
  author?: string;

  /** v2: 改用 sections（取代 v1 blocks） */
  sections: Section[];
  /** v1 殘留欄位（向後相容讀取） */
  blocks?: any[];

  status: PageStatus;
  createDate: string;
  updateDate: string;
}

// ============================================================
// localStorage Adapter
// ============================================================

const STORAGE_KEY = 'iFare_dynamic_pages_v2';
const LEGACY_KEY = 'iFare_dynamic_pages_v1';

function readAll(): DynamicPage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    }
    // v1 → v2 migration: 把 blocks 包進一個 text-section
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (Array.isArray(parsed)) {
        return parsed.map(migrateV1ToV2);
      }
    }
    return [];
  } catch (err) {
    console.error('[DynamicPages] localStorage 解析失敗', err);
    return [];
  }
}

function migrateV1ToV2(v1Page: any): DynamicPage {
  // 把 v1 blocks 簡單合併成一個 text-section（內容為純文字）
  const paragraphs: string[] = [];
  if (Array.isArray(v1Page.blocks)) {
    for (const b of v1Page.blocks) {
      if (typeof b?.text === 'string' && b.text.trim()) paragraphs.push(b.text);
    }
  }
  const sections: Section[] = paragraphs.length
    ? [{ id: uuid(), type: 'text-section', title: '內容', paragraphs }]
    : [];
  return {
    ...v1Page,
    sections,
  };
}

// 2026-05-25：把最後一次同步的 Promise 記下來，AddEditView.onSave 可 await
// 拿到結果做降級提示，避免「儲存成功 → 同步失敗」的假成功。
let lastSyncPromise: Promise<SyncResult> = Promise.resolve({ ok: true });

function writeAll(pages: DynamicPage[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
  // 仍是 fire-and-forget（writeAll 本身不阻塞），但結果可被 waitForLastSync 撿起
  lastSyncPromise = syncPagesToFrontend(pages);
}

export function waitForLastSync(): Promise<SyncResult> {
  return lastSyncPromise;
}

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function nowIso(): string {
  return new Date().toISOString();
}

// ============================================================
// 預設值 / 工具
// ============================================================

export function createDefaultSection(type: SectionType): Section {
  const id = uuid();
  switch (type) {
    case 'hero':
      return {
        id,
        type,
        title: '頁面標題',
        shadowText: 'TITLE',
        subtitle: '',
      };
    case 'text-section':
      return {
        id,
        type,
        title: '段落標題',
        paragraphs: [''],
      };
    case 'four-card':
      return {
        id,
        type,
        title: '',
        cards: [
          { icon: 'heart', title: '一起加入行動', description: '說明文字' },
          { icon: 'people', title: '成為志工', description: '說明文字' },
          { icon: 'handshake', title: '成為合作夥伴', description: '說明文字' },
          { icon: 'gift', title: '支持我們', description: '說明文字' },
        ],
      };
    case 'image-text':
      return {
        id,
        type,
        imagePosition: 'left',
        imageSrc: '',
        imageAlt: '',
        title: '段落標題',
        content: '段落內容',
        ctaText: '',
        ctaUrl: '',
      };
    case 'cta-card':
      return {
        id,
        type,
        cards: [
          { title: '邀請你體驗 i-Fare 服務', ctaText: '前往 i-Fare', ctaUrl: '/ifare' },
          { title: '進一步瞭解我們的行動', ctaText: '查看最新消息', ctaUrl: '/news' },
        ],
      };
  }
}

export function createDefaultPage(): Omit<DynamicPage, 'id' | 'createDate' | 'updateDate'> {
  return {
    slug: '',
    title: '',
    metaDescription: '',
    coverImage: '',
    coverImageAlt: '',
    ogImage: '',
    publishTime: null,
    unpublishTime: null,
    tags: [],
    author: '',
    sections: [],
    // PoC v2 Day2-fix：預設「已發布」，符合「按下新增就到前端」體驗
    // 想當草稿仍可主動切回；工程化時應改回 draft 並補審核流程
    status: 'published',
  };
}

export function duplicateSection(s: Section): Section {
  const copy = JSON.parse(JSON.stringify(s));
  copy.id = uuid();
  return copy;
}

export function slugify(text: string): string {
  if (!text.trim()) return `page-${Date.now()}`;
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w一-龥-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export const SECTION_TYPE_META: Record<
  SectionType,
  { label: string; icon: string; description: string }
> = {
  hero: {
    label: '頁面標題',
    icon: '🎯',
    description: '中文標題 + 英文陰影副標（像「公益夥伴 PARTNER」）',
  },
  'text-section': {
    label: '內文段落',
    icon: '📝',
    description: '副標題 + 多段內文',
  },
  'four-card': {
    label: '4 卡片橫排',
    icon: '🎴',
    description: '4 個 icon + 標題 + 描述卡片（像「一起加入行動 / 成為志工」）',
  },
  'image-text': {
    label: '圖文並列',
    icon: '🖼️',
    description: '左圖右文（或左文右圖）+ 可選 CTA',
  },
  'cta-card': {
    label: '雙欄 CTA',
    icon: '🔘',
    description: '兩個並列導頁卡片（像 about 底部「邀請體驗 i-Fare」）',
  },
};

// 2026-05-25 #92 + #91 — 常用 section 組合，一鍵在編輯頁版型元件庫插多個 sections
export interface SectionCombo {
  key: string;
  label: string;
  description: string;
  icon: string;
  sectionTypes: SectionType[];
}

export const SECTION_COMBOS: SectionCombo[] = [
  {
    key: 'intro',
    label: '介紹組',
    description: '主視覺 + 介紹文 + 行動卡',
    icon: '📖',
    sectionTypes: ['hero', 'text-section', 'cta-card'],
  },
  {
    key: 'service',
    label: '服務介紹組',
    description: '主視覺 + 四欄重點 + 圖文流程',
    icon: '🎯',
    sectionTypes: ['hero', 'four-card', 'image-text'],
  },
  {
    key: 'event',
    label: '活動報名組',
    description: '主視覺 + 活動圖文 + 行動卡',
    icon: '🎟️',
    sectionTypes: ['hero', 'image-text', 'cta-card'],
  },
  {
    key: 'story',
    label: '故事敘述組',
    description: '主視覺 + 兩段圖文左右交錯',
    icon: '✨',
    sectionTypes: ['hero', 'image-text', 'image-text'],
  },
];

export function buildSectionsFromCombo(comboKey: string): Section[] {
  const combo = SECTION_COMBOS.find((c) => c.key === comboKey);
  if (!combo) return [];
  return combo.sectionTypes.map((type, idx) => {
    const section = createDefaultSection(type);
    // 同組合 2 個 image-text 時自動交錯左右，省得手動切
    if (section.type === 'image-text') {
      section.imagePosition = idx % 2 === 0 ? 'left' : 'right';
    }
    return section;
  });
}

export const ICON_OPTIONS: { key: IconKey; label: string; svg: string }[] = [
  {
    key: 'heart',
    label: '心',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 5.5-7 10-7 10z"/></svg>',
  },
  {
    key: 'people',
    label: '人 + 加號',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7" r="3.2"/><path d="M3 21v-1a6 6 0 0 1 12 0v1"/><path d="M19 8v6M16 11h6"/></svg>',
  },
  {
    key: 'handshake',
    label: '合作',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m11 17-4 4-3.5-3.5L7 14M13 7l4-4 3.5 3.5L17 10"/><path d="m8 13 5-5"/></svg>',
  },
  {
    key: 'gift',
    label: '禮物',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12V8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v4"/><path d="M2 12h20v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8z"/><path d="M12 22V6"/></svg>',
  },
  {
    key: 'star',
    label: '星',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  },
  {
    key: 'book',
    label: '書',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
  },
  {
    key: 'leaf',
    label: '葉子',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 4 13c0-2 1-4 4-7c2 1 6 5 6 8a4 4 0 0 1-3 6Z"/><path d="M11 20c.5-3 0-7-3-12"/></svg>',
  },
  {
    key: 'lightbulb',
    label: '燈泡',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.7.6 1 1.4 1 2.3h6c0-.9.3-1.7 1-2.3A7 7 0 0 0 12 2z"/></svg>',
  },
];

export const PAGE_STATUS_LABELS: Record<PageStatus, string> = {
  draft: '草稿',
  published: '已發布',
  unpublished: '已下架',
};

export function isSectionEmpty(s: Section): boolean {
  switch (s.type) {
    case 'hero':
      return !s.title.trim();
    case 'text-section':
      return !s.title.trim() && s.paragraphs.every((p) => !p.trim());
    case 'four-card':
      return s.cards.every((c) => !c.title.trim());
    case 'image-text':
      return !s.title.trim() && !s.content.trim() && !s.imageSrc.trim();
    case 'cta-card':
      return s.cards.every((c) => !c.title.trim());
  }
}

// ============================================================
// 驗證
// ============================================================

export interface ValidationError {
  field: string;
  message: string;
  sectionId?: string;
}

export interface ImportAnalysis {
  ok: boolean;
  error?: string;
  version?: string;
  pages?: DynamicPage[];
  added?: number;
  overwritten?: number;
  overwrittenTitles?: string[];
}

export function validatePage(
  page: DynamicPage,
  isSlugConflict: (slug: string, ignoreId?: string) => boolean,
  ignoreId?: string,
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!page.title.trim()) {
    errors.push({ field: 'title', message: '【頁面標題】不可為空' });
  }
  if (!page.slug.trim()) {
    errors.push({ field: 'slug', message: '【頁面網址】不可為空' });
  } else if (!/^[a-zA-Z0-9_/一-龥-]+$/.test(page.slug)) {
    errors.push({
      field: 'slug',
      message: '頁面網址僅允許英數字、中文、連字號、底線、斜線',
    });
  } else if (isSlugConflict(page.slug, ignoreId)) {
    errors.push({ field: 'slug', message: `頁面網址已被使用：/${page.slug}` });
  }

  if (page.publishTime && page.unpublishTime) {
    const pub = new Date(page.publishTime).getTime();
    const unpub = new Date(page.unpublishTime).getTime();
    if (pub >= unpub) {
      errors.push({ field: 'unpublishTime', message: '下架時間必須晚於上架時間' });
    }
  }

  page.sections.forEach((s, idx) => {
    if (isSectionEmpty(s)) {
      errors.push({
        field: 'section',
        sectionId: s.id,
        message: `第 ${idx + 1} 個區段（${SECTION_TYPE_META[s.type].label}）內容未填`,
      });
    }
  });

  return errors;
}

// ============================================================
// Composable: 提供 CRUD + reactive list
// ============================================================

export function useDynamicPages() {
  const pages = ref<DynamicPage[]>([]);

  function reload() {
    pages.value = readAll();
  }

  reload();

  function isSlugConflict(slug: string, ignoreId?: string): boolean {
    return pages.value.some((p) => p.slug === slug && p.id !== ignoreId);
  }

  function getById(id: string): DynamicPage | undefined {
    return pages.value.find((p) => p.id === id);
  }

  function getBySlug(slug: string): DynamicPage | undefined {
    return pages.value.find((p) => p.slug === slug);
  }

  function insert(input: Omit<DynamicPage, 'id' | 'createDate' | 'updateDate'>): DynamicPage {
    const now = nowIso();
    const page: DynamicPage = {
      id: uuid(),
      createDate: now,
      updateDate: now,
      ...input,
    };
    pages.value.push(page);
    writeAll(pages.value);
    return page;
  }

  function update(id: string, input: Partial<Omit<DynamicPage, 'id' | 'createDate'>>): boolean {
    const idx = pages.value.findIndex((p) => p.id === id);
    if (idx < 0) return false;
    pages.value[idx] = {
      ...pages.value[idx],
      ...input,
      updateDate: nowIso(),
    };
    writeAll(pages.value);
    return true;
  }

  function remove(id: string): boolean {
    const idx = pages.value.findIndex((p) => p.id === id);
    if (idx < 0) return false;
    pages.value.splice(idx, 1);
    writeAll(pages.value);
    return true;
  }

  /**
   * 2026-05-25 #93 真複製 — 把整筆 source 深拷一份：
   * - id / section.id 重生避免衝突
   * - title 加「副本」
   * - slug 套 -copy（衝突自動補 -copy-2 / -copy-3 …）
   * - status 強制 'draft'，避免不小心發布到正式站
   * - publishTime / unpublishTime 清空
   * - createDate / updateDate 重設為 now
   */
  function duplicate(id: string): DynamicPage | null {
    const source = pages.value.find((p) => p.id === id);
    if (!source) return null;

    const copy: DynamicPage = JSON.parse(JSON.stringify(source));
    copy.id = uuid();
    copy.title = `${source.title?.trim() || '未命名頁面'} 副本`;

    const baseSlug = (source.slug || 'page').replace(/-copy(?:-\d+)?$/i, '') || 'page';
    let candidate = `${baseSlug}-copy`;
    let n = 2;
    while (isSlugConflict(candidate)) {
      candidate = `${baseSlug}-copy-${n}`;
      n += 1;
    }
    copy.slug = candidate;

    copy.status = 'draft';
    copy.publishTime = null;
    copy.unpublishTime = null;

    const now = nowIso();
    copy.createDate = now;
    copy.updateDate = now;

    if (Array.isArray(copy.sections)) {
      copy.sections = copy.sections.map((s) => ({ ...s, id: uuid() })) as Section[];
    } else {
      copy.sections = [];
    }

    pages.value.push(copy);
    writeAll(pages.value);
    return copy;
  }

  // 2026-05-25 S — schema 版本包裝：匯出帶 version + exportedAt，未來改 DynamicPage schema 才能擋住舊版匯入
  function exportJson(): string {
    return JSON.stringify(
      {
        version: 'v2',
        exportedAt: new Date().toISOString(),
        pages: pages.value,
      },
      null,
      2,
    );
  }

  function analyzeImportJson(json: string): ImportAnalysis {
    try {
      const parsed = JSON.parse(json);

      // 兩種格式：新版 { version, pages } 或舊版裸陣列（向後相容）
      let pagesArray: DynamicPage[];
      let version = 'v1-array';
      if (Array.isArray(parsed)) {
        pagesArray = parsed;
      } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.pages)) {
        if (parsed.version !== 'v2') {
          return {
            ok: false,
            error: `不支援的版本：${parsed.version || '未知'}（目前僅支援 v2 或舊版裸陣列）`,
          };
        }
        version = parsed.version;
        pagesArray = parsed.pages;
      } else {
        return { ok: false, error: '格式錯誤：應為 { version, pages } 或頁面陣列' };
      }

      // 算 diff：哪些是新增、哪些會覆蓋既有
      const existing = new Map(pages.value.map((p) => [p.id, p]));
      const overwrittenTitles: string[] = [];
      let addedCount = 0;

      for (const p of pagesArray) {
        if (!p || !p.id) continue;
        if (existing.has(p.id)) {
          overwrittenTitles.push(existing.get(p.id)!.title || p.title || '(未命名)');
        } else {
          addedCount += 1;
        }
      }

      return {
        ok: true,
        version,
        pages: pagesArray,
        added: addedCount,
        overwritten: overwrittenTitles.length,
        overwrittenTitles,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'JSON 解析失敗';
      return { ok: false, error: message };
    }
  }

  function applyImportPages(incoming: DynamicPage[]): number {
    const map = new Map(pages.value.map((p) => [p.id, p]));
    for (const p of incoming) {
      if (p && p.id) map.set(p.id, p);
    }
    pages.value = Array.from(map.values());
    writeAll(pages.value);
    return incoming.length;
  }

  // 保留舊 API（無確認直接 commit）給可能還在用的呼叫端；新流程建議走 analyze + apply
  function importJson(json: string): { ok: boolean; count: number; error?: string } {
    const analysis = analyzeImportJson(json);
    if (!analysis.ok) return { ok: false, count: 0, error: analysis.error };
    const count = applyImportPages(analysis.pages!);
    return { ok: true, count };
  }

  const total = computed(() => pages.value.length);
  const published = computed(() => pages.value.filter((p) => p.status === 'published').length);
  const drafts = computed(() => pages.value.filter((p) => p.status === 'draft').length);

  return {
    pages,
    total,
    published,
    drafts,
    reload,
    isSlugConflict,
    getById,
    getBySlug,
    insert,
    update,
    remove,
    duplicate,
    exportJson,
    importJson,
    analyzeImportJson,
    applyImportPages,
  };
}
