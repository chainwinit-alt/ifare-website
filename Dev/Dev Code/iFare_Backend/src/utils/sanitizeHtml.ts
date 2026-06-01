const BLOCKED_TAGS = new Set([
  'BASE',
  'EMBED',
  'FORM',
  'IFRAME',
  'LINK',
  'META',
  'OBJECT',
  'SCRIPT',
  'STYLE',
]);

const URL_ATTRIBUTES = new Set([
  'action',
  'formaction',
  'href',
  'poster',
  'src',
  'xlink:href',
]);

const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);
const SAFE_DATA_IMAGE_RE = /^data:image\/(?:avif|gif|jpe?g|png|webp);base64,/i;

function isSafeUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith('#') || trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
    return true;
  }
  if (SAFE_DATA_IMAGE_RE.test(trimmed)) return true;

  try {
    return SAFE_PROTOCOLS.has(new URL(trimmed, window.location.origin).protocol);
  } catch {
    return false;
  }
}

function isUnsafeStyle(value: string): boolean {
  return /expression\s*\(|javascript\s*:|url\s*\(\s*['"]?\s*javascript:/i.test(value);
}

export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return '';
  if (typeof document === 'undefined') return '';

  const template = document.createElement('template');
  template.innerHTML = html;

  template.content.querySelectorAll('*').forEach((element) => {
    if (BLOCKED_TAGS.has(element.tagName)) {
      element.remove();
      return;
    }

    Array.from(element.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = attr.value;

      if (name.startsWith('on') || name === 'srcdoc') {
        element.removeAttribute(attr.name);
        return;
      }

      if (name === 'style' && isUnsafeStyle(value)) {
        element.removeAttribute(attr.name);
        return;
      }

      if (URL_ATTRIBUTES.has(name) && !isSafeUrl(value)) {
        element.removeAttribute(attr.name);
      }
    });

    if (element.tagName === 'A' && element.getAttribute('target') === '_blank') {
      element.setAttribute('rel', 'noopener noreferrer');
    }
  });

  return template.innerHTML;
}

// HTML 文字插值用 escape：把 user 可控字串放進 HTML 模板時必須先過這個，避免 XSS
export function escapeHtml(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
