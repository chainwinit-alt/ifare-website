using System;
using System.Collections.Generic;
using IFare_BDAPI.Constants;

namespace IFare_BDAPI.TaskManager.Common
{
    /// <summary>
    /// 篩選參數檢查器。
    ///
    /// 這個類別主要分成兩類責任：
    /// 1. 判斷某個篩選條件「是否有被帶入」。
    /// 2. 驗證該篩選條件「內容是否合法」，並在失敗時記錄錯誤訊息。
    ///
    /// TaskManager 在組查詢條件時可先用 IsXXXFiltered 判斷要不要套用條件，
    /// 再用 IsPassXXXFiltered 驗證值本身是否合理。
    /// </summary>
    public class ParamChecker 
    {
        /// <summary>
        /// 最近一次驗證失敗時的錯誤訊息。
        /// 呼叫端可透過 <see cref="GetErrMsg"/> 取回並顯示。
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
        /// 只要開始或結束日期其中之一存在，就視為使用了日期篩選。
        /// </summary>
        public bool IsDateFiltered(DateTime? dateStart, DateTime? dateEnd)
        {
            return dateStart != null || dateEnd != null;
        }

        /// <summary>
        /// 判斷關鍵字/名稱搜尋條件是否有帶入。
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
        /// 判斷戶籍地代碼條件是否有帶入。
        /// </summary>
        public bool IsCodeDomicileFiltered(long? codeDomicile)
        {
            return codeDomicile != null;
        }

        /// <summary>
        /// 判斷關鍵字代碼集合是否有帶入至少一筆資料。
        /// </summary>
        public bool IsCodeKeywordsFiltered(List<long> codeKeywords)
        {
            return codeKeywords.Count > 0;
        }

        /// <summary>
        /// 判斷指定 ID 清單是否有帶入至少一筆資料。
        /// </summary>
        public bool IsIDsFiltered(List<long> ids)
        {
            return ids.Count > 0;
        }

        /// <summary>
        /// 判斷上架狀態條件是否有帶入。
        /// </summary>
        public bool IsReleaseStateFiltered(string state)
        {
            return state != null;
        }

        /// <summary>
        /// 判斷圖片管理頁型別是否有效。
        /// 除了必須有值外，也必須存在於系統允許的型別清單中。
        /// </summary>
        public bool IsImgManagerTypeFiltered(string managerType)
        {
            return managerType != null && PageConst.ImgManageType.Contains(managerType);
        }

        #endregion

        #region IsFilteredPass
        /// <summary>
        /// 驗證日期區間是否合法。
        /// 會檢查開始日、結束日是否齊全，以及開始日不可晚於結束日。
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
        /// 若未提供狀態，會以「全部」作為預設值判斷。
        /// </summary>
        public bool IsPassDataStateFiltered(string state)
        {
            if (state == null) state = DataState.All;
            return DataState.StateList.Contains(state);
        }

        /// <summary>
        /// 驗證上架狀態值是否合法。
        /// 若未提供狀態，會以「全部」作為預設值判斷。
        /// </summary>
        public bool IsPassReleaseStateFiltered(string state)
        {
            if (state == null) state = DataState.All;
            return DataState.StateList_Release.Contains(state);
        }

        /// <summary>
        /// 驗證使用者權限值是否合法。
        /// 若未提供權限，會以「全部」作為預設值判斷。
        /// </summary>
        public bool IsPassUserPermissionFiltered(string permission)
        {
            if (permission == null) permission = UserPermission.All;
            return UserPermission.PermissionList.Contains(permission);
        }

        // public bool IsPassCodeKeywordsFiltered(List<long>? codeKeywords)
        // {
        //     if (codeKeywords.Count <= 0) _errMsg = $"【{TypeFilter.CodeKeyword}】{ErrMsg.CannotEmpty}";
        //     return codeKeywords.Count > 0;
        // }

        #endregion

        /// <summary>
        /// 取得最近一次驗證失敗所記錄的錯誤訊息。
        /// </summary>
        public string GetErrMsg()
        {
            return _errMsg;
        }
    }
}
