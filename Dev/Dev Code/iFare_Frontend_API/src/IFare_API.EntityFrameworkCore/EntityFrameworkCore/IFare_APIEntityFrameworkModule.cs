using Abp.Configuration.Startup;
using Abp.Domain.Uow;
using Abp.EntityFrameworkCore.Configuration;
using Abp.Modules;
using Abp.Reflection.Extensions;
using Abp.Zero.EntityFrameworkCore;
using IFare_API.Context;
using IFare_API.EntityFrameworkCore.Seed;
using Microsoft.Extensions.Options;

namespace IFare_API.EntityFrameworkCore
{
    /// <summary>
    /// 前台 API 的 Entity Framework Core 模組。
    ///
    /// 與後台 API 類似，這裡也同時註冊兩個 DbContext：
    /// 1. `IFare_APIDbContext`：ABP 平台層資料庫
    /// 2. `IFareContext`：前後台共用的基金會業務資料庫
    ///
    /// 因此前台 API 雖然主要是讀取公開資料，但底層仍透過同一套 EF Core / Repository 機制存取 SQL Server。
    /// </summary>
    [DependsOn(
        typeof(IFare_APICoreModule), 
        typeof(AbpZeroCoreEntityFrameworkCoreModule))]
    public class IFare_APIEntityFrameworkModule : AbpModule
    {
        /* Used it tests to skip dbcontext registration, in order to use in-memory database of EF Core */
        public bool SkipDbContextRegistration { get; set; }

        public bool SkipDbSeed { get; set; }

        public override void PreInitialize()
        {
            if (!SkipDbContextRegistration)
            {
                // 用自訂 Resolver 來決定不同 DbContext 應該接哪一個資料庫。
                Configuration.ReplaceService<IConnectionStringResolver, MyConnectionStringResolver>();

                // ABP 平台層自己的 DbContext，走 Default 連線字串。
                Configuration.Modules.AbpEfCore().AddDbContext<IFare_APIDbContext>(options =>
                {
                    if (options.ExistingConnection != null)
                    {
                        IFare_APIDbContextConfigurer.Configure(options.DbContextOptions, options.ExistingConnection);
                    }
                    else
                    {
                        IFare_APIDbContextConfigurer.Configure(options.DbContextOptions, options.ConnectionString);
                    }
                });

                // 基金會業務 DbContext，實際上會透過 Resolver 轉到 IFare / Local_IFare。
                Configuration.Modules.AbpEfCore().AddDbContext<IFareContext>(options => 
                {
                    if (options.ExistingConnection != null) 
                    {
                        IFareContextConfigurer.Configure(options.DbContextOptions, options.ExistingConnection);
                    }
                    else 
                    {
                        IFareContextConfigurer.Configure(options.DbContextOptions, options.ConnectionString);
                    }
                });
            }
        }

        public override void Initialize()
        {
            IocManager.RegisterAssemblyByConvention(typeof(IFare_APIEntityFrameworkModule).GetAssembly());
        }

        public override void PostInitialize()
        {
            if (!SkipDbSeed)
            {
                // 執行 Host DB 種子資料初始化
                SeedHelper.SeedHostDb(IocManager);
            }
        }
    }
}
