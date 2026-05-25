/**
 * UIUX 後臺優化 #3 — 統一 loading / success / failure 回饋
 *
 * Round 14 第三批 Loading 主題，提供後台共用的操作回饋介面：
 *   - success / error / info：包裝 ElMessage，統一文案與錯誤展開
 *   - runAsync：async 操作包裝，自動處理 loading mask + 成功/失敗訊息
 *
 * 設計理由：
 *   1. 目前各頁直接 `ElMessage({ type: 'success', message: '...' })`，
 *      文案散落，errorText 沒展開 Error.message → 失敗難 debug。
 *   2. PageBuilder 目前是 localStorage 同步操作，無 loading 需求；
 *      但 runAsync 預留 loading mask 介面，未來切到後端 API 不用改呼叫端。
 *   3. error() 同時印 console.error 保留 stack，避免錯誤被 ElMessage swallow。
 */

import { h } from 'vue';
import { ElLoading, ElMessage, ElNotification } from 'element-plus';

interface RunAsyncOptions {
  /** 顯示 loading mask 的文案；不傳則不開 mask */
  loadingText?: string;
  /** 成功時的 ElMessage 文案；不傳則不顯示 */
  successText?: string;
  /** 失敗時的 ElMessage 文案前綴，會自動接 `：${err.message}` */
  errorText: string;
  /** 整個畫面 mask（true）還是包覆指定 DOM（傳 element），預設整個畫面 */
  fullscreen?: boolean;
}

export function useFeedback() {
  function success(message: string) {
    ElMessage({ type: 'success', message });
  }

  function error(message: string, err?: unknown) {
    const detail = err instanceof Error && err.message ? `：${err.message}` : '';
    ElMessage({ type: 'error', message: `${message}${detail}` });
    if (err !== undefined) {
      console.error(message, err);
    }
  }

  function info(message: string) {
    ElMessage({ type: 'info', message });
  }

  function warning(message: string, duration?: number) {
    ElMessage({ type: 'warning', message, ...(duration ? { duration } : {}) });
  }

  /**
   * 成功 + 可點擊連結（Day2 升級）
   * 用 ElNotification 而非 ElMessage，因為 ElMessage 不支援多元素 message
   */
  function successWithLink(options: {
    title: string;
    message?: string;
    linkLabel: string;
    linkHref: string;
  }) {
    ElNotification({
      type: 'success',
      title: options.title,
      message: h('span', [
        options.message ? `${options.message} · ` : '',
        h(
          'a',
          {
            href: options.linkHref,
            target: '_blank',
            rel: 'noopener noreferrer',
            style: 'color: #67c23a; text-decoration: underline; cursor: pointer;',
          },
          options.linkLabel,
        ),
      ]),
      duration: 5000,
    });
  }

  /**
   * 2026-05-25 N — 操作 + 可點擊「復原」按鈕（給刪除類的後悔藥用）
   * 例如刪除頁面後 toast 帶「復原」可在 8 秒內救回。
   */
  function successWithUndo(options: {
    title: string;
    message: string;
    undoLabel?: string;
    onUndo: () => void;
    duration?: number;
  }) {
    const notif = ElNotification({
      type: 'warning',
      title: options.title,
      message: h('span', [
        `${options.message} · `,
        h(
          'button',
          {
            type: 'button',
            style:
              'background: transparent; border: 1px solid #e6a23c; color: #e6a23c; cursor: pointer; padding: 2px 10px; border-radius: 999px; font-weight: 700; font-size: 12px;',
            onClick: () => {
              options.onUndo();
              notif.close();
            },
          },
          options.undoLabel || '↶ 復原',
        ),
      ]),
      duration: options.duration ?? 8000,
    });
  }

  async function runAsync<T>(
    fn: () => Promise<T> | T,
    options: RunAsyncOptions,
  ): Promise<{ ok: true; value: T } | { ok: false; error: unknown }> {
    const loading = options.loadingText
      ? ElLoading.service({
          text: options.loadingText,
          fullscreen: options.fullscreen ?? true,
        })
      : null;
    try {
      const value = await fn();
      if (options.successText) success(options.successText);
      return { ok: true, value };
    } catch (err) {
      error(options.errorText, err);
      return { ok: false, error: err };
    } finally {
      loading?.close();
    }
  }

  return { success, error, info, warning, successWithLink, successWithUndo, runAsync };
}
