using System.Data.Common;
using Microsoft.EntityFrameworkCore;

namespace IFare_API.Context
{
    public static class IFareContextConfigurer
    {
        public static void Configure(DbContextOptionsBuilder<IFareContext> builder, string connectionString)
        {
            builder.UseSqlServer(connectionString);
        }

        public static void Configure(DbContextOptionsBuilder<IFareContext> builder, DbConnection connection)
        {
            builder.UseSqlServer(connection);
        }
    }
}