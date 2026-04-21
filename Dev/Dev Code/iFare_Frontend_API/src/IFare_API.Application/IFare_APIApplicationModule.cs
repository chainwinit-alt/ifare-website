using Abp.AutoMapper;
using Abp.Modules;
using Abp.Reflection.Extensions;
using IFare_API.Authorization;

namespace IFare_API
{
    [DependsOn(
        typeof(IFare_APICoreModule), 
        typeof(AbpAutoMapperModule))]
    public class IFare_APIApplicationModule : AbpModule
    {
        public override void PreInitialize()
        {
            Configuration.Authorization.Providers.Add<IFare_APIAuthorizationProvider>();
        }

        public override void Initialize()
        {
            var thisAssembly = typeof(IFare_APIApplicationModule).GetAssembly();

            IocManager.RegisterAssemblyByConvention(thisAssembly);

            Configuration.Modules.AbpAutoMapper().Configurators.Add(
                // Scan the assembly for classes which inherit from AutoMapper.Profile
                cfg => cfg.AddMaps(thisAssembly)
            );
        }
    }
}
