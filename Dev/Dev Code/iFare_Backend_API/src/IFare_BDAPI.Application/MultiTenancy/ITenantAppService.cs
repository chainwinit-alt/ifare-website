using Abp.Application.Services;
using IFare_BDAPI.MultiTenancy.Dto;

namespace IFare_BDAPI.MultiTenancy
{
    public interface ITenantAppService : IAsyncCrudAppService<TenantDto, int, PagedTenantResultRequestDto, CreateTenantDto, TenantDto>
    {
    }
}

