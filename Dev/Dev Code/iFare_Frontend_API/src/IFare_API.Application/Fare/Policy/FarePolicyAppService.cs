using System.Collections.Generic;
using System.Linq;
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

        public async Task<FarePolicySuggestionResultDto> GetIFareSearchSuggestions(FarePolicySuggestionParamDto param)
        {
            var taskParam = new FarePolicySuggestionParam
            {
                Query = param?.Query,
                CodeDomicile = param?.CodeDomicile,
                CodeRecipient = param?.CodeRecipient,
                CodePolicy = param?.CodePolicy,
                CodeIncome = param?.CodeIncome,
                CodeIdentities = param?.CodeIdentities,
                Limit = param?.Limit ?? 8,
                HotLimit = param?.HotLimit ?? 8,
            };

            var result = _taskManager.GetIFareSearchSuggestions(taskParam);

            return new FarePolicySuggestionResultDto
            {
                ErrCode = result.ErrCode,
                ErrMsg = result.ErrMsg,
                Result = result.Result == null
                    ? null
                    : new FarePolicySuggestionPayloadDto
                    {
                        HotKeywords = result.Result.HotKeywords?.ToList() ?? new List<string>(),
                        Suggestions = result.Result.Suggestions?.Select(item => new FarePolicySuggestionItemDto
                        {
                            Text = item.Text,
                            Type = item.Type,
                            MatchCount = item.MatchCount,
                            LatestReleaseTime = item.LatestReleaseTime
                        }).ToList() ?? new List<FarePolicySuggestionItemDto>()
                    }
            };
        }
    }
}
