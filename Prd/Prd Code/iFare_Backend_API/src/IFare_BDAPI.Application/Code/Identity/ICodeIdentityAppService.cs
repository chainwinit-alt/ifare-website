using System.Threading.Tasks;
using Abp.Application.Services;
using IFare_BDAPI.Code.Dto;
using IFare_BDAPI.Common.Dto;

namespace IFare_BDAPI.Code.Identity
{
    public interface ICodeIdentityAppService : IApplicationService
    {
        Task<CodeResultDto> GetDataList(CodeFilterParamDto param);
        Task<ErrorInfoBaseDto> InsertCodeIdentity(CodeInsertDataDto insertData);
        Task<ErrorInfoBaseDto> UpdateCodeIdentity(CodeEditorDataDto editorData);
    }
}