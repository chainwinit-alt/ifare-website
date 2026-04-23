using System.Threading.Tasks;
using Abp;
using IFare_API.News.Dto;
using IFare_API.TaskManager.News;

namespace IFare_API.News
{
    public class NewsAppService : AbpServiceBase, INewsAppService
    {
        private readonly INewsTaskManager _taskManager;
        public NewsAppService(INewsTaskManager taskManager) 
        {
            _taskManager = taskManager;
        }

        public async Task<NewsResultDto> GetNewsList()
        {
            var result = _taskManager.GetNewsList();
            return ObjectMapper.Map<NewsResultDto>(result);
        }

        public async Task<NewsResultDto> GetTopsNewsList()
        {
            var result = _taskManager.GetNewsTops();
            return ObjectMapper.Map<NewsResultDto>(result);
        }

        public async Task<NewsResultDto> GetNewsDetail(long newsID)
        {
            var result = _taskManager.GetNewsDetail(newsID);
            return ObjectMapper.Map<NewsResultDto>(result);
        }
    }
}