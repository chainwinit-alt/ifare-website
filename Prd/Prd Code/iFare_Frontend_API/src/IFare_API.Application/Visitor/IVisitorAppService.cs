using System.Threading.Tasks;
using Abp.Application.Services;
using IFare_API.Common.Dto;

namespace IFare_API.Visitor 
{
    public interface IVisitorAppService : IApplicationService
    {
        Task<ErrorInfoBaseDto> SetVisitorRecord(string router);
    }
}