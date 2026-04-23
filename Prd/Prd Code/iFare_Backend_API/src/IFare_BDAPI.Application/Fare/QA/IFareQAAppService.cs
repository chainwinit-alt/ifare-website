using System.Threading.Tasks;
using Abp.Application.Services;
using IFare_BDAPI.Common.Dto;
using IFare_BDAPI.Fare.QA.Dto;

namespace IFare_BDAPI.Fare.QA
{
    public interface IFareQAAppService : IApplicationService
    {
       Task<FareQAResultDto> GetDataList(FareQAFilterParamDto param);
       Task<ErrorInfoBaseDto> InsertFareQA(FareQAInsertDataDto insertData);
        Task<ErrorInfoBaseDto> UpdateFareQA(FareQAEditorDataDto editorData);
        Task<ErrorInfoBaseDto> DeleteFareQA(FareQADeleteDataDto deleteData);
    }
}