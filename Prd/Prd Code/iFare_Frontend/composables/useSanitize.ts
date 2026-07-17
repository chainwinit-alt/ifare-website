// 用 isomorphic-dompurify 清理 HTML，防 XSS
// SSR + client 都安全 (isomorphic-dompurify 在 Node 用 jsdom，在瀏覽器用 native DOMPurify)
import DOMPurify from 'isomorphic-dompurify'

// YouTube embed iframe src 白名單 (admin 在編輯器內貼 iframe 時，src 必須符合才能保留)
const YOUTUBE_EMBED_RE = /^https:\/\/(?:www\.)?(?:youtube(?:-nocookie)?\.com\/embed\/[\w-]{11})(?:\?[^"'<>]*)?$/

const DEFAULT_CONFIG: DOMPurify.Config = {
  // 允許常見的內容標籤；iframe 加進來只放行 YouTube embed (見下方 hook)
  ALLOWED_TAGS: [
    'a', 'br', 'p', 'div', 'span', 'strong', 'b', 'em', 'i', 'u',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'img', 'figure', 'figcaption',
    'blockquote', 'code', 'pre', 'hr',
    'sub', 'sup',
    'iframe',
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel', 'src', 'alt', 'title',
    'width', 'height', 'class', 'style',
    'loading', 'referrerpolicy',
    // iframe 嵌入用
    'allow', 'allowfullscreen', 'frameborder', 'sandbox',
  ],
  // 防 javascript: / data: URI 攻擊
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  // 不允許自訂 data-* 屬性 (簡化)
  ALLOW_DATA_ATTR: false,
  // 移除 form / script 等危險標籤 (iframe 從這 list 拿掉，靠下方 hook 限制只放 YouTube)
  FORBID_TAGS: ['script', 'style', 'object', 'embed', 'form', 'input', 'button'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
}

let hookRegistered = false
function ensureHook() {
  if (hookRegistered) return
  // iframe 白名單 hook：src 不符合 YouTube embed 規則就移除整個 iframe
  DOMPurify.addHook('uponSanitizeElement', (node: any, data: any) => {
    if (data.tagName === 'iframe') {
      const src = node.getAttribute?.('src') ?? ''
      if (!YOUTUBE_EMBED_RE.test(src)) {
        // 整個 iframe 拔掉 (DOMPurify 會根據 returned data 處理)
        node.parentNode?.removeChild(node)
      } else {
        // 強制安全屬性：不論 admin 貼的 iframe 帶不帶這些，都套用
        node.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-presentation allow-popups')
        node.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin')
        node.setAttribute('loading', 'lazy')
        // allow 屬性如果有就保留 (先前已在 ALLOWED_ATTR)
      }
    }
  })
  hookRegistered = true
}

/**
 * 清理 HTML 字串，回傳安全可用 v-html 的內容
 * - 移除 script / object / form 等危險標籤
 * - iframe 僅允許 YouTube embed (https://www.youtube.com/embed/<id>)，其他來源整段拔掉
 * - 自動為合法 YouTube iframe 套上 sandbox / referrerpolicy / loading="lazy"
 * @param html 原始 HTML（從 API / CMS 來，可能含惡意 script 或 admin 貼的 iframe）
 */
export function useSanitize(html: string | undefined | null): string {
  if (!html) return ''
  ensureHook()
  return DOMPurify.sanitize(html, DEFAULT_CONFIG) as string
}
