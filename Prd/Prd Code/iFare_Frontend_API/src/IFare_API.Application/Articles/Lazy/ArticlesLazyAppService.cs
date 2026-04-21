using System.Threading.Tasks;
using Abp;
using IFare_API.Articles.Lazy.Dto;
using IFare_API.TaskManager.Articles.Lazy;

namespace IFare_API.Articles.Lazy
{
    public class ArticlesLazyAppService : AbpServiceBase, IArticlesLazyAppService
    {
        private readonly IArticlesLazyTaskManager _taskManager;
        public ArticlesLazyAppService(IArticlesLazyTaskManager taskManager) 
        {
            _taskManager = taskManager;
        }

        public async Task<ArticlesLazyDetailDto> GetArticlesLazyDetail(long articlesLazyID)
        {
            var result = _taskManager.GetArticlesLazyDetail(articlesLazyID);
            return ObjectMapper.Map<ArticlesLazyDetailDto>(result);
        }

        public async Task<ArticlesLazyResultDto> GetArticlesLazyList()
        {
            var result = _taskManager.GetArticlesLazyList();
            return ObjectMapper.Map<ArticlesLazyResultDto>(result);
        }

        public async Task<ArticlesLazyResultDto> GetArticlesLazyRelation(long articlesLazyID)
        {
            var result = _taskManager.GetArticlesLazyRelation(articlesLazyID);
            return ObjectMapper.Map<ArticlesLazyResultDto>(result);
        }
    }
}