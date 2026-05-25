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
  /** 2026-05-25 #48 — 失敗時除了 errorText 外的「下一步」建議文案 */
  nextStep?: string;
}

// 2026-05-25 #48 — 依 error 類型自動建議「下一步」
// 用於補強 error 訊息：不只說失敗，還要告訴使用者該怎麼辦
export function guessNextStep(err: unknown): string {
  if (!err) return '請重試一次；若持續失敗,請截圖回報管理員。';

  // ApiError 風格（前端有 category/status 欄位）
  const e = err as { category?: string; status?: number; message?: string };
  const status = e.status ?? 0;
  const category = e.category ?? '';
  const msg = String(e.message ?? err).toLowerCase();

  if (category === 'timeout' || /timeout|逾時/i.test(msg)) {
    return '請求逾時 — 伺服器可能忙碌中,請稍後再試;若超過 5 分鐘仍失敗,請通知管理員。';
  }
  if (category === 'network' || /network|fetch failed|連線|斷線/i.test(msg)) {
    return '網路連線異常 — 請檢查網路後重新整理頁面;手機可試切換 Wi-Fi / 行動網路。';
  }
  if (status === 401 || /unauthorized|登入|expired/i.test(msg)) {
    return '登入已過期 — 請重新登入後再操作。';
  }
  if (status === 403 || /forbidden|permission|權限/i.test(msg)) {
    return '您沒有此操作的權限 — 請聯絡管理員授權,或改用具備權限的帳號。';
  }
  if (status === 404 || /not found|找不到/i.test(msg)) {
    return '找不到對應資料 — 可能已被刪除或網址有誤,請回列表重新整理。';
  }
  if (status === 409 || /conflict|重複|duplicate/i.test(msg)) {
    return '資料衝突 — 同樣的代碼 / 網址已被使用,請改用其他名稱。';
  }
  if (status === 413 || /too large|超過|size/i.test(msg)) {
    return '檔案過大 — 請壓縮後再上傳(建議圖片 < 2MB,可用 tinypng.com 壓縮)。';
  }
  if (status >= 500 || /server|internal error/i.test(msg)) {
    return '伺服器暫時無法回應 — 請等 1-2 分鐘後再試;若持續失敗,請通知管理員。';
  }
  return '請重試一次;若持續失敗,請截圖此畫面回報管理員。';
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

  /**
   * 2026-05-25 #48 — 錯誤訊息附下一步建議
   * 用 ElNotification 而非 ElMessage,因為要顯示多行（標題 + 原因 + 下一步）
   *
   * 用法:
   *   errorWithNextStep({ title: '儲存失敗', err, nextStep: '請檢查網路後重試' });
   *   // nextStep 不傳的話會用 guessNextStep(err) 自動猜
   */
  function errorWithNextStep(options: {
    /** 主訊息,例如「儲存失敗」 */
    title: string;
    /** 失敗原因(選填),會顯示在標題下方;不傳則用 err.message */
    reason?: string;
    /** 「下一步」建議;不傳則用 guessNextStep(err) 自動推測 */
    nextStep?: string;
    /** 操作按鈕(選填),例如「重新整理」「前往登入」 */
    action?: { label: string; onClick: () => void };
    /** 原始 error 物件,會 console.error + 用來推測下一步 */
    err?: unknown;
    /** 顯示時長 ms,預設 8000;0 = 不自動關 */
    duration?: number;
  }) {
    const reason =
      options.reason ||
      (options.err instanceof Error && options.err.message ? options.err.message : '');
    const nextStep = options.nextStep || guessNextStep(options.err);
    const action = options.action;

    const notif = ElNotification({
      type: 'error',
      title: options.title,
      message: h('div', { style: 'line-height: 1.7' }, [
        reason
          ? h('div', { style: 'color: #606266; margin-bottom: 6px;' }, `原因：${reason}`)
          : null,
        h(
          'div',
          { style: 'background: #fef3e8; border-left: 3px solid #ea5504; padding: 6px 10px; border-radius: 4px; color: #303133;' },
          [
            h('strong', { style: 'color: #ea5504;' }, '下一步：'),
            ' ',
            nextStep,
          ],
        ),
        action
          ? h(
              'button',
              {
                type: 'button',
                style:
                  'margin-top: 8px; background: #ea5504; border: 0; color: #fff; cursor: pointer; padding: 4px 14px; border-radius: 6px; font-weight: 700; font-size: 12px;',
                onClick: () => {
                  action.onClick();
                  notif.close();
                },
              },
              action.label,
            )
          : null,
      ]),
      duration: options.duration ?? 8000,
    });

    if (options.err !== undefined) {
      console.error(options.title, options.err);
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
   * 2026-05-25 #62 後台版 — 標題 + 描述 + 可選 action 按鈕的成功訊息
   * 跟前端 toast 風格對齊：主訊息 + 描述 + 立即動作（例如「立即編輯」「再來一筆」）
   *
   * 用法:
   *   successWithAction({
   *     title: '頁面已建立',
   *     description: '已存為草稿,可繼續編輯內容',
   *     action: { label: '立即編輯 →', onClick: () => router.push(...) },
   *   });
   */
  function successWithAction(options: {
    title: string;
    description?: string;
    action?: { label: string; onClick: () => void };
    duration?: number;
  }) {
    const notif = ElNotification({
      type: 'success',
      title: options.title,
      message: h('div', { style: 'line-height: 1.7' }, [
        options.description
          ? h('div', { style: 'color: #606266; margin-bottom: 6px;' }, options.description)
          : null,
        options.action
          ? h(
              'button',
              {
                type: 'button',
                style:
                  'background: #67c23a; border: 0; color: #fff; cursor: pointer; padding: 4px 14px; border-radius: 6px; font-weight: 700; font-size: 12px;',
                onClick: () => {
                  options.action!.onClick();
                  notif.close();
                },
              },
              options.action.label,
            )
          : null,
      ]),
      duration: options.duration ?? 5000,
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
      // 2026-05-25 #48 — 失敗時若有 nextStep 或想要更詳細的引導,改用 errorWithNextStep
      if (options.nextStep) {
        errorWithNextStep({ title: options.errorText, nextStep: options.nextStep, err });
      } else {
        error(options.errorText, err);
      }
      return { ok: false, error: err };
    } finally {
      loading?.close();
    }
  }

  return {
    success,
    error,
    errorWithNextStep,
    info,
    warning,
    successWithLink,
    successWithAction,
    successWithUndo,
    runAsync,
  };
}
