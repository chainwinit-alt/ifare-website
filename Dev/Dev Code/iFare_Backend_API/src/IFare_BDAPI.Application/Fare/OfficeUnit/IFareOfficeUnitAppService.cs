using System.Threading.Tasks;
using Abp.Application.Services;
using IFare_BDAPI.Common.Dto;
using IFare_BDAPI.Fare.OfficeUnit.Dto;

namespace IFare_BDAPI.Fare.OfficeUnit
{
    public interface IFareOfficeUnitAppService : IApplicationService
    {
        Task<FareOfficeUnitResultDto> GetDataList(FareOfficeUnitFilterParamDto param);
        Task<ErrorInfoBaseDto> InsertFareOfficeUnit(FareOfficeUnitInsertDataDto insertData);
        Task<ErrorInfoBaseDto> UpdateFareOfficeUnit(FareOfficeUnitEditorDataDto editorData);
    }
}