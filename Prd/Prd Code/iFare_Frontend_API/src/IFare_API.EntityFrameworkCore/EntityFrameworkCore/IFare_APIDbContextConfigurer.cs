using System.Data.Common;
using Microsoft.EntityFrameworkCore;

namespace IFare_API.EntityFrameworkCore
{
    public static class IFare_APIDbContextConfigurer
    {
        public static void Configure(DbContextOptionsBuilder<IFare_APIDbContext> builder, string connectionString)
        {
            builder.UseSqlServer(connectionString);
        }

        public static void Configure(DbContextOptionsBuilder<IFare_APIDbContext> builder, DbConnection connection)
        {
            builder.UseSqlServer(connection);
        }
    }
}
