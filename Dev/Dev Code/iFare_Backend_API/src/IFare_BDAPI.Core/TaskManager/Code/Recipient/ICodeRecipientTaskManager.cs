using Abp.Domain.Services;
using IFare_BDAPI.Common.ValueModel;
using IFare_BDAPI.TaskManager.Code.ValueModel;

namespace IFare_BDAPI.TaskManager.Code.Recipient
{
    public interface ICodeRecipientTaskManager : IDomainService
    {
        CodeResult GetDataList(CodeFilterParam param);
        ErrorInfoBase InsertCodeRecipient(CodeInsertData insertData);
        ErrorInfoBase UpdateCodeRecipient(CodeEditorData editorData);
    }
}