using Abp.Domain.Services;
using IFare_BDAPI.Common.ValueModel;
using IFare_BDAPI.TaskManager.Articles.Welfare.ValueModel;

namespace IFare_BDAPI.TaskManager.Articles.Welfare 
{
    public interface IArticlesWelfareTaskManager : IDomainService
    {
        ArticlesWelfareResult GetDataList(ArticlesWelfareFilterParam param);
        ErrorInfoBase InsertArticlesWelfare(ArticlesWelfareInsertData insertData);
        ErrorInfoBase UpdateArticlesWelfare(ArticlesWelfareEditorData editorData);
        ErrorInfoBase DeleteArticlesWelfare(ArticlesWelfareDeleteData deleteData);
    }
}