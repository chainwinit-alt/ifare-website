using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Abp.Modules;
using Abp.Reflection.Extensions;
using IFare_API.Configuration;

namespace IFare_API.Web.Host.Startup
{
    [DependsOn(
       typeof(IFare_APIWebCoreModule))]
    public class IFare_APIWebHostModule: AbpModule
    {
        private readonly IWebHostEnvironment _env;
        private readonly IConfigurationRoot _appConfiguration;

        public IFare_APIWebHostModule(IWebHostEnvironment env)
        {
            _env = env;
            _appConfiguration = env.GetAppConfiguration();
        }

        public override void Initialize()
        {
            IocManager.RegisterAssemblyByConvention(typeof(IFare_APIWebHostModule).GetAssembly());
        }
    }
}
