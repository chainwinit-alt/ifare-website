using System.Threading.Tasks;
using Abp.Application.Services;
using IFare_API.Fare.Policy.Dto;

namespace IFare_API.Fare.Policy
{
    public interface IFarePolicyAppService : IApplicationService 
    {
        Task<FarePolicyResultDto> GetIFarePolicyList(FarePolicyFilterParamDto param);
        Task<FarePolicyResultDto> GetIFarePolicyRelation(long farePolicyID);
        Task<FarePolicyDetailDto> GetIFarePolicyDetail(long farePolicyID);
    }
}