using System.Linq;
using Abp.Domain.Repositories;
using IFare_BDAPI.Common;
using IFare_BDAPI.Constants;
using IFare_BDAPI.TaskManager.Main.ValueModel;
using IFare_BDAPI.TaskManager.Personal.ValueModel;

namespace IFare_BDAPI.TaskManager.Main
{
    public class MainTaskManager : IMainTaskManager
    {
        private readonly IRepository<SysUser> _repositorySysUser;
        private readonly ICommonToolsManager _commonTools;
        private readonly IPasswordHashManager _passwordHash;
        public MainTaskManager(IRepository<SysUser> repositorySysUser, ICommonToolsManager commonTools, IPasswordHashManager passwordHash)
        {
            _repositorySysUser = repositorySysUser;
            _commonTools = commonTools;
            _passwordHash = passwordHash;
        }

        public PersonalResult LoginCheck(LoginParam param)
        {
            // 先取得帳號，再依舊資料庫的明文格式驗證密碼。
            var user = _repositorySysUser.GetAll()
                                            .Where(p => p.Account == param.act)
                                            .FirstOrDefault();

            if (user == null || !_passwordHash.VerifyPassword(user.Password, param.pwd, out _))
            {
                return new PersonalResult(_commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail, "查無此帳號"), null);
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

            if (info.State == DataState.Disabled) return new PersonalResult(_commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail, "此帳號已被禁用"), null);

            return new PersonalResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), info);
        }

    }
}
