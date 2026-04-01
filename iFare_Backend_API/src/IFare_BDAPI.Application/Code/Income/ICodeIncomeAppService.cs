using System.Threading.Tasks;
using Abp.Application.Services;
using IFare_BDAPI.Code.Dto;
using IFare_BDAPI.Common.Dto;

namespace IFare_BDAPI.Code.Income
{
    public interface ICodeIncomeAppService : IApplicationService
    {
        Task<CodeResultDto> GetDataList(CodeFilterParamDto param);
        Task<ErrorInfoBaseDto> InsertCodeIncome(CodeInsertDataDto insertData);
        Task<ErrorInfoBaseDto> UpdateCodeIncome(CodeEditorDataDto editorData);
    }
}