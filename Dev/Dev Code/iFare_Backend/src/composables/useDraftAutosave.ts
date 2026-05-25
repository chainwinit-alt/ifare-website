/**
 * 2026-05-25 #56 — 通用「自動儲存草稿 + 離開提醒」composable
 *
 * 抽自 PageManagement_AddEditView 的 draft 機制,讓其他大型 form (News / Articles / Collaborator
 * / IFare 系列等) 都能套用相同的「停止輸入 1.5 秒 → 自動寫 localStorage / beforeunload 提醒」邏輯。
 *
 * 用法:
 *   const formData = computed(() => ({ title: input_title.value, ... }));
 *   const draft = useDraftAutosave({
 *     storageKey: computed(() => `news-draft-v1:${ids?.[0] ?? 'new'}`),
 *     data: formData,
 *   });
 *
 *   // 進頁面時檢查有沒有未存草稿
 *   onMounted(async () => {
 *     if (draft.hasDraft()) {
 *       try {
 *         await ElMessageBox.confirm(...);
 *         const restored = draft.restore();
 *         if (restored) {
 *           input_title.value = restored.title;
 *           ...
 *         }
 *       } catch { draft.clearDraft(); }
 *     }
 *   });
 *
 *   // SaveAction 成功後
 *   function SaveAction() {
 *     // ... API ok callback:
 *     draft.markClean();
 *   }
 */

import { ref, watch, onMounted, onBeforeUnmount, type Ref } from 'vue';

export type DraftState = 'idle' | 'saving' | 'saved' | 'restored';

export interface DraftAutosaveOptions<T = any> {
  /** localStorage key,可動態變化(例如依路由 id) */
  storageKey: string | Ref<string>;
  /** 表單資料 ref(會 watch deep) */
  data: Ref<T>;
  /** 停止輸入後多久寫入,預設 1500ms */
  delayMs?: number;
  /** 是否啟用(可動態關,例如 read-only 模式) */
  enabled?: Ref<boolean>;
  /** beforeunload 提示文字 */
  beforeUnloadMessage?: string;
}

export interface UseDraftAutosaveReturn<T = any> {
  isDirty: Ref<boolean>;
  draftState: Ref<DraftState>;
  draftSavedAt: Ref<string>;
  /** 立即觸發儲存(不等 debounce) */
  saveNow: () => void;
  /** 從 localStorage 取出草稿;回傳資料供 caller 分發到各個 ref */
  restore: () => T | null;
  /** 清除 localStorage 草稿 */
  clearDraft: () => void;
  /** 是否有可回復的草稿(用於進入頁面時判斷要不要問 user) */
  hasDraft: () => boolean;
  /** 儲存成功後呼叫:清掉草稿 + 重置 isDirty */
  markClean: () => void;
}

export function useDraftAutosave<T = any>(
  opts: DraftAutosaveOptions<T>,
): UseDraftAutosaveReturn<T> {
  const delay = opts.delayMs ?? 1500;
  const enabledRef = opts.enabled;
  const beforeUnloadMsg =
    opts.beforeUnloadMessage ?? '頁面有未儲存的變更,確定要離開嗎?';

  const isDirty = ref(false);
  const draftState = ref<DraftState>('idle');
  const draftSavedAt = ref('');

  let originalSnapshot = '';
  let timer: ReturnType<typeof setTimeout> | null = null;

  function getKey(): string {
    return typeof opts.storageKey === 'string' ? opts.storageKey : opts.storageKey.value;
  }

  function isEnabled(): boolean {
    if (!enabledRef) return true;
    return enabledRef.value;
  }

  function saveNow() {
    if (!isEnabled()) return;
    try {
      const payload = {
        data: opts.data.value,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(getKey(), JSON.stringify(payload));
      draftSavedAt.value = payload.savedAt;
      draftState.value = 'saved';
    } catch (err) {
      console.warn('[useDraftAutosave] save failed:', err);
    }
  }

  function scheduleSave() {
    if (timer) clearTimeout(timer);
    draftState.value = 'saving';
    timer = setTimeout(() => saveNow(), delay);
  }

  function hasDraft(): boolean {
    try {
      const raw = localStorage.getItem(getKey());
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return !!parsed?.data;
    } catch {
      return false;
    }
  }

  function restore(): T | null {
    try {
      const raw = localStorage.getItem(getKey());
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed?.data) return null;
      draftSavedAt.value = parsed.savedAt || '';
      draftState.value = 'restored';
      return parsed.data as T;
    } catch (err) {
      console.warn('[useDraftAutosave] restore failed:', err);
      return null;
    }
  }

  function clearDraft() {
    try {
      localStorage.removeItem(getKey());
    } catch {
      /* localStorage 可能因隱私模式不可用,靜默失敗 */
    }
  }

  function markClean() {
    clearDraft();
    originalSnapshot = JSON.stringify(opts.data.value);
    isDirty.value = false;
    draftState.value = 'idle';
  }

  function beforeUnloadHandler(e: BeforeUnloadEvent) {
    if (!isDirty.value) return;
    e.preventDefault();
    e.returnValue = beforeUnloadMsg;
    return beforeUnloadMsg;
  }

  onMounted(() => {
    originalSnapshot = JSON.stringify(opts.data.value);
    window.addEventListener('beforeunload', beforeUnloadHandler);

    watch(
      opts.data,
      () => {
        if (!isEnabled()) return;
        const now = JSON.stringify(opts.data.value);
        isDirty.value = now !== originalSnapshot;
        if (isDirty.value) scheduleSave();
      },
      { deep: true },
    );
  });

  onBeforeUnmount(() => {
    if (timer) clearTimeout(timer);
    window.removeEventListener('beforeunload', beforeUnloadHandler);
  });

  return {
    isDirty,
    draftState,
    draftSavedAt,
    saveNow,
    restore,
    clearDraft,
    hasDraft,
    markClean,
  };
}
