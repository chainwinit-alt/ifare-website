using System.Threading.Tasks;
using Abp.Application.Services;
using IFare_API.Code.Dto;

namespace IFare_API.Code
{
    public interface ICodeAppService : IApplicationService 
    {
        Task<CodeResultDto> GetCodeDomicileList();
        Task<CodeResultDto> GetCodeIdentityList();
        Task<CodeResultDto> GetCodeIncomeList();
        Task<CodeResultDto> GetCodeKeywordList();
        Task<CodeResultDto> GetCodePolicyList();
        Task<CodeResultDto> GetCodeRecipientList();
    }
}