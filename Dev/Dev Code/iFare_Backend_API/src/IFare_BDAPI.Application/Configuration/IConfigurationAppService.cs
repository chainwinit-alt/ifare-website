using System.Threading.Tasks;
using IFare_BDAPI.Configuration.Dto;

namespace IFare_BDAPI.Configuration
{
    public interface IConfigurationAppService
    {
        Task ChangeUiTheme(ChangeUiThemeInput input);
    }
}
