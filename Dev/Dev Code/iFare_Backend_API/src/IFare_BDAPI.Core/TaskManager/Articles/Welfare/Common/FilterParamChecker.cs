using IFare_BDAPI.Constants;
using IFare_BDAPI.TaskManager.Articles.Welfare.ValueModel;
using IFare_BDAPI.TaskManager.Common;

namespace IFare_BDAPI.TaskManager.Articles.Welfare.Common
{
    public class FilterParamChecker
    {
        private ArticlesWelfareFilterParam _param;
        private readonly ParamChecker _paramChecker;
        public FilterParamChecker(ArticlesWelfareFilterParam param) 
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
            _param.IsIDsFiltered = _paramChecker.IsCodeKeywordsFiltered(_param.IDs);

            return true;
        }

        public string GetErrMsg()
        {
            return _paramChecker.GetErrMsg();
        }
    }
}