using System.Data.Common;
using Microsoft.EntityFrameworkCore;

namespace IFare_BDAPI.EntityFrameworkCore
{
    public static class IFare_BDAPIDbContextConfigurer
    {
        public static void Configure(DbContextOptionsBuilder<IFare_BDAPIDbContext> builder, string connectionString)
        {
            builder.UseSqlServer(connectionString);
        }

        public static void Configure(DbContextOptionsBuilder<IFare_BDAPIDbContext> builder, DbConnection connection)
        {
            builder.UseSqlServer(connection);
        }
    }
}
