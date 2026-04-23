using System.Threading.Tasks;
using Abp.Application.Services;
using IFare_BDAPI.Code.Dto;
using IFare_BDAPI.Common.Dto;

namespace IFare_BDAPI.Code.Keyword
{
    public interface ICodeKeywordAppService : IApplicationService
    {
        Task<CodeResultDto> GetDataList(CodeFilterParamDto param);
        Task<ErrorInfoBaseDto> InsertCodeKeyword(CodeInsertDataDto insertData);
        Task<ErrorInfoBaseDto> UpdateCodeKeyword(CodeEditorDataDto editorData);
    }
}