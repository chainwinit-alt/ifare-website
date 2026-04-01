using Abp.MultiTenancy;
using IFare_BDAPI.Authorization.Users;

namespace IFare_BDAPI.MultiTenancy
{
    public class Tenant : AbpTenant<User>
    {
        public Tenant()
        {            
        }

        public Tenant(string tenancyName, string name)
            : base(tenancyName, name)
        {
        }
    }
}
