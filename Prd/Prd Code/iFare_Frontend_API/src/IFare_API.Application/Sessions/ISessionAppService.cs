using System.Threading.Tasks;
using Abp.Application.Services;
using IFare_API.Sessions.Dto;

namespace IFare_API.Sessions
{
    public interface ISessionAppService : IApplicationService
    {
        Task<GetCurrentLoginInformationsOutput> GetCurrentLoginInformations();
    }
}
