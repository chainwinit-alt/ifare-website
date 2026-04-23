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
                Configuration.ReplaceService<IConnectionStringResolver, MyConnectionStringResolver>();

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
                SeedHelper.SeedHostDb(IocManager);
            }
        }
    }
}
