// ---------------------------------------------------------------------------
// 【已停用】ABP 框架樣板產生的帳號註冊服務（2026-08-26 整段註解）
//
// 這個檔案不是本專案寫的，是建立 ABP 專案時框架自動產生的範例。兩個線索可以佐證：
// 第 13 行原本留著框架附的英文參考網址註解，第 48 行原本留著英文註解
// 「Assumed email address is always confirmed. Change this if you want to
//  implement email confirmation.」——也就是框架在提醒開發者「這只是示範，記得改」，
// 而它從未被改過。
//
// 為什麼停用（2026-08-25 健檢列為高風險，且是清單上唯一未處理的高風險項）：
// 1. 這個類別沒有任何 [Authorize] 標記，而 ABP 的 CreateControllersForAppServices
//    會把 Application 組件內的 AppService 自動暴露成
//    /api/services/app/{Service}/{Method} 路由；AuthConfigurer 的 JwtAuth 只是
//    具名 policy、不是 fallback policy，所以沒標記＝完全匿名可打。
// 2. Register 呼叫 RegisterAsync 時第六個參數硬編碼 true（信箱視為已驗證），
//    等於任何人都能在後台管理系統建立一個可直接登入的帳號。
// 3. IsTenantAvailable 也可被匿名用來列舉租戶。
// 4. 類別與介面都與 IFare_BDAPI.Account 底下我們自己的 AccountAppService 同名，
//    路由存在互相遮蔽的風險。
//    ⚠️ IFare_BDAPI.Account 那支是後台帳號管理（GetAccountList／InsertAccount／
//    UpdateAccount，有 [Authorize(Policy = "JwtAuth")]），正在使用中，不要動它。
//
// 停用而非刪除：保留檔案讓下一個人打開資料夾就看得到這段說明，效果與刪除相同
//（ABP 找不到型別，路由自然消失）。已確認全 repo 沒有任何程式引用這兩個型別。
//
// 注意：本檔相依的 UserRegistrationManager 不可刪——TokenAuthController（登入）
// 也在用它。這裡停用的只是「匿名註冊」這個入口。
//
// 日後若要提供使用者自行註冊，應重寫一個有授權控管、真正做信箱驗證、且能防濫用的
// 版本，不要直接恢復這份樣板。
// ---------------------------------------------------------------------------

// using System.Threading.Tasks;
// using Abp.Configuration;
// using Abp.Zero.Configuration;
// using IFare_BDAPI.Authorization.Accounts.Dto;
// using IFare_BDAPI.Authorization.Users;
// using Microsoft.AspNetCore.Mvc;

// namespace IFare_BDAPI.Authorization.Accounts
// {
//     [ApiExplorerSettings(IgnoreApi = true)]
//     public class AccountAppService : IFare_BDAPIAppServiceBase, IAccountAppService
//     {
//         // from: http://regexlib.com/REDetails.aspx?regexp_id=1923
//         public const string PasswordRegex = "(?=^.{8,}$)(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\\s)[0-9a-zA-Z!@#$%^&*()]*$";
//
//         private readonly UserRegistrationManager _userRegistrationManager;
//
//         public AccountAppService(
//             UserRegistrationManager userRegistrationManager)
//         {
//             _userRegistrationManager = userRegistrationManager;
//         }
//
//         public async Task<IsTenantAvailableOutput> IsTenantAvailable(IsTenantAvailableInput input)
//         {
//             var tenant = await TenantManager.FindByTenancyNameAsync(input.TenancyName);
//             if (tenant == null)
//             {
//                 return new IsTenantAvailableOutput(TenantAvailabilityState.NotFound);
//             }
//
//             if (!tenant.IsActive)
//             {
//                 return new IsTenantAvailableOutput(TenantAvailabilityState.InActive);
//             }
//
//             return new IsTenantAvailableOutput(TenantAvailabilityState.Available, tenant.Id);
//         }
//
//         public async Task<RegisterOutput> Register(RegisterInput input)
//         {
//             var user = await _userRegistrationManager.RegisterAsync(
//                 input.Name,
//                 input.Surname,
//                 input.EmailAddress,
//                 input.UserName,
//                 input.Password,
//                 true // Assumed email address is always confirmed. Change this if you want to implement email confirmation.
//             );
//
//             var isEmailConfirmationRequiredForLogin = await SettingManager.GetSettingValueAsync<bool>(AbpZeroSettingNames.UserManagement.IsEmailConfirmationRequiredForLogin);
//
//             return new RegisterOutput
//             {
//                 CanLogin = user.IsActive && (user.IsEmailConfirmed || !isEmailConfirmationRequiredForLogin)
//             };
//         }
//     }
// }
