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
            // 密碼已改為雜湊儲存，不能再用 SQL 直接比對，改成先取帳號再驗證
            var user = _repositorySysUser.GetAll()
                                            .Where(p => p.Account == param.act)
                                            .FirstOrDefault();

            bool needRehash;
            if (user == null || !_passwordHash.VerifyPassword(user.Password, param.pwd, out needRehash))
            {
                return new PersonalResult(_commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail, "查無此帳號"), null);
            }

            // 舊明文（或舊雜湊版本）在驗證通過後即時升級，既有帳號不需資料轉檔
            if (needRehash) TryUpgradePassword(user, param.pwd);

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

        /// <summary>
        /// 將驗證通過的明文密碼改存為雜湊。升級失敗不影響本次登入。
        /// </summary>
        private void TryUpgradePassword(SysUser user, string plainPwd)
        {
            try
            {
                user.Password = _passwordHash.HashPassword(plainPwd);
                _repositorySysUser.Update(user);
            }
            catch
            {
                // 升級雜湊失敗時維持原值，下次登入再試
            }
        }
    }
}