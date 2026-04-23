using System.Threading.Tasks;
using Abp;
using IFare_API.Code.Dto;
using IFare_API.TaskManager.Code;

namespace IFare_API.Code
{
    public class CodeAppService : AbpServiceBase, ICodeAppService
    {
        private readonly ICodeTaskManager _codeTaskManager;
        public CodeAppService(ICodeTaskManager codeTaskManager) 
        {
            _codeTaskManager = codeTaskManager;
        }

        public async Task<CodeResultDto> GetCodeDomicileList()
        {
            var result = _codeTaskManager.GetCodeDomicileList();
            return ObjectMapper.Map<CodeResultDto>(result);
        }

        public async Task<CodeResultDto> GetCodeIdentityList()
        {
            var result = _codeTaskManager.GetCodeIdentityList();
            return ObjectMapper.Map<CodeResultDto>(result);
        }

        public async Task<CodeResultDto> GetCodeIncomeList()
        {
            var result = _codeTaskManager.GetCodeIncomeList();
            return ObjectMapper.Map<CodeResultDto>(result);
        }

        public async Task<CodeResultDto> GetCodeKeywordList()
        {
            var result = _codeTaskManager.GetCodeKeywordList();
            return ObjectMapper.Map<CodeResultDto>(result);
        }

        public async Task<CodeResultDto> GetCodePolicyList()
        {
            var result = _codeTaskManager.GetCodePolicyList();
            return ObjectMapper.Map<CodeResultDto>(result);
        }

        public async Task<CodeResultDto> GetCodeRecipientList()
        {
            var result = _codeTaskManager.GetCodeRecipientList();
            return ObjectMapper.Map<CodeResultDto>(result);
        }
    }
}