using Abp.Domain.Services;
using IFare_BDAPI.Common.ValueModel;
using IFare_BDAPI.TaskManager.Code.ValueModel;

namespace IFare_BDAPI.TaskManager.Code.Policy
{
    public interface ICodePolicyTaskManager : IDomainService
    {
        CodeResult GetDataList(CodeFilterParam param);
        ErrorInfoBase InsertCodePolicy(CodeInsertData insertData);
        ErrorInfoBase UpdateCodePolicy(CodeEditorData editorData);
    }
}