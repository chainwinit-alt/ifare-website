using Abp.Domain.Services;
using IFare_BDAPI.Common.ValueModel;
using IFare_BDAPI.TaskManager.Code.ValueModel;

namespace IFare_BDAPI.TaskManager.Code.Identity
{
    public interface ICodeIdentityTaskManager : IDomainService
    {
        CodeResult GetDataList(CodeFilterParam param);
        ErrorInfoBase InsertCodeIdentity(CodeInsertData insertData);
        ErrorInfoBase UpdateCodeIdentity(CodeEditorData editorData);
    }
}