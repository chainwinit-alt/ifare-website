using Abp.Domain.Services;
using IFare_API.TaskManager.Fare.Policy.ValueModel;

namespace IFare_API.TaskManager.Fare.Policy
{
    public interface IFarePolicyTaskManager : IDomainService
    {
        FarePolicyResult GetIFarePolicyList(FarePolicyFilterParam param);
        FarePolicyResult GetIFarePolicyRelation(long farePolicyID);
        FarePolicyDetail GetIFarePolicyDetail(long farePolicyID);
    }
}