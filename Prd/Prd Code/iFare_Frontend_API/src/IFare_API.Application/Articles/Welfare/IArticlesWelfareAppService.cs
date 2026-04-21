using System.Threading.Tasks;
using Abp.Application.Services;
using IFare_API.Articles.Welfare.Dto;

namespace IFare_API.Articles.Welfare
{
    public interface IArticlesWelfareAppService : IApplicationService 
    {
        Task<ArticlesWelfareResultDto> GetArticlesWelfareList();
        Task<ArticlesWelfareResultDto> GetArticlesWelfareTops(long policyId);
        Task<ArticlesWelfareResultDto> GetArticlesWelfareRelation(long articleWelfareID);
        Task<ArticlesWelfareDetailDto> GetArticlesWelfareDetail(long articleWelfareID);
    }
}