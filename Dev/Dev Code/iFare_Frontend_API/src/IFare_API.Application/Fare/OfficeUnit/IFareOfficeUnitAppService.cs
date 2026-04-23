using System.Threading.Tasks;
using Abp.Application.Services;
using IFare_API.Fare.OfficeUnit.Dto;

namespace IFare_API.Fare.OfficeUnit
{
    public interface IFareOfficeUnitAppService : IApplicationService 
    {
        Task<FareOfficeUnitResultDto> GetIFareOfficeUnitList();
    }
}