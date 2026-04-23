using System.Threading.Tasks;
using Abp.Application.Services;
using IFare_BDAPI.Code.Dto;
using IFare_BDAPI.Common.Dto;

namespace IFare_BDAPI.Code.Recipient
{
    public interface ICodeRecipientAppService : IApplicationService
    {
        Task<CodeResultDto> GetDataList(CodeFilterParamDto param);
        Task<ErrorInfoBaseDto> InsertCodeRecipient(CodeInsertDataDto insertData);
        Task<ErrorInfoBaseDto> UpdateCodeRecipient(CodeEditorDataDto editorData);
    }
}