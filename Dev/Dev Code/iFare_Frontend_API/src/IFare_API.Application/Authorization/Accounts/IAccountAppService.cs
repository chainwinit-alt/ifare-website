using System.Threading.Tasks;
using Abp.Application.Services;
using IFare_API.Authorization.Accounts.Dto;

namespace IFare_API.Authorization.Accounts
{
    public interface IAccountAppService : IApplicationService
    {
        Task<IsTenantAvailableOutput> IsTenantAvailable(IsTenantAvailableInput input);

        Task<RegisterOutput> Register(RegisterInput input);
    }
}
