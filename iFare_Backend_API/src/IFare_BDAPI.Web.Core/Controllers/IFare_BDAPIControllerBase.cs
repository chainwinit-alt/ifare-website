using Abp.AspNetCore.Mvc.Controllers;
using Abp.IdentityFramework;
using Microsoft.AspNetCore.Identity;

namespace IFare_BDAPI.Controllers
{
    public abstract class IFare_BDAPIControllerBase: AbpController
    {
        protected IFare_BDAPIControllerBase()
        {
            LocalizationSourceName = IFare_BDAPIConsts.LocalizationSourceName;
        }

        protected void CheckErrors(IdentityResult identityResult)
        {
            identityResult.CheckErrors(LocalizationManager);
        }
    }
}
