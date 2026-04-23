using IFare_BDAPI.Constants;
using IFare_BDAPI.TaskManager.Articles.Lazy.ValueModel;
using IFare_BDAPI.TaskManager.Common;
using IFare_BDAPI.TaskManager.ImgManager.ValueModel;

namespace IFare_BDAPI.TaskManager.ImgManager.Common
{
    public class FilterParamChecker
    {
        private ImgManagerFilterParam _param;
        private readonly ParamChecker _paramChecker;
        public FilterParamChecker(ImgManagerFilterParam param) 
        {
            _param = param;
            _paramChecker = new ParamChecker();
        }

        public bool IsCheckPass() 
        {
            // Update DateRange Filter check.
            if (_paramChecker.IsDateFiltered(_param.UpdateDateStart, _param.UpdateDateEnd))
            {
                if (!_paramChecker.IsPassDateFiltered(TypeFilter.UpdateDateRange, _param.UpdateDateStart, _param.UpdateDateEnd)) return false;
                _param.IsUpdateDateFiltered = true;
            }

            // Img Type Filter check.
            _param.IsTypeFiltered = _paramChecker.IsImgManagerTypeFiltered(_param.Type);

            // Search Name Filter check.
            _param.IsSearchNameFiltered = _paramChecker.IsSearchNameFiltered(_param.SearchName);

            return true;
        }

        public string GetErrMsg()
        {
            return _paramChecker.GetErrMsg();
        }
    }
}