using System.Threading.Tasks;
using Abp.Authorization;
using Abp.Runtime.Session;
using IFare_BDAPI.Configuration.Dto;
using Microsoft.AspNetCore.Mvc;

namespace IFare_BDAPI.Configuration
{
    [ApiExplorerSettings(IgnoreApi = true)]
    [AbpAuthorize]
    public class ConfigurationAppService : IFare_BDAPIAppServiceBase, IConfigurationAppService
    {
        public async Task ChangeUiTheme(ChangeUiThemeInput input)
        {
            await SettingManager.ChangeSettingForUserAsync(AbpSession.ToUserIdentifier(), AppSettingNames.UiTheme, input.Theme);
        }
    }
}
