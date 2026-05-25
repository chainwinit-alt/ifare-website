// 2026-05-25 UIUX #62 — 全站 Toast 通知系統
// 用 Nuxt useState 做跨組件共享狀態，AppToastStack 訂閱顯示
// API: const { success, error, warning, info, show, dismiss } = useToast()

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastOptions {
  /** 顯示時長 (ms)；0 = 不自動消失，需手動關 */
  duration?: number
  /** 操作按鈕；給「下一步」這類需要使用者回應的提示用 */
  action?: ToastAction
  /** 額外描述，顯示在主訊息下方小字 */
  description?: string
}

export interface ToastItem extends Required<Omit<ToastOptions, 'action' | 'description'>> {
  id: number
  type: ToastType
  message: string
  action?: ToastAction
  description?: string
  createdAt: number
}

const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 3000,
  info: 3500,
  warning: 5000,
  error: 6000, // error 多留時間給使用者看下一步建議
}

let nextId = 1

export function useToast() {
  const toasts = useState<ToastItem[]>('app-toasts', () => [])

  function show(type: ToastType, message: string, opts: ToastOptions = {}): number {
    const id = nextId++
    const duration = opts.duration ?? DEFAULT_DURATIONS[type]
    const item: ToastItem = {
      id,
      type,
      message,
      description: opts.description,
      action: opts.action,
      duration,
      createdAt: Date.now(),
    }

    toasts.value = [...toasts.value, item]

    if (duration > 0) {
      setTimeout(() => dismiss(id), duration)
    }

    return id
  }

  function dismiss(id: number): void {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function dismissAll(): void {
    toasts.value = []
  }

  return {
    toasts,
    show,
    dismiss,
    dismissAll,
    success: (message: string, opts?: ToastOptions) => show('success', message, opts),
    error: (message: string, opts?: ToastOptions) => show('error', message, opts),
    warning: (message: string, opts?: ToastOptions) => show('warning', message, opts),
    info: (message: string, opts?: ToastOptions) => show('info', message, opts),
  }
}
