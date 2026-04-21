using Abp.Domain.Services;
using IFare_BDAPI.Common.ValueModel;
using IFare_BDAPI.TaskManager.Code.ValueModel;

namespace IFare_BDAPI.TaskManager.Code.Keyword
{
    public interface ICodeKeywordTaskManager : IDomainService
    {
        CodeResult GetDataList(CodeFilterParam param);
        ErrorInfoBase InsertCodeKeyword(CodeInsertData insertData);
        ErrorInfoBase UpdateCodeKeyword(CodeEditorData editorData);
    }
}