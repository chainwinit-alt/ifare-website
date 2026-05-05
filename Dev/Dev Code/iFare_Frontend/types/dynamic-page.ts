/**
 * 動態頁面類型 — 鏡像 iFare_Backend src/composables/useDynamicPages.ts
 * 兩邊 schema 必須保持一致；之後接上後端 API 時改自 server schema 同步
 */

export type IconKey =
  | 'heart' | 'people' | 'handshake' | 'gift' | 'star' | 'book' | 'leaf' | 'lightbulb';

export type SectionType =
  | 'hero' | 'text-section' | 'four-card' | 'image-text' | 'cta-card';

export interface HeroSection {
  id: string;
  type: 'hero';
  title: string;
  shadowText: string;
  subtitle?: string;
}

export interface TextSectionSection {
  id: string;
  type: 'text-section';
  title: string;
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
  title?: string;
  cards: FourCardItem[];
}

export interface ImageTextSection {
  id: string;
  type: 'image-text';
  imagePosition: 'left' | 'right';
  imageSrc: string;
  imageAlt: string;
  title: string;
  content: string;
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
  coverImage?: string;
  coverImageAlt?: string;
  ogImage?: string;
  publishTime?: string | null;
  unpublishTime?: string | null;
  tags?: string[];
  author?: string;
  sections: Section[];
  status: PageStatus;
  createDate: string;
  updateDate: string;
}

// 8 種 icon 的 SVG（與後台保持一致）
export const ICON_SVG: Record<IconKey, string> = {
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 5.5-7 10-7 10z"/></svg>',
  people: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7" r="3.2"/><path d="M3 21v-1a6 6 0 0 1 12 0v1"/><path d="M19 8v6M16 11h6"/></svg>',
  handshake: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m11 17-4 4-3.5-3.5L7 14M13 7l4-4 3.5 3.5L17 10"/><path d="m8 13 5-5"/></svg>',
  gift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12V8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v4"/><path d="M2 12h20v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8z"/><path d="M12 22V6"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
  leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 4 13c0-2 1-4 4-7c2 1 6 5 6 8a4 4 0 0 1-3 6Z"/><path d="M11 20c.5-3 0-7-3-12"/></svg>',
  lightbulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.7.6 1 1.4 1 2.3h6c0-.9.3-1.7 1-2.3A7 7 0 0 0 12 2z"/></svg>',
};
