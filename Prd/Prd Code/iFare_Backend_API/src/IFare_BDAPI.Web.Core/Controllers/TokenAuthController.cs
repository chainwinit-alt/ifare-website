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
using IFare_BDAPI.Authentication.External;
using IFare_BDAPI.Authentication.JwtBearer;
using IFare_BDAPI.Authorization;
using IFare_BDAPI.Authorization.Users;
using IFare_BDAPI.Models.TokenAuth;
using IFare_BDAPI.MultiTenancy;
using IFare_BDAPI.TaskManager.Auth;
using IFare_BDAPI.TaskManager.Auth.ValueModel;

namespace IFare_BDAPI.Controllers
{
    /// <summary>
    /// Token 驗證控制器。
    /// 負責處理使用者登入驗證、JWT Token 產生，以及第三方外部登入（External Authentication）。
    /// 繼承自 <see cref="IFare_BDAPIControllerBase"/>，路由格式為 api/TokenAuth/{action}。
    /// </summary>
    [Route("api/[controller]/[action]")]
    public class TokenAuthController : IFare_BDAPIControllerBase
    {
        // ABP 框架提供的登入管理器，用於執行帳號密碼驗證
        private readonly LogInManager _logInManager;
        // 租戶快取，用於多租戶架構下查詢租戶資訊
        private readonly ITenantCache _tenantCache;
        // ABP 登入結果型別輔助類別，用於將登入失敗結果轉換為例外
        private readonly AbpLoginResultTypeHelper _abpLoginResultTypeHelper;
        // JWT Token 設定（Issuer、Audience、過期時間、簽署憑證等）
        private readonly TokenAuthConfiguration _configuration;
        // 外部驗證提供者設定（例如 Google、Facebook 等）
        private readonly IExternalAuthConfiguration _externalAuthConfiguration;
        // 外部驗證管理器，負責向第三方取得使用者資訊
        private readonly IExternalAuthManager _externalAuthManager;
        // 使用者註冊管理器，用於首次外部登入時自動建立帳號
        private readonly UserRegistrationManager _userRegistrationManager;
        // 自訂驗證任務管理器，封裝自訂使用者驗證邏輯
        private readonly IAuthTaskManager _authTaskManager;

        /// <summary>
        /// 建構子，透過相依性注入初始化所有依賴項目。
        /// </summary>
        /// <param name="logInManager">ABP 登入管理器</param>
        /// <param name="tenantCache">租戶快取服務</param>
        /// <param name="abpLoginResultTypeHelper">登入結果輔助類別</param>
        /// <param name="configuration">JWT Token 設定</param>
        /// <param name="externalAuthConfiguration">外部驗證提供者設定</param>
        /// <param name="externalAuthManager">外部驗證管理器</param>
        /// <param name="userRegistrationManager">使用者註冊管理器</param>
        /// <param name="authTaskManager">自訂驗證任務管理器</param>
        public TokenAuthController(
            LogInManager logInManager,
            ITenantCache tenantCache,
            AbpLoginResultTypeHelper abpLoginResultTypeHelper,
            TokenAuthConfiguration configuration,
            IExternalAuthConfiguration externalAuthConfiguration,
            IExternalAuthManager externalAuthManager,
            UserRegistrationManager userRegistrationManager,
            IAuthTaskManager authTaskManager)
        {
            _logInManager = logInManager;
            _tenantCache = tenantCache;
            _abpLoginResultTypeHelper = abpLoginResultTypeHelper;
            _configuration = configuration;
            _externalAuthConfiguration = externalAuthConfiguration;
            _externalAuthManager = externalAuthManager;
            _userRegistrationManager = userRegistrationManager;
            _authTaskManager = authTaskManager;
        }

        #region [Ori ABP]
        // [HttpPost]
        // public async Task<AuthenticateResultModel> Authenticate([FromBody] AuthenticateModel model)
        // {
        //     var loginResult = await GetLoginResultAsync(
        //         model.UserNameOrEmailAddress,
        //         model.Password,
        //         GetTenancyNameOrNull()
        //     );

        //     var accessToken = CreateAccessToken(CreateJwtClaims(loginResult.Identity));

        //     return new AuthenticateResultModel
        //     {
        //         AccessToken = accessToken,
        //         EncryptedAccessToken = GetEncryptedAccessToken(accessToken),
        //         ExpireInSeconds = (int)_configuration.Expiration.TotalSeconds,
        //         UserId = loginResult.User.Id
        //     };
        // }
        #endregion

        /// <summary>
        /// 使用者登入驗證端點（POST api/TokenAuth/Authenticate）。
        /// 接收帳號與密碼，透過自訂驗證邏輯驗證使用者身份，驗證成功後回傳 JWT Token。
        /// </summary>
        /// <param name="model">包含帳號（UserNameOrEmailAddress）及密碼（Password）的登入模型</param>
        /// <returns>包含 AccessToken、加密 Token、過期秒數及使用者 ID 的驗證結果</returns>
        [HttpPost]
        public async Task<AuthenticateResultModel> Authenticate([FromBody] AuthenticateModel model)
        {
            // 使用自訂驗證管理器驗證帳號密碼，取得使用者資訊（非 ABP 預設登入流程）
            var userInfo = _authTaskManager.GetAuthUser(model.UserNameOrEmailAddress, model.Password);

            // 若使用者資訊為 null，表示帳號密碼錯誤，拋出友善錯誤例外
            if (userInfo == null)
            {
                throw new UserFriendlyException("Authentication failed!!");
            }

            // 根據驗證通過的使用者資訊，建立 ClaimsIdentity 身份聲明集合
            var loginResult = await GetLoginClaimIdentityAsync(userInfo);

            // 根據身份聲明產生 JWT Access Token
            var accessToken = CreateAccessToken(CreateJwtClaims(loginResult));

            // 從 Claims 中取出 Sid（使用者識別碼），格式為 "xxx-xxx-userId"，取最後一段作為使用者 ID
            var sidArray = loginResult.Claims.FirstOrDefault(item => item.Type == ClaimTypes.Sid).Value.Split('-');
            var userid = (long) Convert.ToDecimal(sidArray[sidArray.Length-1]);

            return new AuthenticateResultModel
            {
                AccessToken = accessToken,
                EncryptedAccessToken = GetEncryptedAccessToken(accessToken), // 加密版 Token 供特殊場景使用
                ExpireInSeconds = (int)_configuration.Expiration.TotalSeconds, // Token 有效時間（秒）
                UserId = userid
            };
        }

        /// <summary>
        /// 根據已驗證的使用者資訊建立 ClaimsIdentity（身份聲明集合）。
        /// </summary>
        /// <param name="authUser">已驗證的使用者資料模型</param>
        /// <returns>包含使用者資訊的 <see cref="ClaimsIdentity"/> 物件</returns>
        private async Task<ClaimsIdentity> GetLoginClaimIdentityAsync(AuthUser authUser)
        {
            // 取得 ASP.NET Identity 的安全戳 Claim 型別名稱
            var securityStampClaimType = new ClaimsIdentityOptions().SecurityStampClaimType;

            // 建立 Claims 清單，包含使用者 ID、帳號名稱、帳號代碼、Email、安全戳及角色
            var claims = new List<Claim>()
            {
                new Claim(ClaimTypes.Sid, authUser.Id.ToString()),              // 使用者唯一識別碼
                new Claim(ClaimTypes.Name, authUser.UserName),                  // 使用者名稱
                new Claim(ClaimTypes.NameIdentifier, authUser.Act),             // 帳號代碼（Act）
                new Claim(ClaimTypes.Email, authUser.Email),                    // 使用者 Email
                new Claim(securityStampClaimType, Guid.NewGuid().ToString()),   // 安全戳，每次登入產生新的 GUID
                new Claim(ClaimTypes.Role, "User")                              // 使用者角色
            };

            return new ClaimsIdentity(claims, "Login");
        }




        /// <summary>
        /// 取得目前系統設定的所有外部登入提供者清單（GET api/TokenAuth/GetExternalAuthenticationProviders）。
        /// </summary>
        /// <returns>外部登入提供者資訊清單</returns>
        [HttpGet]
        public List<ExternalLoginProviderInfoModel> GetExternalAuthenticationProviders()
        {
            return ObjectMapper.Map<List<ExternalLoginProviderInfoModel>>(_externalAuthConfiguration.Providers);
        }

        /// <summary>
        /// 透過第三方外部登入提供者進行驗證（POST api/TokenAuth/ExternalAuthenticate）。
        /// 如果使用者為首次登入，系統會自動建立帳號；若帳號已存在則直接產生 Token。
        /// </summary>
        /// <param name="model">包含外部提供者名稱、ProviderKey 及 AccessCode 的外部驗證模型</param>
        /// <returns>包含 AccessToken、加密 Token 及過期秒數的外部驗證結果</returns>
        [HttpPost]
        public async Task<ExternalAuthenticateResultModel> ExternalAuthenticate([FromBody] ExternalAuthenticateModel model)
        {
            // 向外部提供者驗證並取得使用者資訊
            var externalUser = await GetExternalUserInfo(model);

            // 嘗試以外部登入資訊進行 ABP 登入
            var loginResult = await _logInManager.LoginAsync(new UserLoginInfo(model.AuthProvider, model.ProviderKey, model.AuthProvider), GetTenancyNameOrNull());

            switch (loginResult.Result)
            {
                case AbpLoginResultType.Success:
                    {
                        // 登入成功，產生並回傳 JWT Token
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
                        // 外部登入帳號不存在，自動建立新帳號
                        var newUser = await RegisterExternalUserAsync(externalUser);
                        if (!newUser.IsActive)
                        {
                            // 若帳號尚未啟用，回傳等待啟用狀態
                            return new ExternalAuthenticateResultModel
                            {
                                WaitingForActivation = true
                            };
                        }

                        // Try to login again with newly registered user!
                        // 帳號已建立且啟用，再次嘗試登入
                        loginResult = await _logInManager.LoginAsync(new UserLoginInfo(model.AuthProvider, model.ProviderKey, model.AuthProvider), GetTenancyNameOrNull());
                        if (loginResult.Result != AbpLoginResultType.Success)
                        {
                            throw _abpLoginResultTypeHelper.CreateExceptionForFailedLoginAttempt(
                                loginResult.Result,
                                model.ProviderKey,
                                GetTenancyNameOrNull()
                            );
                        }

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
        /// 根據外部使用者資訊，在系統中建立新的使用者帳號。
        /// </summary>
        /// <param name="externalUser">從外部提供者取得的使用者資訊</param>
        /// <returns>新建立的使用者實體</returns>
        private async Task<User> RegisterExternalUserAsync(ExternalAuthUserInfo externalUser)
        {
            // 使用外部使用者的姓名、Email 建立帳號，隨機產生密碼，設定為立即啟用
            var user = await _userRegistrationManager.RegisterAsync(
                externalUser.Name,
                externalUser.Surname,
                externalUser.EmailAddress,
                externalUser.EmailAddress,
                Authorization.Users.User.CreateRandomPassword(),
                true
            );

            // 設定使用者的外部登入資訊（提供者名稱及 Key）
            user.Logins = new List<UserLogin>
            {
                new UserLogin
                {
                    LoginProvider = externalUser.Provider,
                    ProviderKey = externalUser.ProviderKey,
                    TenantId = user.TenantId
                }
            };

            // 儲存至資料庫
            await CurrentUnitOfWork.SaveChangesAsync();

            return user;
        }

        /// <summary>
        /// 向外部提供者驗證，並取得使用者資訊，同時比對 ProviderKey 確保資料正確性。
        /// </summary>
        /// <param name="model">外部驗證模型</param>
        /// <returns>從外部提供者取得的使用者資訊</returns>
        private async Task<ExternalAuthUserInfo> GetExternalUserInfo(ExternalAuthenticateModel model)
        {
            var userInfo = await _externalAuthManager.GetUserInfo(model.AuthProvider, model.ProviderAccessCode);
            // 比對回傳的 ProviderKey 與請求的 ProviderKey 是否一致，防止偽造
            if (userInfo.ProviderKey != model.ProviderKey)
            {
                throw new UserFriendlyException(L("CouldNotValidateExternalUser"));
            }

            return userInfo;
        }

        /// <summary>
        /// 從目前的 ABP Session 中取得租戶名稱，若無租戶則回傳 null。
        /// </summary>
        /// <returns>租戶名稱字串，或 null（代表 Host 層級）</returns>
        private string GetTenancyNameOrNull()
        {
            if (!AbpSession.TenantId.HasValue)
            {
                return null;
            }

            return _tenantCache.GetOrNull(AbpSession.TenantId.Value)?.TenancyName;
        }

        /// <summary>
        /// 執行 ABP 標準帳號密碼登入流程，成功則回傳登入結果，失敗則拋出例外。
        /// （目前已由自訂 <see cref="IAuthTaskManager"/> 取代，保留供參考）
        /// </summary>
        /// <param name="usernameOrEmailAddress">帳號名稱或 Email</param>
        /// <param name="password">密碼</param>
        /// <param name="tenancyName">租戶名稱</param>
        /// <returns>ABP 登入結果</returns>
        private async Task<AbpLoginResult<Tenant, User>> GetLoginResultAsync(string usernameOrEmailAddress, string password, string tenancyName)
        {
            var loginResult = await _logInManager.LoginAsync(usernameOrEmailAddress, password, tenancyName);

            switch (loginResult.Result)
            {
                case AbpLoginResultType.Success:
                    return loginResult;
                default:
                    throw _abpLoginResultTypeHelper.CreateExceptionForFailedLoginAttempt(loginResult.Result, usernameOrEmailAddress, tenancyName);
            }
        }

        /// <summary>
        /// 根據 Claims 集合產生 JWT Access Token 字串。
        /// </summary>
        /// <param name="claims">使用者身份聲明集合</param>
        /// <param name="expiration">自訂過期時間，若未指定則使用設定檔預設值</param>
        /// <returns>JWT Token 字串</returns>
        private string CreateAccessToken(IEnumerable<Claim> claims, TimeSpan? expiration = null)
        {
            var now = DateTime.UtcNow;

            // 建立 JWT Token，包含 Issuer、Audience、Claims、有效時間及簽署憑證
            var jwtSecurityToken = new JwtSecurityToken(
                issuer: _configuration.Issuer,
                audience: _configuration.Audience,
                claims: claims,
                notBefore: now,
                expires: now.Add(expiration ?? _configuration.Expiration),
                signingCredentials: _configuration.SigningCredentials
            );

            // 將 JwtSecurityToken 物件序列化為字串
            return new JwtSecurityTokenHandler().WriteToken(jwtSecurityToken);
        }

        /// <summary>
        /// 將 ClaimsIdentity 轉換為 JWT 標準格式的 Claims 清單，並加入 JWT 標準聲明（jti、iat、sub）。
        /// </summary>
        /// <param name="identity">使用者身份聲明物件</param>
        /// <returns>符合 JWT 規範的 Claim 清單</returns>
        private static List<Claim> CreateJwtClaims(ClaimsIdentity identity)
        {
            var claims = identity.Claims.ToList();
            // 取得 NameIdentifier Claim 作為 JWT Subject（sub）的值
            var nameIdClaim = claims.First(c => c.Type == ClaimTypes.NameIdentifier);

            // Specifically add the jti (random nonce), iat (issued timestamp), and sub (subject/user) claims.
            // 加入 JWT 標準聲明：sub（使用者識別）、jti（唯一隨機碼防重放攻擊）、iat（發行時間戳）
            claims.AddRange(new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, nameIdClaim.Value),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.Now.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
            });

            return claims;
        }

        /// <summary>
        /// 使用 ABP 內建的簡單字串加密器，將 Access Token 進行加密。
        /// 加密後的 Token 可用於特定安全傳輸場景。
        /// </summary>
        /// <param name="accessToken">原始 JWT Access Token 字串</param>
        /// <returns>加密後的 Token 字串</returns>
        private string GetEncryptedAccessToken(string accessToken)
        {
            return SimpleStringCipher.Instance.Encrypt(accessToken);
        }
    }
}
