using Abp.Configuration.Startup;
using Abp.Domain.Uow;
using Abp.EntityFrameworkCore.Configuration;
using Abp.Modules;
using Abp.Reflection.Extensions;
using Abp.Zero.EntityFrameworkCore;
using IFare_BDAPI.Context;
using IFare_BDAPI.EntityFrameworkCore.Seed;

namespace IFare_BDAPI.EntityFrameworkCore
{
    /// <summary>
    /// 後台 API 的 Entity Framework Core 模組。
    ///
    /// 這個模組把 EF Core 與 ABP 串接起來，並同時註冊兩個 DbContext：
    /// 1. `IFare_BDAPIDbContext`：ABP 平台自己的系統資料庫（User / Role / Tenant 等）
    /// 2. `IFareContext`：基金會業務資料庫（News / IFarePolicy / SysUser 等）
    ///
    /// 也就是說，後台 API 雖然是一個站台，但資料來源其實分成平台資料與業務資料兩塊。
    /// </summary>
    [DependsOn(
        typeof(IFare_BDAPICoreModule), 
        typeof(AbpZeroCoreEntityFrameworkCoreModule))]
    public class IFare_BDAPIEntityFrameworkModule : AbpModule
    {
        /* Used it tests to skip dbcontext registration, in order to use in-memory database of EF Core */
        public bool SkipDbContextRegistration { get; set; }

        public bool SkipDbSeed { get; set; }

        public override void PreInitialize()
        {
            if (!SkipDbContextRegistration)
            {
                // 以自訂的 Resolver 取代預設連線字串解析流程。
                // 這樣才能在同一個 API 中，把不同 DbContext 分流到不同資料庫。
                Configuration.ReplaceService<IConnectionStringResolver, MyConnectionStringResolver>();

                // 註冊 ABP 自己的系統資料庫 DbContext。
                // 這個 DbContext 會維持使用 appsettings 中的 Default 連線字串。
                Configuration.Modules.AbpEfCore().AddDbContext<IFare_BDAPIDbContext>(options =>
                {
                    if (options.ExistingConnection != null)
                    {
                        IFare_BDAPIDbContextConfigurer.Configure(options.DbContextOptions, options.ExistingConnection);
                    }
                    else
                    {
                        IFare_BDAPIDbContextConfigurer.Configure(options.DbContextOptions, options.ConnectionString);
                    }
                });

                // 註冊基金會業務資料庫 DbContext。
                // 雖然這裡表面上也吃 options.ConnectionString，
                // 但實際上會被 MyConnectionStringResolver 改寫成 `IFare` / `Local_IFare`。
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
            IocManager.RegisterAssemblyByConvention(typeof(IFare_BDAPIEntityFrameworkModule).GetAssembly());
        }

        public override void PostInitialize()
        {
            if (!SkipDbSeed)
            {
                // 執行 Host DB 的種子資料初始化，主要是 ABP 平台層資料。
                SeedHelper.SeedHostDb(IocManager);
            }
        }
    }
}
