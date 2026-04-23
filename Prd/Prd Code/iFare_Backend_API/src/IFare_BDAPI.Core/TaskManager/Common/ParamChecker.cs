using System;
using System.Collections.Generic;
using IFare_BDAPI.Constants;

namespace IFare_BDAPI.TaskManager.Common
{
    public class ParamChecker 
    {
        private string _errMsg = "";
        public ParamChecker(){}

        #region IsFiltered

        // Data State Filtered.
        public bool IsDataStateFiltered(string state)
        {
            return state != null;
        }

        // User Permission Filtered.
        public bool IsUserPermissionFilter(string permission)
        {
            return permission != null;
        }

        // Date range Filtered.
        public bool IsDateFiltered(DateTime? dateStart, DateTime? dateEnd)
        {
            return dateStart != null || dateEnd != null;
        }

        // Search name Filtered.
        public bool IsSearchNameFiltered(string searchName)
        {
            return searchName != null;
        }

        // Code Policy Filtered.
        public bool IsCodePolicyFiltered(long? codePolicy)
        {
            return codePolicy != null;
        }

        // Code Domicile Filtered.
        public bool IsCodeDomicileFiltered(long? codeDomicile)
        {
            return codeDomicile != null;
        }

        // Code Keywords Filtered.
        public bool IsCodeKeywordsFiltered(List<long> codeKeywords)
        {
            return codeKeywords.Count > 0;
        }

        // IDs Filtered.
        public bool IsIDsFiltered(List<long> ids)
        {
            return ids.Count > 0;
        }

        // Release State Filtered.
        public bool IsReleaseStateFiltered(string state)
        {
            return state != null;
        }

        // ImgManager Page Type
        public bool IsImgManagerTypeFiltered(string managerType)
        {
            return managerType != null && PageConst.ImgManageType.Contains(managerType);
        }

        #endregion

        #region IsFilteredPass
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

        public bool IsPassDataStateFiltered(string state)
        {
            if (state == null) state = DataState.All;
            return DataState.StateList.Contains(state);
        }

        public bool IsPassReleaseStateFiltered(string state)
        {
            if (state == null) state = DataState.All;
            return DataState.StateList_Release.Contains(state);
        }

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

        public string GetErrMsg()
        {
            return _errMsg;
        }
    }
}