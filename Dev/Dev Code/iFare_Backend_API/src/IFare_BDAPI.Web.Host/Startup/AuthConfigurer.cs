using System;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Abp.Runtime.Security;

namespace IFare_BDAPI.Web.Host.Startup
{
    /// <summary>
    /// 後台 API 的 JWT 驗證設定器。
    ///
    /// 這個類別的責任是把 appsettings.json 中的 JWT 設定真正掛進 ASP.NET Core：
    /// - 設定預設驗證方案為 JwtBearer
    /// - 驗證簽章、Issuer、Audience、過期時間
    /// - 建立可重複使用的 `JwtAuth` 授權政策
    ///
    /// 後台多數 AppService 上標註的 `[Authorize(Policy = "JwtAuth")]`
    /// 最終就是依賴這裡的設定生效。
    /// </summary>
    public static class AuthConfigurer
    {
        public static void Configure(IServiceCollection services, IConfiguration configuration)
        {
            // 只有在設定檔明確啟用 JwtBearer 時，才會註冊整套驗證機制。
            if (bool.Parse(configuration["Authentication:JwtBearer:IsEnabled"]))
            {
                services.AddAuthentication(options => {
                    // 指定系統預設以 JwtBearer 方式辨識與挑戰未授權請求
                    options.DefaultAuthenticateScheme = "JwtBearer";
                    options.DefaultChallengeScheme = "JwtBearer";
                }).AddJwtBearer("JwtBearer", options =>
                {
                    // Audience 代表此 Token 是發給哪一個 API 使用
                    options.Audience = configuration["Authentication:JwtBearer:Audience"];

                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        // The signing key must match!
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(configuration["Authentication:JwtBearer:SecurityKey"])),

                        // Validate the JWT Issuer (iss) claim
                        ValidateIssuer = true,
                        ValidIssuer = configuration["Authentication:JwtBearer:Issuer"],

                        // Validate the JWT Audience (aud) claim
                        ValidateAudience = true,
                        ValidAudience = configuration["Authentication:JwtBearer:Audience"],

                        // Validate the token expiry
                        ValidateLifetime = true,

                        // If you want to allow a certain amount of clock drift, set that here
                        ClockSkew = TimeSpan.Zero
                    };

                    options.Events = new JwtBearerEvents
                    {
                        // SignalR 無法像一般 Ajax 一樣穩定地帶 Authorization Header，
                        // 因此這裡額外支援從 query string 取出加密過的 token。
                        OnMessageReceived = QueryStringTokenResolver
                    };
                });

                services.AddAuthorization(options => 
                {
                    // 專案內部統一用 `JwtAuth` 這個 policy 名稱來標記需要登入的 API。
                    options.AddPolicy("JwtAuth", policy => 
                    {
                        policy.AuthenticationSchemes.Add("JwtBearer");
                        policy.RequireAuthenticatedUser();
                    });
                });
            }
        }

        /* This method is needed to authorize SignalR javascript client.
         * SignalR can not send authorization header. So, we are getting it from query string as an encrypted text. */
        private static Task QueryStringTokenResolver(MessageReceivedContext context)
        {
            // 只有 SignalR 的請求才需要走 query string token 解析。
            if (!context.HttpContext.Request.Path.HasValue ||
                !context.HttpContext.Request.Path.Value.StartsWith("/signalr"))
            {
                // We are just looking for signalr clients
                return Task.CompletedTask;
            }

            var qsAuthToken = context.HttpContext.Request.Query["enc_auth_token"].FirstOrDefault();
            if (qsAuthToken == null)
            {
                // Cookie value does not matches to querystring value
                return Task.CompletedTask;
            }

            // 將 query string 中的加密 token 解密後交給 JwtBearer 驗證流程
            context.Token = SimpleStringCipher.Instance.Decrypt(qsAuthToken);
            return Task.CompletedTask;
        }
    }
}
