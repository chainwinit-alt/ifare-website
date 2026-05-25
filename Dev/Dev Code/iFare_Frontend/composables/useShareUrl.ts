const FB_SHARE_URL = 'https://www.facebook.com/sharer/sharer.php'

export function useShareUrl() {
  const requestUrl = useRequestURL()

  function getCurrentUrl(): string {
    return import.meta.client ? window.location.href : requestUrl.href
  }

  function getCurrentTitle(): string {
    return import.meta.client && document?.title ? document.title : 'iFare 福利好幫手'
  }

  async function copyCurrentUrl(): Promise<boolean> {
    if (!import.meta.client) return false
    const url = getCurrentUrl()

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
        return true
      }

      const textarea = document.createElement('textarea')
      textarea.value = url
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(textarea)
      return ok
    } catch (error) {
      console.error('[share-url] copy failed', error)
      return false
    }
  }

  function shareCurrentUrlToFacebook() {
    if (!import.meta.client) return
    const target = `${FB_SHARE_URL}?u=${encodeURIComponent(getCurrentUrl())}`
    const popup = window.open(target, '_blank', 'noopener,noreferrer')
    if (!popup) {
      console.warn('[share-url] Facebook popup was blocked')
      // 2026-05-25 UIUX #62 / #48 — 改 toast,附下一步建議
      useToast().warning('分享視窗被瀏覽器阻擋', {
        description: '請點瀏覽器網址列右側的彈出視窗圖示，允許此網站開啟新分頁後重試。',
        duration: 6000,
      })
    }
  }

  function shareCurrentUrlToEmail() {
    if (!import.meta.client) return
    const subject = encodeURIComponent(getCurrentTitle())
    const body = encodeURIComponent(`分享連結：${getCurrentUrl()}`)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  return {
    getCurrentUrl,
    getCurrentTitle,
    copyCurrentUrl,
    shareCurrentUrlToFacebook,
    shareCurrentUrlToEmail,
  }
}
