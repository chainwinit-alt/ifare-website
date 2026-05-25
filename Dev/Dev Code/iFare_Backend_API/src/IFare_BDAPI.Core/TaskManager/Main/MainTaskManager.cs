using System.Linq;
using Abp.Domain.Repositories;
using IFare_BDAPI.Common;
using IFare_BDAPI.Constants;
using IFare_BDAPI.Security;
using IFare_BDAPI.TaskManager.Main.ValueModel;
using IFare_BDAPI.TaskManager.Personal.ValueModel;

namespace IFare_BDAPI.TaskManager.Main
{
    public class MainTaskManager : IMainTaskManager
    {
        private readonly IRepository<SysUser> _repositorySysUser;
        private readonly ICommonToolsManager _commonTools;

        public MainTaskManager(IRepository<SysUser> repositorySysUser, ICommonToolsManager commonTools)
        {
            _repositorySysUser = repositorySysUser;
            _commonTools = commonTools;
        }

        public PersonalResult LoginCheck(LoginParam param)
        {
            var user = _repositorySysUser.GetAll()
                .Where(p => p.Account == param.act)
                .FirstOrDefault();

            if (user == null)
            {
                return new PersonalResult(_commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail, "Invalid account or password"), null);
            }

            if (user.State != DataState.Enabled)
            {
                return new PersonalResult(_commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail, "Account is disabled"), null);
            }

            var passwordResult = SysUserPasswordHasher.VerifyPassword(user.Password, param.pwd);
            if (passwordResult == SysUserPasswordVerificationResult.Failed)
            {
                return new PersonalResult(_commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail, "Invalid account or password"), null);
            }

            if (passwordResult == SysUserPasswordVerificationResult.SuccessRehashNeeded)
            {
                user.Password = SysUserPasswordHasher.HashPassword(param.pwd);
                _repositorySysUser.Update(user);
            }

            var info = new PersonalInfo
            {
                ID = user.Id,
                Account = user.Account,
                UserName = user.UserName,
                Email = user.Email,
                Permission = user.Permissions,
                State = user.State,
            };

            return new PersonalResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), info);
        }
    }
}
