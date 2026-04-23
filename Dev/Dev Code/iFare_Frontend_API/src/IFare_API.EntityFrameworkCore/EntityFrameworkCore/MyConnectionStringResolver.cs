using System;
using Abp.Configuration.Startup;
using Abp.Domain.Uow;
using IFare_API.Configuration;
using IFare_API.Context;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace IFare_API.EntityFrameworkCore 
{
    /// <summary>
    /// 前台 API 的自訂連線字串解析器。
    ///
    /// 目的是把 `IFareContext` 從 ABP 預設的 `Default` 連線字串切出去，
    /// 改接到真正存放基金會內容資料的 `IFare` / `Local_IFare`。
    /// </summary>
    public class MyConnectionStringResolver : DefaultConnectionStringResolver
    {
        private readonly IConfiguration _appConfiguration;
        private readonly IHostingEnvironment _env;
        public MyConnectionStringResolver(IAbpStartupConfiguration configuration, IHostingEnvironment hostingEnvironment) : base(configuration)
        {
            _appConfiguration = AppConfigurations.Get(hostingEnvironment.ContentRootPath, hostingEnvironment.EnvironmentName);
            _env = hostingEnvironment;
        }

        public override string GetNameOrConnectionString(ConnectionStringResolveArgs args)
        {
            // 業務資料模型只要使用 `IFareContext`，就改走 IFare 資料庫。
            if (args["DbContextConcreteType"] as Type == typeof(IFareContext))
            {                
                // 開發環境接 Local_IFare；其他環境接 IFare。
                return _env.EnvironmentName != "Development" ? _appConfiguration.GetConnectionString("IFare") : _appConfiguration.GetConnectionString("Local_IFare");
            }
            // 其餘情況維持 ABP 預設邏輯
            return base.GetNameOrConnectionString(args);
        }
    }
}
