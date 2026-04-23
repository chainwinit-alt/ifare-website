using System;
using Abp.Configuration.Startup;
using Abp.Domain.Uow;
using IFare_BDAPI.Configuration;
using IFare_BDAPI.Context;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;

namespace IFare_BDAPI.EntityFrameworkCore
{
    /// <summary>
    /// 自訂連線字串解析器。
    ///
    /// ABP 預設只會根據 `Default` 連線字串來建立 DbContext，
    /// 但本專案同時存在平台資料庫與業務資料庫，因此必須在這裡攔截：
    /// - 若要求建立的是 `IFareContext`，改接到 `IFare` / `Local_IFare`
    /// - 其餘 DbContext 繼續沿用 ABP 預設的 `Default`
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
            // 只有業務 DbContext `IFareContext` 需要改接到 IFare 資料庫。
            if (args["DbContextConcreteType"] as Type == typeof(IFareContext))
            {                
                // 開發環境使用 Local_IFare；正式環境使用 IFare。
                // 因此同一份程式碼在不同環境會自動連到不同 SQL Server 資料庫。
                return _env.EnvironmentName != "Development" ? _appConfiguration.GetConnectionString("IFare") : _appConfiguration.GetConnectionString("Local_IFare");
            }
            // 其他 DbContext 仍交回 ABP 預設機制處理，通常就是走 Default。
            return base.GetNameOrConnectionString(args);
        }
    }
}
