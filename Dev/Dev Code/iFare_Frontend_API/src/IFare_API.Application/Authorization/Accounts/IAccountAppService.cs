using System.Threading.Tasks;
using Abp.Application.Services;
using IFare_API.Authorization.Accounts.Dto;

namespace IFare_API.Authorization.Accounts
{
    public interface IAccountAppService : IApplicationService
    {
        Task<IsTenantAvailableOutput> IsTenantAvailable(IsTenantAvailableInput input);

        // 前台不提供註冊功能：ABP 動態 API 會把它開成匿名可呼叫的
        // /api/services/app/Account/Register，任何人都能自行建立帳號。
        // 與 AccountAppService.Register 成對停用，不留沒人實作的介面成員。
        //Task<RegisterOutput> Register(RegisterInput input);
    }
}
