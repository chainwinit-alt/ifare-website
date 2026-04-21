using System.Threading.Tasks;
using Abp;
using IFare_API.Fare.Policy.Dto;
using IFare_API.TaskManager.Fare.Policy;
using IFare_API.TaskManager.Fare.Policy.ValueModel;

namespace IFare_API.Fare.Policy
{
    public class FarePolicyAppService : AbpServiceBase, IFarePolicyAppService
    {
        private readonly IFarePolicyTaskManager _taskManager;
        public FarePolicyAppService(IFarePolicyTaskManager taskManager) 
        {
            _taskManager = taskManager;
        }

        public async Task<FarePolicyDetailDto> GetIFarePolicyDetail(long farePolicyID)
        {
            var result = _taskManager.GetIFarePolicyDetail(farePolicyID);
            return ObjectMapper.Map<FarePolicyDetailDto>(result);
        }

        public async Task<FarePolicyResultDto> GetIFarePolicyList(FarePolicyFilterParamDto param)
        {
            var _param = ObjectMapper.Map<FarePolicyFilterParam>(param);
            var result = _taskManager.GetIFarePolicyList(_param);
            return ObjectMapper.Map<FarePolicyResultDto>(result);
        }

        public async Task<FarePolicyResultDto> GetIFarePolicyRelation(long farePolicyID)
        {
            var result = _taskManager.GetIFarePolicyRelation(farePolicyID);
            return ObjectMapper.Map<FarePolicyResultDto>(result);
        }
    }
}