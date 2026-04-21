using Abp.Application.Services;
using IFare_API.MultiTenancy.Dto;

namespace IFare_API.MultiTenancy
{
    public interface ITenantAppService : IAsyncCrudAppService<TenantDto, int, PagedTenantResultRequestDto, CreateTenantDto, TenantDto>
    {
    }
}

