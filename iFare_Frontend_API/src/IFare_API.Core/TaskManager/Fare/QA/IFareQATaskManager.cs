using Abp.Domain.Services;
using IFare_API.TaskManager.Fare.QA.ValueModel;

namespace IFare_API.TaskManager.Fare.QA
{
    public interface IFareQATaskManager : IDomainService
    {
        FareQAResult GetIFareQAList();
    }
}