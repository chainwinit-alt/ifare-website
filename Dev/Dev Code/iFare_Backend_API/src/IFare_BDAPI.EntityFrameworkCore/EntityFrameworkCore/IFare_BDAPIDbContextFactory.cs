using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using IFare_BDAPI.Configuration;
using IFare_BDAPI.Web;

namespace IFare_BDAPI.EntityFrameworkCore
{
    /* This class is needed to run "dotnet ef ..." commands from command line on development. Not used anywhere else */
    public class IFare_BDAPIDbContextFactory : IDesignTimeDbContextFactory<IFare_BDAPIDbContext>
    {
        public IFare_BDAPIDbContext CreateDbContext(string[] args)
        {
            var builder = new DbContextOptionsBuilder<IFare_BDAPIDbContext>();
            
            /*
             You can provide an environmentName parameter to the AppConfigurations.Get method. 
             In this case, AppConfigurations will try to read appsettings.{environmentName}.json.
             Use Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") method or from string[] args to get environment if necessary.
             https://docs.microsoft.com/en-us/ef/core/cli/dbcontext-creation?tabs=dotnet-core-cli#args
             */
            var configuration = AppConfigurations.Get(WebContentDirectoryFinder.CalculateContentRootFolder());

            IFare_BDAPIDbContextConfigurer.Configure(builder, configuration.GetConnectionString(IFare_BDAPIConsts.ConnectionStringName));

            return new IFare_BDAPIDbContext(builder.Options);
        }
    }
}
