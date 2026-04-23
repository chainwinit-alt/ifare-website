using System.Threading.Tasks;
using Abp.Application.Services;
using IFare_BDAPI.Authorization.Accounts.Dto;

namespace IFare_BDAPI.Authorization.Accounts
{
    public interface IAccountAppService : IApplicationService
    {
        Task<IsTenantAvailableOutput> IsTenantAvailable(IsTenantAvailableInput input);

        Task<RegisterOutput> Register(RegisterInput input);
    }
}
