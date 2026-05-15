using Abp.AutoMapper;
using IFare_API.TaskManager.Fare.Policy.ValueModel;

namespace IFare_API.Fare.Policy.Dto
{
    [AutoMapTo(typeof(FarePolicySuggestionParam))]
    public class FarePolicySuggestionParamDto : FarePolicyFilterParamDto
    {
        public int Limit { get; set; } = 8;
        public int HotLimit { get; set; } = 8;
    }
}
