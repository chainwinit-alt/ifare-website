using System.Threading.Tasks;
using Abp.Application.Services;
using IFare_BDAPI.Code.Dto;
using IFare_BDAPI.Common.Dto;

namespace IFare_BDAPI.Code.Policy
{
    public interface ICodePolicyAppService : IApplicationService
    {
        Task<CodeResultDto> GetDataList(CodeFilterParamDto param);
        Task<ErrorInfoBaseDto> InsertCodePolicy(CodeInsertDataDto insertData);
        Task<ErrorInfoBaseDto> UpdateCodePolicy(CodeEditorDataDto editorData);
    }
}