using System;
using System.Collections.Generic;
using IFare_API.Constants;

namespace IFare_API.TaskManager.Common
{
    /// <summary>
    /// 前台 API 的篩選參數檢查器。
    ///
    /// 與後台版本相同，這個類別專門用來協助 TaskManager：
    /// 1. 判斷某個篩選條件是否有被帶入。
    /// 2. 驗證條件值是否合法，必要時記錄錯誤訊息。
    /// </summary>
    public class ParamChecker 
    {
        /// <summary>
        /// 最近一次驗證失敗時記錄的錯誤訊息。
        /// </summary>
        private string _errMsg = "";
        public ParamChecker(){}

        #region IsFiltered

        /// <summary>
        /// 判斷資料狀態條件是否有帶入。
        /// </summary>
        public bool IsDataStateFiltered(string state)
        {
            return state != null;
        }

        /// <summary>
        /// 判斷使用者權限條件是否有帶入。
        /// </summary>
        public bool IsUserPermissionFilter(string permission)
        {
            return permission != null;
        }

        /// <summary>
        /// 判斷日期區間是否有任一端被帶入。
        /// </summary>
        public bool IsDateFiltered(DateTime? dateStart, DateTime? dateEnd)
        {
            return dateStart != null || dateEnd != null;
        }

        /// <summary>
        /// 判斷名稱搜尋條件是否有帶入。
        /// </summary>
        public bool IsSearchNameFiltered(string searchName)
        {
            return searchName != null;
        }

        /// <summary>
        /// 判斷政策代碼條件是否有帶入。
        /// </summary>
        public bool IsCodePolicyFiltered(long? codePolicy)
        {
            return codePolicy != null;
        }

        /// <summary>
        /// 判斷受助者代碼條件是否有帶入。
        /// </summary>
        public bool IsCodeRecipientFiltered(long? codeRecipient)
        {
            return codeRecipient != null;
        }

        /// <summary>
        /// 判斷經濟條件代碼是否有帶入。
        /// </summary>
        public bool IsCodeIncomeFiltered(long? codeIncome)
        {
            return codeIncome != null;
        }

        /// <summary>
        /// 判斷戶籍地代碼是否有帶入。
        /// </summary>
        public bool IsCodeDomicileFiltered(long? codeDomicile)
        {
            return codeDomicile != null;
        }

        /// <summary>
        /// 判斷特殊身分代碼清單是否至少帶入一筆資料。
        /// </summary>
        public bool IsCodeIdentitiesFiltered(List<long> codeIdentities)
        {
            return codeIdentities.Count > 0;
        }

        /// <summary>
        /// 判斷關鍵字代碼清單是否至少帶入一筆資料。
        /// </summary>
        public bool IsCodeKeywordsFiltered(List<long> codeKeywords)
        {
            return codeKeywords.Count > 0;
        }

        /// <summary>
        /// 判斷指定 ID 清單是否至少帶入一筆資料。
        /// </summary>
        public bool IsIDsFiltered(List<long> ids)
        {
            return ids.Count > 0;
        }

        #endregion

        #region IsFilteredPass
        /// <summary>
        /// 驗證日期區間是否合法。
        /// </summary>
        public bool IsPassDateFiltered(string dateType, DateTime? dateStart, DateTime? dateEnd)
        {
            if (dateStart == null) 
            {
                _errMsg = $"【{dateType}】{ErrMsgFilter.CannotEmpty_DateStart}";
                return false;
            }

            if (dateEnd == null) 
            {
                _errMsg = $"【{dateType}】{ErrMsgFilter.CannotEmpty_DateEnd}";
                return false;
            }

            if (dateStart > dateEnd) 
            {
                _errMsg = $"【{dateType}】{ErrMsgFilter.CannotGreater_DateRange}";
                return false;
            }

            return true;
        }

        /// <summary>
        /// 驗證資料狀態值是否合法。
        /// 若未提供狀態，會以全部資料狀態進行判斷。
        /// </summary>
        public bool IsPassDataStateFiltered(string state)
        {
            if (state == null) state = DataState.All;
            return DataState.StateList.Contains(state);
        }

        // public bool IsPassCodeKeywordsFiltered(List<long>? codeKeywords)
        // {
        //     if (codeKeywords.Count <= 0) _errMsg = $"【{TypeFilter.CodeKeyword}】{ErrMsg.CannotEmpty}";
        //     return codeKeywords.Count > 0;
        // }

        #endregion

        /// <summary>
        /// 取得最近一次驗證失敗訊息。
        /// </summary>
        public string GetErrMsg()
        {
            return _errMsg;
        }
    }
}
