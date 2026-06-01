using System.Linq;
using Abp.Domain.Repositories;
using Abp.Domain.Services;
using IFare_BDAPI.Constants;
using IFare_BDAPI.Security;
using IFare_BDAPI.TaskManager.Auth.ValueModel;

namespace IFare_BDAPI.TaskManager.Auth 
{
    public class AuthTaskManager : IAuthTaskManager
    {
        private readonly IRepository<SysUser> _repository;
        public AuthTaskManager(IRepository<SysUser> repository) 
        {
            _repository = repository;
        }

        public AuthUser GetAuthUser(string act, string pwd)
        {
            var user = _repository.GetAll()
                                .Where(p => p.Account == act)
                                .FirstOrDefault();

            if (user == null || user.State != DataState.Enabled)
            {
                return null;
            }

            var passwordResult = SysUserPasswordHasher.VerifyPassword(user.Password, pwd);
            if (passwordResult == SysUserPasswordVerificationResult.Failed)
            {
                return null;
            }

            if (passwordResult == SysUserPasswordVerificationResult.SuccessRehashNeeded)
            {
                user.Password = SysUserPasswordHasher.HashPassword(pwd);
                _repository.Update(user);
            }

            return new AuthUser
            {
                Id = user.Id,
                UserName = user.UserName,
                Act = user.Account,
                Pwd = string.Empty,
                Email = user.Email,
                Permission = user.Permissions,
                State = user.State
            };
        }

        
    }
}
