using Abp.Domain.Services;
using IFare_BDAPI.Common.ValueModel;
using IFare_BDAPI.TaskManager.Code.ValueModel;

namespace IFare_BDAPI.TaskManager.Code.Income
{
    public interface ICodeIncomeTaskManager : IDomainService
    {
        CodeResult GetDataList(CodeFilterParam param);
        ErrorInfoBase InsertCodeIncome(CodeInsertData insertData);
        ErrorInfoBase UpdateCodeIncome(CodeEditorData editorData);
    }
}