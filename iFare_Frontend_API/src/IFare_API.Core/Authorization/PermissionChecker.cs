using Abp.Authorization;
using IFare_API.Authorization.Roles;
using IFare_API.Authorization.Users;

namespace IFare_API.Authorization
{
    public class PermissionChecker : PermissionChecker<Role, User>
    {
        public PermissionChecker(UserManager userManager)
            : base(userManager)
        {
        }
    }
}
