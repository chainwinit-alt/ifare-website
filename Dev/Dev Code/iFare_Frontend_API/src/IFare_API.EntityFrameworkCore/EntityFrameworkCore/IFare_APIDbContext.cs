using Microsoft.EntityFrameworkCore;
using Abp.Zero.EntityFrameworkCore;
using IFare_API.Authorization.Roles;
using IFare_API.Authorization.Users;
using IFare_API.MultiTenancy;

namespace IFare_API.EntityFrameworkCore
{
    public class IFare_APIDbContext : AbpZeroDbContext<Tenant, Role, User, IFare_APIDbContext>
    {
        /* Define a DbSet for each entity of the application */
        
        public IFare_APIDbContext(DbContextOptions<IFare_APIDbContext> options)
            : base(options)
        {
        }
    }
}
