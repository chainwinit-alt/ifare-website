using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;

namespace IFare_API.Web.Host.Startup
{
    public static class RolloutConfigurer
    {
        public static void Configure(IConfiguration appConfiguration, IWebHostEnvironment env)
        {
            var isDev = env.EnvironmentName == "Development";
            var version = appConfiguration["RolloutSetting:TargetVersion"];
            var docTitle = appConfiguration["RolloutSetting:Swagger:DocTitle"];

            if (string.IsNullOrWhiteSpace(version))
            {
                version = isDev ? "Local" : "Release";
                appConfiguration["RolloutSetting:TargetVersion"] = version;
            }

            if (string.IsNullOrWhiteSpace(docTitle))
            {
                docTitle = "iFare API";
                appConfiguration["RolloutSetting:Swagger:DocTitle"] = docTitle;
            }

            if (!isDev)
            {
                if (string.Equals(version, "local", System.StringComparison.OrdinalIgnoreCase))
                {
                    appConfiguration["RolloutSetting:TargetVersion"] = "Release";
                }
            }
            else
            {
                if (!string.Equals(version, "local", System.StringComparison.OrdinalIgnoreCase))
                {
                    appConfiguration["RolloutSetting:TargetVersion"] = "Local";
                }

                appConfiguration["ConnectionStrings:Default"] = appConfiguration["ConnectionStrings:Local_Default"];
                appConfiguration["ConnectionStrings:IFare"] = appConfiguration["ConnectionStrings:Local_IFare"];
            }

            version = appConfiguration["RolloutSetting:TargetVersion"];
            SetVersionComponent(appConfiguration, version, docTitle);
        }

        private static void SetVersionComponent(IConfiguration appConfiguration, string version, string docTitle)
        {
            var normalizedVersion = string.IsNullOrWhiteSpace(version) ? "release" : version.ToLowerInvariant();
            var normalizedTitle = string.IsNullOrWhiteSpace(docTitle) ? "ifare api" : docTitle.ToLowerInvariant();

            if (normalizedTitle.IndexOf(normalizedVersion) < 0)
            {
                appConfiguration["RolloutSetting:Swagger:DocTitle"] =
                    $"{char.ToUpperInvariant(normalizedVersion[0])}{normalizedVersion.Substring(1)} iFare API";
            }
        }
    }
}
