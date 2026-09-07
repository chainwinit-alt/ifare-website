// ---------------------------------------------------------------------------
// 【已停用】ABP 框架樣板產生的帳號註冊服務介面（2026-08-26 整段註解）
//
// 停用原因見同資料夾的 AccountAppService.cs：那支實作沒有任何 [Authorize] 保護，
// 而 ABP 會自動把 AppService 暴露成 /api/services/app/Account/... 路由，
// 等於任何人都能在後台管理系統建立一個「信箱已驗證、可直接登入」的帳號。
//
// 介面必須與實作一起註解：只註解實作會留下一個沒有人實作的 IApplicationService，
// ABP 啟動時的自動註冊會找不到對應型別。
//
// 保留（而非刪除）是為了讓下一個人打開資料夾就看得到這段說明；
// 要恢復請先補上授權與信箱驗證，並解決與 IFare_BDAPI.Account.IAccountAppService
// 的同名衝突（那支是我們自己在用的後台帳號管理，有 JwtAuth 保護，不要動它）。
// ---------------------------------------------------------------------------

// using System.Threading.Tasks;
// using Abp.Application.Services;
// using IFare_BDAPI.Authorization.Accounts.Dto;

// namespace IFare_BDAPI.Authorization.Accounts
// {
//     public interface IAccountAppService : IApplicationService
//     {
//         Task<IsTenantAvailableOutput> IsTenantAvailable(IsTenantAvailableInput input);
//
//         Task<RegisterOutput> Register(RegisterInput input);
//     }
// }
