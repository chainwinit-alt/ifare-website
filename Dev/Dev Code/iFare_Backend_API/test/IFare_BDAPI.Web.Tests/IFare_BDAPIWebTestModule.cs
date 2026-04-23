using Abp.AspNetCore;
using Abp.AspNetCore.TestBase;
using Abp.Modules;
using Abp.Reflection.Extensions;
using IFare_BDAPI.EntityFrameworkCore;
using IFare_BDAPI.Web.Startup;
using Microsoft.AspNetCore.Mvc.ApplicationParts;

namespace IFare_BDAPI.Web.Tests
{
    [DependsOn(
        typeof(IFare_BDAPIWebMvcModule),
        typeof(AbpAspNetCoreTestBaseModule)
    )]
    public class IFare_BDAPIWebTestModule : AbpModule
    {
        public IFare_BDAPIWebTestModule(IFare_BDAPIEntityFrameworkModule abpProjectNameEntityFrameworkModule)
        {
            abpProjectNameEntityFrameworkModule.SkipDbContextRegistration = true;
        } 
        
        public override void PreInitialize()
        {
            Configuration.UnitOfWork.IsTransactional = false; //EF Core InMemory DB does not support transactions.
        }

        public override void Initialize()
        {
            IocManager.RegisterAssemblyByConvention(typeof(IFare_BDAPIWebTestModule).GetAssembly());
        }
        
        public override void PostInitialize()
        {
            IocManager.Resolve<ApplicationPartManager>()
                .AddApplicationPartsIfNotAddedBefore(typeof(IFare_BDAPIWebMvcModule).Assembly);
        }
    }
}