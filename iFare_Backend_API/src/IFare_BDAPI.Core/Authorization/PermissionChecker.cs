using Abp.Authorization;
using IFare_BDAPI.Authorization.Roles;
using IFare_BDAPI.Authorization.Users;

namespace IFare_BDAPI.Authorization
{
    public class PermissionChecker : PermissionChecker<Role, User>
    {
        public PermissionChecker(UserManager userManager)
            : base(userManager)
        {
        }
    }
}
