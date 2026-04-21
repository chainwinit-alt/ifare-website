using System.Linq;
using Abp.Domain.Repositories;
using Abp.Domain.Services;
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
            return _repository.GetAll()
                                .Where(p => p.Account == act && p.Password == pwd)
                                .Select(p => new AuthUser
                                {
                                    Id = p.Id,
                                    UserName = p.UserName,
                                    Act = p.Account,
                                    Pwd = p.Password,
                                    Email = p.Email,
                                    Permission = p.Permissions,
                                    State = p.State
                                })
                                .FirstOrDefault();
        }

        
    }
}