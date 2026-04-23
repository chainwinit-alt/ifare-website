using System.Threading.Tasks;
using IFare_API.Configuration.Dto;

namespace IFare_API.Configuration
{
    public interface IConfigurationAppService
    {
        Task ChangeUiTheme(ChangeUiThemeInput input);
    }
}
