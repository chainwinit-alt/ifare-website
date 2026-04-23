using Abp.Domain.Services;
using IFare_API.TaskManager.Code.ValueModel;

namespace IFare_API.TaskManager.Code
{
    public interface ICodeTaskManager : IDomainService
    {
        CodeResult GetCodeDomicileList();
        CodeResult GetCodeIdentityList();
        CodeResult GetCodeIncomeList();
        CodeResult GetCodeKeywordList();
        CodeResult GetCodePolicyList();
        CodeResult GetCodeRecipientList();
    }
}