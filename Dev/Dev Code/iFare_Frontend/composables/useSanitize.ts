// 用 isomorphic-dompurify 清理 HTML，防 XSS
// SSR + client 都安全 (isomorphic-dompurify 在 Node 用 jsdom，在瀏覽器用 native DOMPurify)
import DOMPurify from 'isomorphic-dompurify'

const DEFAULT_CONFIG: DOMPurify.Config = {
  // 允許常見的內容標籤
  ALLOWED_TAGS: [
    'a', 'br', 'p', 'div', 'span', 'strong', 'b', 'em', 'i', 'u',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'img', 'figure', 'figcaption',
    'blockquote', 'code', 'pre', 'hr',
    'sub', 'sup',
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel', 'src', 'alt', 'title',
    'width', 'height', 'class', 'style',
    'loading', 'referrerpolicy',
  ],
  // 防 javascript: / data: URI 攻擊
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  // 不允許自訂 data-* 屬性 (簡化)
  ALLOW_DATA_ATTR: false,
  // 移除 form / script 等危險標籤 (預設行為，明示)
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
}

/**
 * 清理 HTML 字串，回傳安全可用 v-html 的內容
 * @param html 原始 HTML（從 API / CMS 來，可能含惡意 script）
 */
export function useSanitize(html: string | undefined | null): string {
  if (!html) return ''
  return DOMPurify.sanitize(html, DEFAULT_CONFIG) as string
}
