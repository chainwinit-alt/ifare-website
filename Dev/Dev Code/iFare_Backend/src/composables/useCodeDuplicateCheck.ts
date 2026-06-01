/**
 * 2026-05-25 #34 — Code 代碼系列共用「名稱重複檢查」
 *
 * 用於 6 個 Code 模組 (Domicile / Identity / Income / Keyword / Policy / Recipient)
 * 在送出 Insert / Update 之前先查 API 確認名稱是否已存在,避免送到後端才發現衝突。
 *
 * 用法:
 *   const { checkDuplicate } = useCodeDuplicateCheck();
 *   const result = await checkDuplicate($WebAPI.GetCodeDomicile, 'XXX', null);
 *   if (!result.ok) {
 *     // 名稱重複, result.conflictItem.labelName / state 可拿來組提示
 *   }
 *
 * 6 個 GetCodeXxx API 簽名統一為:
 *   (token, ds, de, us, ue, keyword, onlyActive, ids, callback)
 */

import { useUserStore } from '@/stores/user';

export interface CodeDuplicateCheckResult {
  ok: boolean;
  conflictItem?: { labelName: string; state: string; id?: number };
}

type GetCodeFn = (
  token: string,
  createDateStart: string | null,
  createDateEnd: string | null,
  updateDateStart: string | null,
  updateDateEnd: string | null,
  keyword: string | null,
  onlyActive: boolean,
  ids: number[] | null,
  callback: (res: any) => void,
) => void;

export function useCodeDuplicateCheck() {
  const userStore = useUserStore();

  function checkDuplicate(
    getter: GetCodeFn,
    name: string,
    ignoreId: number | null,
  ): Promise<CodeDuplicateCheckResult> {
    const trimmed = name.trim();
    if (!trimmed) return Promise.resolve({ ok: true });

    return new Promise((resolve) => {
      getter(userStore.token, null, null, null, null, trimmed, false, null, (res: any) => {
        const _resData = res?.data;
        // 查詢失敗時讓後端把關,前端不 block
        if (!_resData || _resData === 'error') return resolve({ ok: true });
        const _res = _resData.result;
        if (!_res || _res.errCode !== 0) return resolve({ ok: true });

        // API keyword 可能是模糊比對,前端再精確過濾完全相同的 labelName
        const list = Array.isArray(_res.result) ? _res.result : [];
        const exact = list.find(
          (item: any) =>
            String(item.labelName ?? '').trim() === trimmed && item.id !== ignoreId,
        );

        if (exact) {
          resolve({
            ok: false,
            conflictItem: {
              labelName: exact.labelName,
              state: exact.state ?? '',
              id: exact.id,
            },
          });
        } else {
          resolve({ ok: true });
        }
      });
    });
  }

  return { checkDuplicate };
}
