using IFare_API.TaskManager.Common;
using IFare_API.TaskManager.Fare.Policy.ValueModel;

namespace IFare_API.TaskManager.Fare.Policy.Common
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
            _param.IsQueryFiltered = !string.IsNullOrWhiteSpace(_param.Query);

            // Code Domicile Filter check.
            _param.IsCodeDomicileFiltered = _paramChecker.IsCodeDomicileFiltered(_param.CodeDomicile);

            // Code Recipient Filter check.
            _param.IsCodeRecipientFiltered = _paramChecker.IsCodeRecipientFiltered(_param.CodeRecipient);

            // Code Policy Filter check.
            _param.IsCodePolicyFiltered = _paramChecker.IsCodePolicyFiltered(_param.CodePolicy);

            // Code Income Filter check.
            _param.IsCodeIncomeFiltered = _paramChecker.IsCodeIncomeFiltered(_param.CodeIncome);

            // Code Identities Filter check.
            _param.IsCodeIdentitiesFiltered = _paramChecker.IsCodeIdentitiesFiltered(_param.CodeIdentities);

            return true;
        }

        public string GetErrMsg()
        {
            return _paramChecker.GetErrMsg();
        }
    }
}
