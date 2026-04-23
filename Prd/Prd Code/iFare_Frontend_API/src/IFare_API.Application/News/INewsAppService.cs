using System.Threading.Tasks;
using Abp.Application.Services;
using IFare_API.News.Dto;

namespace IFare_API.News
{
    public interface INewsAppService : IApplicationService 
    {
        Task<NewsResultDto> GetTopsNewsList();
        Task<NewsResultDto> GetNewsList();
        Task<NewsResultDto> GetNewsDetail(long newsID);
    }
}