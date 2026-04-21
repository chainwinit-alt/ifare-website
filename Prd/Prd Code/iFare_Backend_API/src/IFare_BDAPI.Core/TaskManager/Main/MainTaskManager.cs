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
        public MainTaskManager(IRepository<SysUser> repositorySysUser, ICommonToolsManager commonTools)
        {
            _repositorySysUser = repositorySysUser;
            _commonTools = commonTools;
        }

        public PersonalResult LoginCheck(LoginParam param)
        {
            var info = _repositorySysUser.GetAll()
                                            .Where(p => p.Account == param.act && p.Password == param.pwd)
                                            .Select(p => new PersonalInfo
                                            {
                                                ID = p.Id,
                                                Account = p.Account,
                                                UserName = p.UserName,
                                                Email = p.Email,
                                                Permission = p.Permissions,
                                                State = p.State,
                                            })
                                            .FirstOrDefault();
            if (info == null) return new PersonalResult(_commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail, "查無此帳號"), null);
            if (info.State == DataState.Disabled) return new PersonalResult(_commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail, "此帳號已被禁用"), null);

            return new PersonalResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), info);
        }
    }
}