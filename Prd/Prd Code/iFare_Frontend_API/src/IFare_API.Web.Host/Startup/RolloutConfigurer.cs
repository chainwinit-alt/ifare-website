using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;

namespace IFare_API.Web.Host.Startup 
{
    public static class RolloutConfigurer
    {
        public static void Configure(IConfiguration _appConfiguration, IWebHostEnvironment _env)
        {
            var isDev = _env.EnvironmentName == "Development";
            var version = _appConfiguration["RolloutSetting:TargetVersion"];
            var docTitle = _appConfiguration["RolloutSetting:Swagger:DocTitle"];
            

            if (!isDev)
            {
                if (version.ToLowerInvariant() == "local")
                {
                    _appConfiguration["RolloutSetting:TargetVersion"] = "Release";
                }
            }
            else 
            {
                if (version.ToLowerInvariant() != "local")
                {
                    _appConfiguration["RolloutSetting:TargetVersion"] = "Local";
                }

                _appConfiguration["ConnectionStrings:Default"] = _appConfiguration["ConnectionStrings:Local_Default"];
                _appConfiguration["ConnectionStrings:IFare"] = _appConfiguration["ConnectionStrings:Local_IFare"];
            }
            version = _appConfiguration["RolloutSetting:TargetVersion"];
            SetVersionComponment(_appConfiguration, version, docTitle);
        }

        private static void SetVersionComponment(IConfiguration _appConfiguration, string ver, string docTitle)
        {
            var _ver = ver.ToLowerInvariant();
            var _docTitle = docTitle.ToLowerInvariant();

            if (_docTitle.IndexOf(_ver) < 0)
            {
                _appConfiguration["RolloutSetting:Swagger:DocTitle"] = $"【{ver}】IFare API";
            }
        }
    }
}