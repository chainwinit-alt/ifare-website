using Abp.AspNetCore.Mvc.Controllers;
using Abp.IdentityFramework;
using Microsoft.AspNetCore.Identity;

namespace IFare_API.Controllers
{
    public abstract class IFare_APIControllerBase: AbpController
    {
        protected IFare_APIControllerBase()
        {
            LocalizationSourceName = IFare_APIConsts.LocalizationSourceName;
        }

        protected void CheckErrors(IdentityResult identityResult)
        {
            identityResult.CheckErrors(LocalizationManager);
        }
    }
}
