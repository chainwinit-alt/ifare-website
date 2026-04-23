using IFare_BDAPI.Constants;
using IFare_BDAPI.TaskManager.Code.ValueModel;
using IFare_BDAPI.TaskManager.Common;
using IFare_BDAPI.TaskManager.News.ValueModel;

namespace IFare_BDAPI.TaskManager.News.Common
{
    public class FilterParamChecker
    {
        private NewsFilterParam _param;
        private readonly ParamChecker _paramChecker;
        public FilterParamChecker(NewsFilterParam param) 
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