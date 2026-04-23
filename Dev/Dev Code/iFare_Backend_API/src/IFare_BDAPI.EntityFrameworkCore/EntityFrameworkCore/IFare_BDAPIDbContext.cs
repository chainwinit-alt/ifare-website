using Microsoft.EntityFrameworkCore;
using Abp.Zero.EntityFrameworkCore;
using IFare_BDAPI.Authorization.Roles;
using IFare_BDAPI.Authorization.Users;
using IFare_BDAPI.MultiTenancy;

namespace IFare_BDAPI.EntityFrameworkCore
{
    public class IFare_BDAPIDbContext : AbpZeroDbContext<Tenant, Role, User, IFare_BDAPIDbContext>
    {
        /* Define a DbSet for each entity of the application */
        
        public IFare_BDAPIDbContext(DbContextOptions<IFare_BDAPIDbContext> options)
            : base(options)
        {
        }
    }
}
