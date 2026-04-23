using IFare_BDAPI.Constants;
using IFare_BDAPI.TaskManager.Code.ValueModel;
using IFare_BDAPI.TaskManager.Common;

namespace IFare_BDAPI.TaskManager.Code.Common
{
    public class FilterParamChecker
    {
        private CodeFilterParam _param;
        private readonly ParamChecker _paramChecker;
        public FilterParamChecker(CodeFilterParam param) 
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

            // Search Name Filter check.
            _param.IsSearchNameFiltered = _paramChecker.IsSearchNameFiltered(_param.SearchName);

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