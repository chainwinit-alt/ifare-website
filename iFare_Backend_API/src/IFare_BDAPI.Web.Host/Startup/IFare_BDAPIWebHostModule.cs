using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Abp.Modules;
using Abp.Reflection.Extensions;
using IFare_BDAPI.Configuration;

namespace IFare_BDAPI.Web.Host.Startup
{
    [DependsOn(
       typeof(IFare_BDAPIWebCoreModule))]
    public class IFare_BDAPIWebHostModule: AbpModule
    {
        private readonly IWebHostEnvironment _env;
        private readonly IConfigurationRoot _appConfiguration;

        public IFare_BDAPIWebHostModule(IWebHostEnvironment env)
        {
            _env = env;
            _appConfiguration = env.GetAppConfiguration();
        }

        public override void Initialize()
        {
            IocManager.RegisterAssemblyByConvention(typeof(IFare_BDAPIWebHostModule).GetAssembly());
        }
    }
}
