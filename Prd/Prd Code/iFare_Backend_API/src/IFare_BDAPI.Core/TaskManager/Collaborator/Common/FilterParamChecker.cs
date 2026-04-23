using IFare_BDAPI.Constants;
using IFare_BDAPI.TaskManager.Collaborator.ValueModel;
using IFare_BDAPI.TaskManager.Common;

namespace IFare_BDAPI.TaskManager.Collaborator.Common
{
    public class FilterParamChecker
    {
        private CollaboratorFilterParam _param;
        private readonly ParamChecker _paramChecker;
        public FilterParamChecker(CollaboratorFilterParam param) 
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