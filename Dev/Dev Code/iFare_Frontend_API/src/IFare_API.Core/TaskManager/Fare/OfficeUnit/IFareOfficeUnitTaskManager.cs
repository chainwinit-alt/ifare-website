using Abp.Domain.Services;
using IFare_API.TaskManager.Fare.OfficeUnit.ValueModel;

namespace IFare_API.TaskManager.Fare.OfficeUnit
{
    public interface IFareOfficeUnitTaskManager : IDomainService
    {
        FareOfficeUnitResult GetIFareOfficeUnitList();
    }
}