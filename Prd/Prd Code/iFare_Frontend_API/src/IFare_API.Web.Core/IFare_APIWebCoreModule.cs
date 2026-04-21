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
using IFare_API.Authentication.JwtBearer;
using IFare_API.Configuration;
using IFare_API.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc.ApplicationParts;

namespace IFare_API
{
    /// <summary>
    /// 前台 API 的 Web Core 模組。
    ///
    /// 這個模組負責把前台公開查詢 API 真正接到 ASP.NET Core：
    /// 1. 指定 ABP 預設的系統資料庫連線字串
    /// 2. 啟用 AppService 自動轉 Controller 的機制
    /// 3. 設定 JWT Token 參數（即使目前前台站台通常關閉 Jwt 驗證，也保留完整設定）
    /// </summary>
    [DependsOn(
         typeof(IFare_APIApplicationModule),
         typeof(IFare_APIEntityFrameworkModule),
         typeof(AbpAspNetCoreModule)
        ,typeof(AbpAspNetCoreSignalRModule)
    )]
    public class IFare_APIWebCoreModule : AbpModule
    {
        // 目前執行環境資訊
        private readonly IWebHostEnvironment _env;
        // 站台組態來源
        private readonly IConfigurationRoot _appConfiguration;

        public IFare_APIWebCoreModule(IWebHostEnvironment env)
        {
            _env = env;
            _appConfiguration = env.GetAppConfiguration();
        }

        public override void PreInitialize()
        {
            // ABP 預設系統資料庫仍先以 Default 連線字串為主，
            // 業務資料庫 `IFareContext` 會由自訂 resolver 再行分流。
            Configuration.DefaultNameOrConnectionString = _appConfiguration.GetConnectionString(
                IFare_APIConsts.ConnectionStringName
            );

            // Use database for language management
            Configuration.Modules.Zero().LanguageManagement.EnableDbLocalization();

            // 把前台 API Application 層的 AppService 自動轉成 HTTP API。
            // 因此像 `FarePolicyAppService.GetIFarePolicyList()` 會被暴露成
            // `/api/services/app/FarePolicy/GetIFarePolicyList`。
            Configuration.Modules.AbpAspNetCore()
                 .CreateControllersForAppServices(
                     typeof(IFare_APIApplicationModule).GetAssembly()
                 );

            // 建立 JWT 組態物件；即使站台目前常設為匿名讀取，也能保留統一能力
            ConfigureTokenAuth();
        }

        /// <summary>
        /// 將組態檔中的 JWT 設定轉為可供系統使用的 TokenAuthConfiguration。
        /// </summary>
        private void ConfigureTokenAuth()
        {
            IocManager.Register<TokenAuthConfiguration>();
            var tokenAuthConfig = IocManager.Resolve<TokenAuthConfiguration>();

            tokenAuthConfig.SecurityKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(_appConfiguration["Authentication:JwtBearer:SecurityKey"]));
            tokenAuthConfig.Issuer = _appConfiguration["Authentication:JwtBearer:Issuer"];
            tokenAuthConfig.Audience = _appConfiguration["Authentication:JwtBearer:Audience"];
            tokenAuthConfig.SigningCredentials = new SigningCredentials(tokenAuthConfig.SecurityKey, SecurityAlgorithms.HmacSha256);
            // 預設 token 有效期為 1 天
            tokenAuthConfig.Expiration = TimeSpan.FromDays(1);
        }

        public override void Initialize()
        {
            IocManager.RegisterAssemblyByConvention(typeof(IFare_APIWebCoreModule).GetAssembly());
        }

        public override void PostInitialize()
        {
            // 把動態產生的 API Controller Parts 掛進 ASP.NET Core 管線
            IocManager.Resolve<ApplicationPartManager>()
                .AddApplicationPartsIfNotAddedBefore(typeof(IFare_APIWebCoreModule).Assembly);
        }
    }
}
