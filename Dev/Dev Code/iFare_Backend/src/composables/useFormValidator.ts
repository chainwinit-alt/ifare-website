/**
 * useFormValidator — 後台表單共用驗證 / 儲存狀態 helper
 *
 * 解決問題：
 *   - 目前各 AddEditView 重複手刻 if (!input_xxx) { $Message warning } 數十段
 *   - URL / 圖片 / 必填規則散落，名稱與訊息格式不一致
 *   - SaveAction 沒有 saving guard，使用者快速雙擊容易送出兩次
 *
 * 用法：
 *   const { required, validUrl, validImage, runValidations, withSaving, saving } = useFormValidator();
 *
 *   function SaveAction() {
 *     const ok = runValidations(
 *       () => required(input_name.value, '姓名'),
 *       () => required(input_email.value, 'E-mail'),
 *       () => validUrl(input_url.value, '網址', { allowEmpty: true }),
 *     );
 *     if (!ok) return;
 *
 *     withSaving(async () => {
 *       await $WebAPI.InsertXxx(...);
 *     });
 *   }
 *
 *   // template 內可用 saving.value 控制按鈕 loading
 *   <el-button :loading="saving" @click="SaveAction">儲存</el-button>
 */

import { ref } from 'vue';
import { useFeedback } from './useFeedback';

export class FormValidationError extends Error {
  constructor(public field: string, message: string) {
    super(message);
    this.name = 'FormValidationError';
  }
}

interface ImageValidateOptions {
  /** 上限（KB），預設 500KB */
  maxSizeKB?: number;
  /** 允許的 MIME，預設常見圖片格式 */
  allowedTypes?: string[];
}

interface UrlValidateOptions {
  /** 空字串視為合法，預設 false */
  allowEmpty?: boolean;
  /** 允許的 protocol（含結尾冒號），預設 http: / https: */
  allowedProtocols?: string[];
}

const DEFAULT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const DEFAULT_URL_PROTOCOLS = ['http:', 'https:'];

export function useFormValidator() {
  const { warning, error: showError } = useFeedback();
  const saving = ref(false);

  /** 必填檢查：null / undefined / 空字串 / 空陣列 都會被擋 */
  function required(value: unknown, fieldLabel: string): true {
    if (value === null || value === undefined) {
      throw new FormValidationError(fieldLabel, `【${fieldLabel}】不可為空`);
    }
    if (typeof value === 'string' && value.trim() === '') {
      throw new FormValidationError(fieldLabel, `【${fieldLabel}】不可為空`);
    }
    if (Array.isArray(value) && value.length === 0) {
      throw new FormValidationError(fieldLabel, `【${fieldLabel}】至少需選 1 項`);
    }
    return true;
  }

  /** URL 格式檢查：限定 protocol，allowEmpty 可空白 */
  function validUrl(value: string | null | undefined, fieldLabel: string, options: UrlValidateOptions = {}): true {
    const v = (value ?? '').trim();
    if (!v) {
      if (options.allowEmpty) return true;
      throw new FormValidationError(fieldLabel, `【${fieldLabel}】不可為空`);
    }

    const protocols = options.allowedProtocols ?? DEFAULT_URL_PROTOCOLS;
    try {
      const url = new URL(v);
      if (!protocols.includes(url.protocol)) {
        const hint = protocols.map((p) => p.replace(':', '://')).join(' 或 ');
        throw new FormValidationError(fieldLabel, `【${fieldLabel}】請使用 ${hint} 開頭`);
      }
    } catch (e) {
      if (e instanceof FormValidationError) throw e;
      throw new FormValidationError(fieldLabel, `【${fieldLabel}】格式不正確`);
    }
    return true;
  }

  /** 圖片檔案檢查：MIME 與 size */
  function validImage(file: File | null | undefined, fieldLabel: string, options: ImageValidateOptions = {}): true {
    const maxSizeKB = options.maxSizeKB ?? 500;
    const allowedTypes = options.allowedTypes ?? DEFAULT_IMAGE_TYPES;

    if (!file) {
      throw new FormValidationError(fieldLabel, `【${fieldLabel}】請選擇圖片`);
    }
    if (!allowedTypes.includes(file.type)) {
      const exts = allowedTypes.map((t) => t.split('/')[1]?.toUpperCase()).filter(Boolean).join(' / ');
      throw new FormValidationError(fieldLabel, `【${fieldLabel}】請使用 ${exts} 格式`);
    }
    if (file.size > maxSizeKB * 1024) {
      throw new FormValidationError(fieldLabel, `【${fieldLabel}】檔案需小於 ${maxSizeKB}KB`);
    }
    return true;
  }

  /** 字串長度檢查 */
  function lengthRange(value: string | null | undefined, fieldLabel: string, min: number, max?: number): true {
    const v = (value ?? '').trim();
    if (v.length < min) {
      throw new FormValidationError(fieldLabel, `【${fieldLabel}】至少 ${min} 字`);
    }
    if (typeof max === 'number' && v.length > max) {
      throw new FormValidationError(fieldLabel, `【${fieldLabel}】不可超過 ${max} 字`);
    }
    return true;
  }

  /**
   * 依序執行多個 validator；遇到第一個 FormValidationError 就停下並用 warning 顯示。
   * 回傳 true 代表全部通過。
   */
  function runValidations(...validators: Array<() => void>): boolean {
    try {
      for (const v of validators) v();
      return true;
    } catch (e) {
      if (e instanceof FormValidationError) {
        warning(e.message);
        return false;
      }
      showError('表單驗證發生例外', e);
      return false;
    }
  }

  /**
   * SaveAction 共用包裝：自動處理 saving guard，避免重複送出。
   * 回傳 undefined 表示 saving 已在進行中（被擋下）；否則回傳 fn 的結果。
   */
  async function withSaving<T>(fn: () => Promise<T>): Promise<T | undefined> {
    if (saving.value) return undefined;
    saving.value = true;
    try {
      return await fn();
    } finally {
      saving.value = false;
    }
  }

  return {
    saving,
    required,
    validUrl,
    validImage,
    lengthRange,
    runValidations,
    withSaving,
    FormValidationError,
  };
}
