using Abp.Domain.Services;
using IFare_API.TaskManager.News.ValueModel;

namespace IFare_API.TaskManager.News
{
    public interface INewsTaskManager : IDomainService
    {
        NewsResult GetNewsTops();
        NewsResult GetNewsList();
        NewsResult GetNewsDetail(long newsID);
    }
}