using System.Threading.Tasks;
using Abp;
using IFare_API.Articles.Lazy.Dto;
using IFare_API.Articles.Welfare.Dto;
using IFare_API.Code.Dto;
using IFare_API.TaskManager.Articles.Lazy;
using IFare_API.TaskManager.Articles.Welfare;
using IFare_API.TaskManager.Code;

namespace IFare_API.Articles.Welfare
{
    public class ArticlesWelfareAppService : AbpServiceBase, IArticlesWelfareAppService
    {
        private readonly IArticlesWelfareTaskManager _taskManager;
        public ArticlesWelfareAppService(IArticlesWelfareTaskManager taskManager) 
        {
            _taskManager = taskManager;
        }
        
        public async Task<ArticlesWelfareDetailDto> GetArticlesWelfareDetail(long articleWelfareID)
        {
            var result = _taskManager.GetArticlesWelfareDetail(articleWelfareID);
            return ObjectMapper.Map<ArticlesWelfareDetailDto>(result);
        }

        public async Task<ArticlesWelfareResultDto> GetArticlesWelfareTops(long policyId)
        {
            var result = _taskManager.GetArticlesWelfareTops(policyId);
            return ObjectMapper.Map<ArticlesWelfareResultDto>(result);
        }

        public async Task<ArticlesWelfareResultDto> GetArticlesWelfareList()
        {
            var result = _taskManager.GetArticlesWelfareList();
            return ObjectMapper.Map<ArticlesWelfareResultDto>(result);
        }

        public async Task<ArticlesWelfareResultDto> GetArticlesWelfareRelation(long articleWelfareID)
        {
            var result = _taskManager.GetArticlesWelfareRelation(articleWelfareID);
            return ObjectMapper.Map<ArticlesWelfareResultDto>(result);
        }
    }
}