using System;
using System.Linq;
using System.Security.Claims;
using Abp.UI;
using IFare_BDAPI.Constants;
using IFare_BDAPI.TaskManager.Account;
using Microsoft.AspNetCore.Mvc.Filters;

namespace IFare_BDAPI.Filter
{
    public class IsEditorCheckerFilter : IActionFilter
    {
        private AccountTaskManager _accountTaskManager;
        public IsEditorCheckerFilter(AccountTaskManager accountTaskManager)
        {
            _accountTaskManager = accountTaskManager;
        }

        public void OnActionExecuted(ActionExecutedContext context)
        {
            // throw new System.NotImplementedException();
        }

        public void OnActionExecuting(ActionExecutingContext context)
        {
            // throw new System.NotImplementedException();
            if (!_accountTaskManager.IsPermissionEditor(Convert.ToInt64(context.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value)))
            {
                throw new UserFriendlyException(ErrMsg.PermissionFail);
            }
        }
    }
}