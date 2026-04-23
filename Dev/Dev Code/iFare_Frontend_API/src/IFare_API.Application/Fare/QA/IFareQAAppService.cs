using System.Threading.Tasks;
using Abp.Application.Services;
using IFare_API.Fare.QA.Dto;

namespace IFare_API.Fare.QA
{
    public interface IFareQAAppService : IApplicationService 
    {
        Task<FareQAResultDto> GetIFareQAList();
    }
}