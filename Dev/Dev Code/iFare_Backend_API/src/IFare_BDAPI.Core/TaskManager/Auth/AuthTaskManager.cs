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

            // 先取得帳號，再依舊資料庫的明文格式驗證密碼。
            var user = _repository.GetAll()
                                    .Where(p => p.Account == act)
                                    .FirstOrDefault();

            if (user == null) return null;

            if (!_passwordHash.VerifyPassword(user.Password, pwd, out _)) return null;

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

    }
}
