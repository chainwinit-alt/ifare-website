using System.Threading.Tasks;
using Abp.Application.Services;
using IFare_BDAPI.Common.Dto;
using IFare_BDAPI.Fare.Policy.Dto;

namespace IFare_BDAPI.Fare.Policy
{
    public interface IFarePolicyAppService : IApplicationService
    {
        Task<FarePolicyResultDto> GetDataList(FarePolicyFilterParamDto param);
        Task<ErrorInfoBaseDto> InsertFarePolicy(FarePolicyInsertDataDto insertData);
        Task<ErrorInfoBaseDto> UpdateFarePolicy(FarePolicyEditorDataDto editorData);
        Task<ErrorInfoBaseDto> DeleteFarePolicy(FarePolicyDeleteDataDto deleteData);
    }
}