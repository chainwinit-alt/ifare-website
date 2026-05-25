using System.Linq;
using Abp.Domain.Repositories;
using IFare_BDAPI.Common;
using IFare_BDAPI.Common.ValueModel;
using IFare_BDAPI.Constants;
using IFare_BDAPI.Security;
using IFare_BDAPI.TaskManager.Personal.ValueModel;

namespace IFare_BDAPI.TaskManager.Personal
{
    public class PersonalTaskManager : IPersonalTaskManager
    {
        private readonly IRepository<SysUser> _repositorySysUser;
        private readonly ICommonToolsManager _commonTools;

        public PersonalTaskManager(IRepository<SysUser> repositorySysUser, ICommonToolsManager commonTools)
        {
            _repositorySysUser = repositorySysUser;
            _commonTools = commonTools;
        }

        public PersonalResult GetPersonalInfo(long userID)
        {
            var info = _repositorySysUser.GetAll()
                .Where(p => p.Id == userID)
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

            return new PersonalResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), info);
        }

        public ErrorInfoBase UpdatePersonalInfo(PersonalReq req)
        {
            if (req.UserID != req.UpdateUserID) return _commonTools.GetErrorInfo_API(ErrAPI.Code_Fail_Update);
            if (string.IsNullOrEmpty(req.UserName) || string.IsNullOrEmpty(req.Email))
            {
                return _commonTools.GetErrorInfo_API(ErrAPI.Code_ParamFail);
            }

            if (!_commonTools.IsMailValid(req.Email)) return _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_ParamFail, "Invalid email");

            var self = _repositorySysUser.GetAll()
                .Where(p => p.Id == req.UserID)
                .FirstOrDefault();

            if (self == null) return _commonTools.GetErrorInfo_API(ErrAPI.Code_Fail_Update);

            self.UserName = req.UserName;
            self.Email = req.Email;
            self.UpdateUserId = req.UpdateUserID;

            _repositorySysUser.Update(self);

            return _commonTools.GetErrorInfo_API(ErrAPI.Code_Success);
        }

        public ErrorInfoBase UpdatePersonalPwd(PersonalReq req)
        {
            if (req.UserID != req.UpdateUserID) return _commonTools.GetErrorInfo_API(ErrAPI.Code_Fail_Update);
            if (string.IsNullOrEmpty(req.Password_Old) || string.IsNullOrEmpty(req.Password_New))
            {
                return _commonTools.GetErrorInfo_API(ErrAPI.Code_ParamFail);
            }

            if (req.Password_Old == req.Password_New)
            {
                return _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail_Update, "New password must be different");
            }

            var self = _repositorySysUser.GetAll()
                .Where(p => p.Id == req.UserID)
                .FirstOrDefault();

            if (self == null) return _commonTools.GetErrorInfo_API(ErrAPI.Code_Fail_Update);

            var passwordResult = SysUserPasswordHasher.VerifyPassword(self.Password, req.Password_Old);
            if (passwordResult == SysUserPasswordVerificationResult.Failed)
            {
                return _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail_Update, "Invalid current password");
            }

            self.Password = SysUserPasswordHasher.HashPassword(req.Password_New);
            self.UpdateUserId = req.UpdateUserID;

            _repositorySysUser.Update(self);

            return _commonTools.GetErrorInfo_API(ErrAPI.Code_Success);
        }
    }
}
