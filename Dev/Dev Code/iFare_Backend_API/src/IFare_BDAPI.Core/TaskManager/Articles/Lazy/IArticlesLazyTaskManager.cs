using Abp.Domain.Services;
using IFare_BDAPI.Common.ValueModel;
using IFare_BDAPI.TaskManager.Articles.Lazy.ValueModel;

namespace IFare_BDAPI.TaskManager.Articles.Lazy 
{
    public interface IArticlesLazyTaskManager : IDomainService
    {
        ArticlesLazyResult GetDataList(ArticlesLazyFilterParam param);
        ErrorInfoBase InsertArticlesLazy(ArticlesLazyInsertData insertData);
        ErrorInfoBase UpdateArticlesLazy(ArticlesLazyEditorData editorData);
        ErrorInfoBase DeleteArticlesLazy(ArticlesLazyDeleteData deleteData);
    }
}