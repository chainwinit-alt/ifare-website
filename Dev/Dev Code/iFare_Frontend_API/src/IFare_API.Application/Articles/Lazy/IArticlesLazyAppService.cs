using System.Threading.Tasks;
using Abp.Application.Services;
using IFare_API.Articles.Lazy.Dto;

namespace IFare_API.Articles.Lazy
{
    public interface IArticlesLazyAppService : IApplicationService 
    {
        Task<ArticlesLazyResultDto> GetArticlesLazyList();
        Task<ArticlesLazyResultDto> GetArticlesLazyRelation(long articlesLazyID);
        Task<ArticlesLazyDetailDto> GetArticlesLazyDetail(long articlesLazyID);
    }
}