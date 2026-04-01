using Abp.Domain.Services;
using IFare_API.TaskManager.Articles.Welfare.ValueModel;

namespace IFare_API.TaskManager.Articles.Welfare
{
    public interface IArticlesWelfareTaskManager : IDomainService
    {
        ArticlesWelfareResult GetArticlesWelfareList();
        ArticlesWelfareResult GetArticlesWelfareTops(long policyId);
        ArticlesWelfareResult GetArticlesWelfareRelation(long welfareID);
        ArticlesWelfareDetail GetArticlesWelfareDetail(long welfareID);
    }
}