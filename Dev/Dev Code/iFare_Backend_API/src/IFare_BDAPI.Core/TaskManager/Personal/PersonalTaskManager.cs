using System.Linq;
using Abp.Domain.Repositories;
using IFare_BDAPI.Common;
using IFare_BDAPI.Common.ValueModel;
using IFare_BDAPI.Constants;
using IFare_BDAPI.TaskManager.Personal.ValueModel;

namespace IFare_BDAPI.TaskManager.Personal
{
    public class PersonalTaskManager : IPersonalTaskManager
    {
        private readonly IRepository<SysUser> _repositorySysUser;
        private readonly ICommonToolsManager _commonTools;
        private readonly IPasswordHashManager _passwordHash;
        public PersonalTaskManager(IRepository<SysUser> repositorySysUser, ICommonToolsManager commonTools, IPasswordHashManager passwordHash)
        {
            _repositorySysUser = repositorySysUser;
            _commonTools = commonTools;
            _passwordHash = passwordHash;
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
            if (req.UserName == null || req.UserName == "" || req.Email == null || req.Email == "") 
            {
                return _commonTools.GetErrorInfo_API(ErrAPI.Code_ParamFail);
            }
            if (!_commonTools.IsMailValid(req.Email)) return _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_ParamFail, "Email格式不符");

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
            if (req.Password_Old == null || req.Password_Old == "" || req.Password_New == null || req.Password_New == "") 
            {
                return _commonTools.GetErrorInfo_API(ErrAPI.Code_ParamFail);
            }
            if (req.Password_Old == req.Password_New) 
            {
                return _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail_Update, "新密碼不可與目前密碼相同");
            }

            var self = _repositorySysUser.GetAll()
                                        .Where(p => p.Id == req.UserID)
                                        .FirstOrDefault();
            if (self == null) return _commonTools.GetErrorInfo_API(ErrAPI.Code_Fail_Update);
            // 舊資料可能仍是明文，交由相容層判斷該用雜湊還是明文比對
            if (!_passwordHash.VerifyPassword(self.Password, req.Password_Old, out _))
            {
                return _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail_Update, "目前密碼不符");
            }

            // 新密碼一律存雜湊
            self.Password = _passwordHash.HashPassword(req.Password_New);
            self.UpdateUserId = req.UpdateUserID;

            _repositorySysUser.Update(self);
            
            return _commonTools.GetErrorInfo_API(ErrAPI.Code_Success);
        }
    }
}