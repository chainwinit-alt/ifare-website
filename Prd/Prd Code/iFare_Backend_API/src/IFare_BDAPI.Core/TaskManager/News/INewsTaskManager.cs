using Abp.Domain.Services;
using IFare_BDAPI.Common.ValueModel;
using IFare_BDAPI.TaskManager.News.ValueModel;

namespace IFare_BDAPI.TaskManager.News 
{
    public interface INewsTaskManager : IDomainService
    {
        NewsResult GetDataList(NewsFilterParam param);
        ErrorInfoBase InsertNews(NewsInsertData insertData);
        ErrorInfoBase UpdateNews(NewsEditorData editorData);
        ErrorInfoBase DeleteNews(NewsDeleteData deleteData);
    }
}