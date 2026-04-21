using Abp.Application.Features;
using Abp.Domain.Repositories;
using Abp.MultiTenancy;
using IFare_BDAPI.Authorization.Users;
using IFare_BDAPI.Editions;

namespace IFare_BDAPI.MultiTenancy
{
    public class TenantManager : AbpTenantManager<Tenant, User>
    {
        public TenantManager(
            IRepository<Tenant> tenantRepository, 
            IRepository<TenantFeatureSetting, long> tenantFeatureRepository, 
            EditionManager editionManager,
            IAbpZeroFeatureValueStore featureValueStore) 
            : base(
                tenantRepository, 
                tenantFeatureRepository, 
                editionManager,
                featureValueStore)
        {
        }
    }
}
