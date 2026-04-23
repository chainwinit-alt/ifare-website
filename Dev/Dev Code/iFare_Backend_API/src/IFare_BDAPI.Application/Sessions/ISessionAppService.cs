using System.Threading.Tasks;
using Abp.Application.Services;
using IFare_BDAPI.Sessions.Dto;

namespace IFare_BDAPI.Sessions
{
    public interface ISessionAppService : IApplicationService
    {
        Task<GetCurrentLoginInformationsOutput> GetCurrentLoginInformations();
    }
}
