using Abp.AspNetCore;
using Abp.AspNetCore.TestBase;
using Abp.Modules;
using Abp.Reflection.Extensions;
using IFare_API.EntityFrameworkCore;
using IFare_API.Web.Startup;
using Microsoft.AspNetCore.Mvc.ApplicationParts;

namespace IFare_API.Web.Tests
{
    [DependsOn(
        typeof(IFare_APIWebMvcModule),
        typeof(AbpAspNetCoreTestBaseModule)
    )]
    public class IFare_APIWebTestModule : AbpModule
    {
        public IFare_APIWebTestModule(IFare_APIEntityFrameworkModule abpProjectNameEntityFrameworkModule)
        {
            abpProjectNameEntityFrameworkModule.SkipDbContextRegistration = true;
        } 
        
        public override void PreInitialize()
        {
            Configuration.UnitOfWork.IsTransactional = false; //EF Core InMemory DB does not support transactions.
        }

        public override void Initialize()
        {
            IocManager.RegisterAssemblyByConvention(typeof(IFare_APIWebTestModule).GetAssembly());
        }
        
        public override void PostInitialize()
        {
            IocManager.Resolve<ApplicationPartManager>()
                .AddApplicationPartsIfNotAddedBefore(typeof(IFare_APIWebMvcModule).Assembly);
        }
    }
}