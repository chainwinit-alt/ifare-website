using System;
using Abp.Configuration.Startup;
using Abp.Domain.Uow;
using IFare_API.Configuration;
using IFare_API.Context;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace IFare_API.EntityFrameworkCore 
{
    public class MyConnectionStringResolver : DefaultConnectionStringResolver
    {
        private readonly IConfiguration _appConfiguration;
        private readonly IHostingEnvironment _env;
        public MyConnectionStringResolver(IAbpStartupConfiguration configuration, IHostingEnvironment hostingEnvironment) : base(configuration)
        {
            _appConfiguration = AppConfigurations.Get(hostingEnvironment.ContentRootPath, hostingEnvironment.EnvironmentName);
            _env = hostingEnvironment;
        }

        public override string GetNameOrConnectionString(ConnectionStringResolveArgs args)
        {
            if (args["DbContextConcreteType"] as Type == typeof(IFareContext))
            {                
                return _env.EnvironmentName != "Development" ? _appConfiguration.GetConnectionString("IFare") : _appConfiguration.GetConnectionString("Local_IFare");
            }
            return base.GetNameOrConnectionString(args);
        }
    }
}