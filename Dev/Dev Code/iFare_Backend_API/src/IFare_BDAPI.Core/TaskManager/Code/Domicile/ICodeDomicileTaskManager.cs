using Abp.Domain.Services;
using IFare_BDAPI.Common.ValueModel;
using IFare_BDAPI.TaskManager.Code.ValueModel;

namespace IFare_BDAPI.TaskManager.Code.Domicile
{
    public interface ICodeDomicileTaskManager : IDomainService
    {
        CodeResult GetDataList(CodeFilterParam param);
        ErrorInfoBase InsertCodeDomicile(CodeInsertData insertData);
        ErrorInfoBase UpdateCodeDomicile(CodeEditorData editorData);
    }
}