using Abp.AutoMapper;
using Abp.Modules;
using Abp.Reflection.Extensions;
using IFare_BDAPI.Authorization;

namespace IFare_BDAPI
{
    [DependsOn(
        typeof(IFare_BDAPICoreModule), 
        typeof(AbpAutoMapperModule))]
    public class IFare_BDAPIApplicationModule : AbpModule
    {
        public override void PreInitialize()
        {
            Configuration.Authorization.Providers.Add<IFare_BDAPIAuthorizationProvider>();
        }

        public override void Initialize()
        {
            var thisAssembly = typeof(IFare_BDAPIApplicationModule).GetAssembly();

            IocManager.RegisterAssemblyByConvention(thisAssembly);

            Configuration.Modules.AbpAutoMapper().Configurators.Add(
                // Scan the assembly for classes which inherit from AutoMapper.Profile
                cfg => cfg.AddMaps(thisAssembly)
            );
        }
    }
}
