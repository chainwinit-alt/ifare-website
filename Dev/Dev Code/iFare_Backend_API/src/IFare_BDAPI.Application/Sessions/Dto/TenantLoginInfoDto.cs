using Abp.Application.Services.Dto;
using Abp.AutoMapper;
using IFare_BDAPI.MultiTenancy;

namespace IFare_BDAPI.Sessions.Dto
{
    [AutoMapFrom(typeof(Tenant))]
    public class TenantLoginInfoDto : EntityDto
    {
        public string TenancyName { get; set; }

        public string Name { get; set; }
    }
}
