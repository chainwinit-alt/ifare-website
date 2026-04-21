using Abp.AutoMapper;
using IFare_BDAPI.Authentication.External;

namespace IFare_BDAPI.Models.TokenAuth
{
    [AutoMapFrom(typeof(ExternalLoginProviderInfo))]
    public class ExternalLoginProviderInfoModel
    {
        public string Name { get; set; }

        public string ClientId { get; set; }
    }
}
