using System.Threading.Tasks;
using Abp.Application.Services;
using IFare_BDAPI.Code.Dto;
using IFare_BDAPI.Common.Dto;

namespace IFare_BDAPI.Code.Domicile
{
    public interface ICodeDomicileAppService : IApplicationService
    {
        Task<CodeResultDto> GetDataList(CodeFilterParamDto param);
        Task<ErrorInfoBaseDto> InsertCodeDomicile(CodeInsertDataDto insertData);
        Task<ErrorInfoBaseDto> UpdateCodeDomicile(CodeEditorDataDto editorData);
    }
}