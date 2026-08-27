using System.Linq;
using Abp.Domain.Repositories;
using Abp.Domain.Services;
using IFare_BDAPI.Common;
using IFare_BDAPI.TaskManager.Auth.ValueModel;

namespace IFare_BDAPI.TaskManager.Auth
{
    public class AuthTaskManager : IAuthTaskManager
    {
        private readonly IRepository<SysUser> _repository;
        private readonly IPasswordHashManager _passwordHash;
        public AuthTaskManager(IRepository<SysUser> repository, IPasswordHashManager passwordHash)
        {
            _repository = repository;
            _passwordHash = passwordHash;
        }

        public AuthUser GetAuthUser(string act, string pwd)
        {
            if (string.IsNullOrEmpty(act) || string.IsNullOrEmpty(pwd)) return null;

            // 密碼已改為雜湊儲存，不能再用 SQL 直接比對，改成先取帳號再驗證
            var user = _repository.GetAll()
                                    .Where(p => p.Account == act)
                                    .FirstOrDefault();

            if (user == null) return null;

            bool needRehash;
            if (!_passwordHash.VerifyPassword(user.Password, pwd, out needRehash)) return null;

            // 舊明文（或舊雜湊版本）在驗證通過後即時升級，既有帳號不需資料轉檔
            if (needRehash) TryUpgradePassword(user, pwd);

            return new AuthUser
            {
                Id = user.Id,
                UserName = user.UserName,
                Act = user.Account,
                Pwd = "",   // 不再對外帶出密碼欄位
                Email = user.Email,
                Permission = user.Permissions,
                State = user.State
            };
        }

        /// <summary>
        /// 將驗證通過的明文密碼改存為雜湊。升級失敗不影響本次登入。
        /// </summary>
        private void TryUpgradePassword(SysUser user, string plainPwd)
        {
            try
            {
                user.Password = _passwordHash.HashPassword(plainPwd);
                _repository.Update(user);
            }
            catch
            {
                // 升級雜湊失敗時維持原值，下次登入再試
            }
        }
    }
}
