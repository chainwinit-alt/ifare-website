using System.Threading.Tasks;
using Abp.Authorization;
using Abp.Runtime.Session;
using IFare_API.Configuration.Dto;
using Microsoft.AspNetCore.Mvc;

namespace IFare_API.Configuration
{
    [ApiExplorerSettings(IgnoreApi = true)]
    [AbpAuthorize]
    public class ConfigurationAppService : IFare_APIAppServiceBase, IConfigurationAppService
    {
        public async Task ChangeUiTheme(ChangeUiThemeInput input)
        {
            await SettingManager.ChangeSettingForUserAsync(AbpSession.ToUserIdentifier(), AppSettingNames.UiTheme, input.Theme);
        }
    }
}
