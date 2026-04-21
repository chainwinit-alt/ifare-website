using System.Threading.Tasks;
using Abp;
using IFare_API.Fare.QA.Dto;
using IFare_API.TaskManager.Fare.QA;

namespace IFare_API.Fare.QA
{
    public class FareQAAppService : AbpServiceBase, IFareQAAppService
    {
        private readonly IFareQATaskManager _taskManager;
        public FareQAAppService(IFareQATaskManager taskManager) 
        {
            _taskManager = taskManager;
        }

        public async Task<FareQAResultDto> GetIFareQAList()
        {
            var result = _taskManager.GetIFareQAList();
            return ObjectMapper.Map<FareQAResultDto>(result);
        }
    }
}