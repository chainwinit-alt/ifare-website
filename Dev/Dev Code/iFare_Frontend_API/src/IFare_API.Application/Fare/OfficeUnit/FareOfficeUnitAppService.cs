using System.Threading.Tasks;
using Abp;
using IFare_API.Fare.OfficeUnit.Dto;
using IFare_API.TaskManager.Fare.OfficeUnit;

namespace IFare_API.Fare.OfficeUnit
{
    public class FareOfficeUnitAppService : AbpServiceBase, IFareOfficeUnitAppService
    {
        private readonly IFareOfficeUnitTaskManager _taskManager;
        public FareOfficeUnitAppService(IFareOfficeUnitTaskManager taskManager) 
        {
            _taskManager = taskManager;
        }

        public async Task<FareOfficeUnitResultDto> GetIFareOfficeUnitList()
        {
            var result = _taskManager.GetIFareOfficeUnitList();
            return ObjectMapper.Map<FareOfficeUnitResultDto>(result);
        }
    }
}