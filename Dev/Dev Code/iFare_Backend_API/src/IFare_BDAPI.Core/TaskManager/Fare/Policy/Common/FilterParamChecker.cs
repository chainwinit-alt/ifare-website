using IFare_BDAPI.Constants;
using IFare_BDAPI.TaskManager.Common;
using IFare_BDAPI.TaskManager.Fare.Policy.ValueModel;

namespace IFare_BDAPI.TaskManager.Fare.Policy.Common
{
    public class FilterParamChecker
    {
        private FarePolicyFilterParam _param;
        private readonly ParamChecker _paramChecker;
        public FilterParamChecker(FarePolicyFilterParam param) 
        {
            _param = param;
            _paramChecker = new ParamChecker();
        }

        public bool IsCheckPass() 
        {
            // Create DateRange Filter check.
            if (_paramChecker.IsDateFiltered(_param.CreateDateStart, _param.CreateDateEnd))
            {
                if (!_paramChecker.IsPassDateFiltered(TypeFilter.CreateDateRange, _param.CreateDateStart, _param.CreateDateEnd)) return false;
                _param.IsCreateDateFiltered = true;
            }

            // Update DateRange Filter check.
            if (_paramChecker.IsDateFiltered(_param.UpdateDateStart, _param.UpdateDateEnd))
            {
                if (!_paramChecker.IsPassDateFiltered(TypeFilter.UpdateDateRange, _param.UpdateDateStart, _param.UpdateDateEnd)) return false;
                _param.IsUpdateDateFiltered = true;
            }

            // Release Time DateRange Filter check.
            if (_paramChecker.IsDateFiltered(_param.ReleaseTimeStart, _param.ReleaseTimeEnd))
            {
                if (!_paramChecker.IsPassDateFiltered(TypeFilter.ReleaseTimeRange, _param.ReleaseTimeStart, _param.ReleaseTimeEnd)) return false;
                _param.IsReleaseTimeFiltered = true;
            }

            // Discontinued Time DateRange Filter check.
            if (_paramChecker.IsDateFiltered(_param.DiscontinuedTimeStart, _param.DiscontinuedTimeEnd))
            {
                if (!_paramChecker.IsPassDateFiltered(TypeFilter.DiscontinuedTimeRange, _param.DiscontinuedTimeStart, _param.DiscontinuedTimeEnd)) return false;
                _param.IsDiscontinuedFiltered = true;
            }

            // Code Domicile Filter check.
            _param.IsCodeDomicileFiltered = _paramChecker.IsCodeDomicileFiltered(_param.CodeDomicile);

            // Code Policy Filter check.
            _param.IsCodePolicyFiltered = _paramChecker.IsCodePolicyFiltered(_param.CodePolicy);

            // Code Keywords Filter check.
            _param.IsCodeKeywordsFiltered = _paramChecker.IsCodeKeywordsFiltered(_param.CodeKeywords);
            // if (_paramChecker.IsCodeKeywordsFiltered(_param.CodeKeywords))
            // {
            //     if (!_paramChecker.IsPassCodeKeywordsFiltered(_param.CodeKeywords)) return false;
            //     _param.IsCodeKeywordsFiltered = true;
            // }

            // Data State Filter check.
            if (_paramChecker.IsDataStateFiltered(_param.State))
            {
                if (!_paramChecker.IsPassDataStateFiltered(_param.State)) return false;
                _param.IsStateFiltered = true;
            }

            // IDs Filter check.
            _param.IsIDsFiltered = _paramChecker.IsIDsFiltered(_param.IDs);

            // Release State Filter check.
            if (_paramChecker.IsReleaseStateFiltered(_param.State_Release))
            {
                if (!_paramChecker.IsPassReleaseStateFiltered(_param.State_Release)) return false;
                _param.IsReleaseStateFiltered = true;
            }

            return true;
        }

        public string GetErrMsg()
        {
            return _paramChecker.GetErrMsg();
        }
    }
}