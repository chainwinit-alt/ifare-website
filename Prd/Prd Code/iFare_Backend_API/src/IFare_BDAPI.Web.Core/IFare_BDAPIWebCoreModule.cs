using System;
using System.Text;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Abp.AspNetCore;
using Abp.AspNetCore.Configuration;
using Abp.AspNetCore.SignalR;
using Abp.Modules;
using Abp.Reflection.Extensions;
using Abp.Zero.Configuration;
using IFare_BDAPI.Authentication.JwtBearer;
using IFare_BDAPI.Configuration;
using IFare_BDAPI.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc.ApplicationParts;

namespace IFare_BDAPI
{
    /// <summary>
    /// 後台 API 的 Web Core 模組。
    ///
    /// 這個模組是「API 對外可被呼叫」的重要樞紐，主要負責：
    /// 1. 指定 ABP 預設使用哪一組連線字串。
    /// 2. 啟用以資料庫為基礎的語系管理。
    /// 3. 自動把 Application 層的 AppService 轉成 HTTP API Controller。
    /// 4. 設定 JWT Token 的簽章與有效期限。
    /// </summary>
    [DependsOn(
         typeof(IFare_BDAPIApplicationModule),
         typeof(IFare_BDAPIEntityFrameworkModule),
         typeof(AbpAspNetCoreModule)
        ,typeof(AbpAspNetCoreSignalRModule)
    )]
    public class IFare_BDAPIWebCoreModule : AbpModule
    {
        // 目前執行環境，例如 Development / Production
        private readonly IWebHostEnvironment _env;
        // 站台組態來源，包含連線字串、JWT 設定等
        private readonly IConfigurationRoot _appConfiguration;

        public IFare_BDAPIWebCoreModule(IWebHostEnvironment env)
        {
            _env = env;
            _appConfiguration = env.GetAppConfiguration();
        }

        public override void PreInitialize()
        {
            // 先設定 ABP 的預設連線字串名稱。
            // 這裡設定的是 "Default"，主要供 ABP 自己的 DbContext 使用；
            // 業務 DbContext `IFareContext` 之後會由自訂 ConnectionStringResolver 改接到 `IFare`。
            Configuration.DefaultNameOrConnectionString = _appConfiguration.GetConnectionString(
                IFare_BDAPIConsts.ConnectionStringName
            );

            // Use database for language management
            Configuration.Modules.Zero().LanguageManagement.EnableDbLocalization();

            // 自動把 Application 專案中的 AppService 類別轉成可呼叫的 HTTP API。
            // 因此像 `NewsAppService.GetDataList()` 會被暴露成
            // `/api/services/app/News/GetDataList` 這種 ABP 標準路由。
            Configuration.Modules.AbpAspNetCore()
                 .CreateControllersForAppServices(
                     typeof(IFare_BDAPIApplicationModule).GetAssembly()
                 );

            // 建立 JWT 驗證所需的 Token 設定，供 TokenAuthController 與 AuthConfigurer 使用
            ConfigureTokenAuth();
        }

        /// <summary>
        /// 將 appsettings 中的 JWT 設定轉成可注入的 TokenAuthConfiguration。
        /// 後續登入成功時產生 Token，與 API 驗證 Token 時都會依賴這些設定。
        /// </summary>
        private void ConfigureTokenAuth()
        {
            IocManager.Register<TokenAuthConfiguration>();
            var tokenAuthConfig = IocManager.Resolve<TokenAuthConfiguration>();

            // 以組態檔中的 SecurityKey 建立 HMAC SHA256 簽章資訊
            tokenAuthConfig.SecurityKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(_appConfiguration["Authentication:JwtBearer:SecurityKey"]));
            tokenAuthConfig.Issuer = _appConfiguration["Authentication:JwtBearer:Issuer"];
            tokenAuthConfig.Audience = _appConfiguration["Authentication:JwtBearer:Audience"];
            tokenAuthConfig.SigningCredentials = new SigningCredentials(tokenAuthConfig.SecurityKey, SecurityAlgorithms.HmacSha256);
            // 目前後台登入 Token 的有效時間為 1 天
            tokenAuthConfig.Expiration = TimeSpan.FromDays(1);
        }

        public override void Initialize()
        {
            IocManager.RegisterAssemblyByConvention(typeof(IFare_BDAPIWebCoreModule).GetAssembly());
        }

        public override void PostInitialize()
        {
            // 確保由 AppService 產生的 Controller Parts 已經加入 ASP.NET Core 應用程式。
            // 少了這一步，Swagger / Routing 可能找不到動態產生的 API。
            IocManager.Resolve<ApplicationPartManager>()
                .AddApplicationPartsIfNotAddedBefore(typeof(IFare_BDAPIWebCoreModule).Assembly);
        }
    }
}
