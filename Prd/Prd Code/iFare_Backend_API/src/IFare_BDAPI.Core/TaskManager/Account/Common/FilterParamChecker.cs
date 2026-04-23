using System;
using IFare_BDAPI.Constants;
using IFare_BDAPI.TaskManager.Account.ValueModel;
using IFare_BDAPI.TaskManager.Common;

namespace IFare_BDAPI.TaskManager.Account.Common
{
    public class FilterParamChecker
    {
        private AccountFilterParam _param;
        private readonly ParamChecker _paramChecker;
        public FilterParamChecker(AccountFilterParam param) 
        {
            _param = param;
            _paramChecker = new ParamChecker();
        }

        public bool IsCheckPass() 
        {
            // Data State Filter check.
            if (_paramChecker.IsDataStateFiltered(_param.State))
            {
                if (!_paramChecker.IsPassDataStateFiltered(_param.State)) return false;
                _param.IsStateFiltered = true;
            }

            // User Permission Filter check.
            if (_paramChecker.IsUserPermissionFilter(_param.Permission))
            {
                if (!_paramChecker.IsPassUserPermissionFiltered(_param.Permission)) return false;
                _param.IsPermissionFiltered = true;
            }

            // Search Account Name Filter check.
            _param.IsAccountFiltered = _paramChecker.IsSearchNameFiltered(_param.Account);

            // IDs Filter check.
            _param.IsIDsFiltered = _paramChecker.IsCodeKeywordsFiltered(_param.IDs);

            return true;
        }

        public string GetErrMsg()
        {
            return _paramChecker.GetErrMsg();
        }
    }
}