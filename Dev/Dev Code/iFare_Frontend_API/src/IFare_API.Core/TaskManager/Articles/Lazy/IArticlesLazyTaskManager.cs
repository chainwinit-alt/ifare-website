using Abp.Domain.Services;
using IFare_API.TaskManager.Articles.Lazy.ValueModel;

namespace IFare_API.TaskManager.Articles.Lazy
{
    public interface IArticlesLazyTaskManager : IDomainService
    {
        ArticlesLazyResult GetArticlesLazyList();
        ArticlesLazyResult GetArticlesLazyRelation(long lazyID);
        ArticlesLazyDetail GetArticlesLazyDetail(long lazyID);
    }
}