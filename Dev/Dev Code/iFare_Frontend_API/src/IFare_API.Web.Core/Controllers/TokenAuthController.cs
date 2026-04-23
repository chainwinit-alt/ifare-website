using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Abp.Authorization;
using Abp.Authorization.Users;
using Abp.MultiTenancy;
using Abp.Runtime.Security;
using Abp.UI;
using IFare_API.Authentication.External;
using IFare_API.Authentication.JwtBearer;
using IFare_API.Authorization;
using IFare_API.Authorization.Users;
using IFare_API.Models.TokenAuth;
using IFare_API.MultiTenancy;

namespace IFare_API.Controllers
{
    /// <summary>
    /// Token 驗證控制器，負責處理使用者登入及 JWT 存取權杖的核發與外部登入驗證。
    /// 此控制器在 Swagger 文件中不顯示（IgnoreApi = true），僅供內部或管理端使用。
    /// </summary>
    [ApiExplorerSettings(IgnoreApi = true)]
    [Route("api/[controller]/[action]")]
    public class TokenAuthController : IFare_APIControllerBase
    {
        /// <summary>登入管理員，負責執行帳號密碼或外部登入驗證</summary>
        private readonly LogInManager _logInManager;

        /// <summary>租戶快取，用於查詢租戶資訊</summary>
        private readonly ITenantCache _tenantCache;

        /// <summary>ABP 登入結果輔助工具，用於將登入失敗結果轉換為例外</summary>
        private readonly AbpLoginResultTypeHelper _abpLoginResultTypeHelper;

        /// <summary>JWT Token 設定，包含金鑰、發行者、到期時間等</summary>
        private readonly TokenAuthConfiguration _configuration;

        /// <summary>外部驗證設定，存放第三方登入提供者清單</summary>
        private readonly IExternalAuthConfiguration _externalAuthConfiguration;

        /// <summary>外部驗證管理員，負責向第三方取得使用者資訊</summary>
        private readonly IExternalAuthManager _externalAuthManager;

        /// <summary>使用者註冊管理員，用於在外部登入時自動建立本地帳號</summary>
        private readonly UserRegistrationManager _userRegistrationManager;

        /// <summary>
        /// 建構子，透過依賴注入初始化所有相依服務。
        /// </summary>
        /// <param name="logInManager">登入管理員</param>
        /// <param name="tenantCache">租戶快取</param>
        /// <param name="abpLoginResultTypeHelper">登入結果型別輔助工具</param>
        /// <param name="configuration">JWT Token 設定</param>
        /// <param name="externalAuthConfiguration">外部驗證設定</param>
        /// <param name="externalAuthManager">外部驗證管理員</param>
        /// <param name="userRegistrationManager">使用者註冊管理員</param>
        public TokenAuthController(
            LogInManager logInManager,
            ITenantCache tenantCache,
            AbpLoginResultTypeHelper abpLoginResultTypeHelper,
            TokenAuthConfiguration configuration,
            IExternalAuthConfiguration externalAuthConfiguration,
            IExternalAuthManager externalAuthManager,
            UserRegistrationManager userRegistrationManager)
        {
            _logInManager = logInManager;
            _tenantCache = tenantCache;
            _abpLoginResultTypeHelper = abpLoginResultTypeHelper;
            _configuration = configuration;
            _externalAuthConfiguration = externalAuthConfiguration;
            _externalAuthManager = externalAuthManager;
            _userRegistrationManager = userRegistrationManager;
        }

        /// <summary>
        /// 使用帳號密碼進行登入，成功後回傳 JWT 存取權杖。
        /// </summary>
        /// <param name="model">登入資訊，包含帳號（或 Email）及密碼</param>
        /// <returns>驗證結果，包含存取權杖、加密後的權杖、到期秒數及使用者 ID</returns>
        [HttpPost]
        public async Task<AuthenticateResultModel> Authenticate([FromBody] AuthenticateModel model)
        {
            // 執行登入驗證，取得登入結果
            var loginResult = await GetLoginResultAsync(
                model.UserNameOrEmailAddress,
                model.Password,
                GetTenancyNameOrNull()
            );

            // 根據登入結果的身分資訊產生 JWT 存取權杖
            var accessToken = CreateAccessToken(CreateJwtClaims(loginResult.Identity));

            // 回傳包含存取權杖及相關資訊的結果物件
            return new AuthenticateResultModel
            {
                AccessToken = accessToken,
                EncryptedAccessToken = GetEncryptedAccessToken(accessToken), // 加密後的 Token，供前端安全儲存
                ExpireInSeconds = (int)_configuration.Expiration.TotalSeconds, // Token 有效期間（秒）
                UserId = loginResult.User.Id // 登入成功的使用者 ID
            };
        }

        /// <summary>
        /// 取得系統目前支援的所有外部登入提供者清單（如 Google、Facebook 等）。
        /// </summary>
        /// <returns>外部登入提供者資訊清單</returns>
        [HttpGet]
        public List<ExternalLoginProviderInfoModel> GetExternalAuthenticationProviders()
        {
            // 將設定中的提供者清單對應為前端資料傳輸物件
            return ObjectMapper.Map<List<ExternalLoginProviderInfoModel>>(_externalAuthConfiguration.Providers);
        }

        /// <summary>
        /// 使用外部登入提供者（如 Google、Facebook）進行驗證並取得存取權杖。
        /// 若使用者尚未在本系統註冊，則自動建立新帳號。
        /// </summary>
        /// <param name="model">外部驗證資訊，包含提供者名稱、ProviderKey 及存取碼</param>
        /// <returns>外部驗證結果，包含存取權杖或等待啟用旗標</returns>
        [HttpPost]
        public async Task<ExternalAuthenticateResultModel> ExternalAuthenticate([FromBody] ExternalAuthenticateModel model)
        {
            // 向外部提供者驗證並取得使用者資訊
            var externalUser = await GetExternalUserInfo(model);

            // 嘗試以外部登入資訊在本系統進行登入
            var loginResult = await _logInManager.LoginAsync(new UserLoginInfo(model.AuthProvider, model.ProviderKey, model.AuthProvider), GetTenancyNameOrNull());

            switch (loginResult.Result)
            {
                case AbpLoginResultType.Success:
                    {
                        // 登入成功，產生並回傳 JWT 存取權杖
                        var accessToken = CreateAccessToken(CreateJwtClaims(loginResult.Identity));
                        return new ExternalAuthenticateResultModel
                        {
                            AccessToken = accessToken,
                            EncryptedAccessToken = GetEncryptedAccessToken(accessToken),
                            ExpireInSeconds = (int)_configuration.Expiration.TotalSeconds
                        };
                    }
                case AbpLoginResultType.UnknownExternalLogin:
                    {
                        // 本系統尚無此外部登入帳號，自動註冊新使用者
                        var newUser = await RegisterExternalUserAsync(externalUser);
                        if (!newUser.IsActive)
                        {
                            // 新帳號尚未啟用，回傳等待啟用旗標
                            return new ExternalAuthenticateResultModel
                            {
                                WaitingForActivation = true
                            };
                        }

                        // Try to login again with newly registered user!
                        // 以新建帳號再次嘗試登入
                        loginResult = await _logInManager.LoginAsync(new UserLoginInfo(model.AuthProvider, model.ProviderKey, model.AuthProvider), GetTenancyNameOrNull());
                        if (loginResult.Result != AbpLoginResultType.Success)
                        {
                            // 再次登入失敗，拋出對應的例外
                            throw _abpLoginResultTypeHelper.CreateExceptionForFailedLoginAttempt(
                                loginResult.Result,
                                model.ProviderKey,
                                GetTenancyNameOrNull()
                            );
                        }

                        // 新帳號登入成功，產生並回傳 JWT 存取權杖
                        var accessToken = CreateAccessToken(CreateJwtClaims(loginResult.Identity));

                        return new ExternalAuthenticateResultModel
                        {
                            AccessToken = accessToken,
                            EncryptedAccessToken = GetEncryptedAccessToken(accessToken),
                            ExpireInSeconds = (int)_configuration.Expiration.TotalSeconds
                        };
                    }
                default:
                    {
                        // 其他登入失敗情況，拋出對應的例外
                        throw _abpLoginResultTypeHelper.CreateExceptionForFailedLoginAttempt(
                            loginResult.Result,
                            model.ProviderKey,
                            GetTenancyNameOrNull()
                        );
                    }
            }
        }

        /// <summary>
        /// 將外部登入使用者資訊註冊為本系統新使用者，並建立外部登入關聯。
        /// </summary>
        /// <param name="externalUser">外部提供者回傳的使用者資訊</param>
        /// <returns>新建立的本系統使用者實體</returns>
        private async Task<User> RegisterExternalUserAsync(ExternalAuthUserInfo externalUser)
        {
            // 呼叫使用者註冊管理員建立新帳號，使用 Email 作為使用者名稱，並自動啟用
            var user = await _userRegistrationManager.RegisterAsync(
                externalUser.Name,
                externalUser.Surname,
                externalUser.EmailAddress,
                externalUser.EmailAddress,
                Authorization.Users.User.CreateRandomPassword(), // 產生隨機密碼（外部登入不需要密碼登入）
                true
            );

            // 建立使用者與外部登入提供者的關聯紀錄
            user.Logins = new List<UserLogin>
            {
                new UserLogin
                {
                    LoginProvider = externalUser.Provider,
                    ProviderKey = externalUser.ProviderKey,
                    TenantId = user.TenantId
                }
            };

            // 儲存資料庫變更
            await CurrentUnitOfWork.SaveChangesAsync();

            return user;
        }

        /// <summary>
        /// 向外部驗證提供者取得並驗證使用者資訊。
        /// </summary>
        /// <param name="model">外部驗證請求資訊</param>
        /// <returns>外部提供者回傳的使用者資訊</returns>
        /// <exception cref="UserFriendlyException">當 ProviderKey 不一致時拋出驗證失敗例外</exception>
        private async Task<ExternalAuthUserInfo> GetExternalUserInfo(ExternalAuthenticateModel model)
        {
            // 向外部提供者取得使用者資訊
            var userInfo = await _externalAuthManager.GetUserInfo(model.AuthProvider, model.ProviderAccessCode);

            // 比對回傳的 ProviderKey 是否與請求一致，防止偽造
            if (userInfo.ProviderKey != model.ProviderKey)
            {
                throw new UserFriendlyException(L("CouldNotValidateExternalUser"));
            }

            return userInfo;
        }

        /// <summary>
        /// 取得目前 Session 所屬租戶的名稱，若為 Host 端則回傳 null。
        /// </summary>
        /// <returns>租戶名稱，或 null（若為 Host）</returns>
        private string GetTenancyNameOrNull()
        {
            if (!AbpSession.TenantId.HasValue)
            {
                // 無租戶 ID，表示為 Host 端操作
                return null;
            }

            // 從快取中查詢租戶名稱
            return _tenantCache.GetOrNull(AbpSession.TenantId.Value)?.TenancyName;
        }

        /// <summary>
        /// 執行帳號密碼登入並取得結果，若登入失敗則拋出對應的例外。
        /// </summary>
        /// <param name="usernameOrEmailAddress">使用者名稱或 Email</param>
        /// <param name="password">密碼</param>
        /// <param name="tenancyName">租戶名稱</param>
        /// <returns>登入成功的結果物件，包含使用者及身分資訊</returns>
        private async Task<AbpLoginResult<Tenant, User>> GetLoginResultAsync(string usernameOrEmailAddress, string password, string tenancyName)
        {
            // 呼叫 ABP 登入管理員執行驗證
            var loginResult = await _logInManager.LoginAsync(usernameOrEmailAddress, password, tenancyName);

            switch (loginResult.Result)
            {
                case AbpLoginResultType.Success:
                    return loginResult; // 登入成功，直接回傳結果
                default:
                    // 登入失敗，轉換為對應的使用者友善例外
                    throw _abpLoginResultTypeHelper.CreateExceptionForFailedLoginAttempt(loginResult.Result, usernameOrEmailAddress, tenancyName);
            }
        }

        /// <summary>
        /// 根據 Claims 產生 JWT 存取權杖字串。
        /// </summary>
        /// <param name="claims">要包含在 JWT 中的 Claim 集合</param>
        /// <param name="expiration">自訂到期時間，若未指定則使用系統設定值</param>
        /// <returns>已簽署的 JWT 字串</returns>
        private string CreateAccessToken(IEnumerable<Claim> claims, TimeSpan? expiration = null)
        {
            var now = DateTime.UtcNow; // 使用 UTC 時間作為 Token 起始時間

            // 建立 JWT Security Token 物件
            var jwtSecurityToken = new JwtSecurityToken(
                issuer: _configuration.Issuer,           // 發行者
                audience: _configuration.Audience,       // 受眾
                claims: claims,                           // 使用者身分聲明
                notBefore: now,                           // Token 生效起始時間
                expires: now.Add(expiration ?? _configuration.Expiration), // Token 到期時間
                signingCredentials: _configuration.SigningCredentials       // 簽名憑證
            );

            // 將 JWT 物件序列化為字串格式
            return new JwtSecurityTokenHandler().WriteToken(jwtSecurityToken);
        }

        /// <summary>
        /// 從 ClaimsIdentity 建立適用於 JWT 的 Claim 清單，並加入標準 JWT Claim（sub、jti、iat）。
        /// </summary>
        /// <param name="identity">使用者身分 Claims</param>
        /// <returns>包含標準 JWT Claims 的完整清單</returns>
        private static List<Claim> CreateJwtClaims(ClaimsIdentity identity)
        {
            var claims = identity.Claims.ToList();
            // 取得 NameIdentifier Claim 作為 Subject
            var nameIdClaim = claims.First(c => c.Type == ClaimTypes.NameIdentifier);

            // Specifically add the jti (random nonce), iat (issued timestamp), and sub (subject/user) claims.
            // 加入標準 JWT Claims：sub（主體/使用者）、jti（隨機亂數防重放）、iat（簽發時間）
            claims.AddRange(new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, nameIdClaim.Value),  // 使用者識別主體
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()), // 唯一 Token ID，防止重放攻擊
                new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.Now.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64) // 簽發時間（Unix 時間戳）
            });

            return claims;
        }

        /// <summary>
        /// 使用對稱加密將存取權杖加密，供前端安全儲存。
        /// </summary>
        /// <param name="accessToken">原始 JWT 字串</param>
        /// <returns>加密後的 Token 字串</returns>
        private string GetEncryptedAccessToken(string accessToken)
        {
            // 使用 ABP 內建的 SimpleStringCipher 進行對稱加密
            return SimpleStringCipher.Instance.Encrypt(accessToken);
        }
    }
}
