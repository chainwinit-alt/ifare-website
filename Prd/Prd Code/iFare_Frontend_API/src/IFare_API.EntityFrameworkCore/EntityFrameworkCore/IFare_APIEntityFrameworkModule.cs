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
                Configuration.ReplaceService<IConnectionStringResolver, MyConnectionStringResolver>();

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
                SeedHelper.SeedHostDb(IocManager);
            }
        }
    }
}
