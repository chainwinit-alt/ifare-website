using Abp.Application.Services.Dto;
using Abp.AutoMapper;
using IFare_API.MultiTenancy;

namespace IFare_API.Sessions.Dto
{
    [AutoMapFrom(typeof(Tenant))]
    public class TenantLoginInfoDto : EntityDto
    {
        public string TenancyName { get; set; }

        public string Name { get; set; }
    }
}
