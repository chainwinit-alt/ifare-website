// 用 DOMPurify 清理富文本 HTML，避免 v-html 直接渲染時被植入的 script 執行 (stored XSS)
// 設定與前台 iFare_Frontend/composables/useSanitize.ts 對齊，讓後台預覽與前台呈現一致
import DOMPurify from 'dompurify'
import type { Config } from 'dompurify'

// YouTube embed iframe src 白名單 (編輯器內貼的 iframe，src 必須符合才會保留)
const YOUTUBE_EMBED_RE = /^https:\/\/(?:www\.)?(?:youtube(?:-nocookie)?\.com\/embed\/[\w-]{11})(?:\?[^"'<>]*)?$/

const DEFAULT_CONFIG: Config = {
    // 允許 TinyMCE 常用的內容標籤 (標題、清單、表格、連結、圖片…)
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
    ALLOW_DATA_ATTR: false,
    // 危險標籤 (iframe 不在此，改由下方 hook 只放行 YouTube)
    FORBID_TAGS: ['script', 'style', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
}

let hookRegistered = false
function ensureHook() {
    if (hookRegistered) return
    // iframe 白名單 hook：src 不是 YouTube embed 就整個拔掉
    DOMPurify.addHook('uponSanitizeElement', (node: any, data: any) => {
        if (data.tagName != 'iframe') return
        const src = node.getAttribute?.('src') ?? ''
        if (!YOUTUBE_EMBED_RE.test(src)) {
            node.parentNode?.removeChild(node)
            return
        }
        // 合法的 YouTube iframe 一律補上安全屬性
        node.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-presentation allow-popups')
        node.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin')
        node.setAttribute('loading', 'lazy')
    })
    hookRegistered = true
}

/**
 * 清理 HTML 字串，回傳可安全用於 v-html 的內容
 * @param html 原始 HTML (來自 API / TinyMCE，可能含惡意內容)
 */
export function sanitizeHtml(html: string | undefined | null): string {
    if (!html) return ''
    ensureHook()
    return DOMPurify.sanitize(html, DEFAULT_CONFIG) as string
}

export default sanitizeHtml
