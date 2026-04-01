using System;
using System.Collections.Generic;
using System.Linq;
using Abp.Domain.Repositories;
using IFare_BDAPI.Common;
using IFare_BDAPI.Common.ValueModel;
using IFare_BDAPI.Constants;
using IFare_BDAPI.TaskManager.Account.Common;
using IFare_BDAPI.TaskManager.Account.ValueModel;

namespace IFare_BDAPI.TaskManager.Account
{
    public class AccountTaskManager : IAccountTaskManager 
    {
        private readonly IRepository<SysUser> _repositorySysUser;
        private readonly ICommonToolsManager _commonTools;
        public AccountTaskManager(IRepository<SysUser> repositorySysUser, ICommonToolsManager commonTools)
        {
            _repositorySysUser = repositorySysUser;
            _commonTools = commonTools;
        }

        public AccountResult GetAccountList(AccountFilterParam param, long searchUserID)
        {
            var paramChecker = new FilterParamChecker(param);
            var list = new List<AccountData>();

            if (!paramChecker.IsCheckPass()) return new AccountResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_ParamFail), null);

            var searchUser = _repositorySysUser.GetAll().Where(p => p.Id == searchUserID).FirstOrDefault();

            var query = _repositorySysUser.GetAll();

            if (param.IsPermissionFiltered && param.Permission != UserPermission.All) query = query.Where(p => p.Permissions == param.Permission);
            if (param.IsStateFiltered && param.State != DataState.All) query = query.Where(p => p.State == param.State);
            if (param.IsAccountFiltered) query = query.Where(p => p.Account.Contains(param.Account));
            if (param.IsIDsFiltered) query = query.Where(p => param.IDs.Contains(p.Id));

            list = query.Select(p => new AccountData 
                        {
                            ID = p.Id,
                            Account = p.Account,
                            UserName = p.UserName,
                            Email = p.Email,
                            Permission = p.Permissions,
                            State = p.State,
                            Pwd = searchUser.Permissions == UserPermission.Admin ? p.Password : "",
                            CreateDate = p.CreateTime,
                            CreateUserID = p.CreateUserId,
                            CreateUserName = p.CreateUser.UserName,
                            UpdateDate = p.UpdateTime,
                            UpdateUserID = p.UpdateUserId,
                            UpdateUserName = p.UpdateUser.UserName
                        })
                        .OrderByDescending(p => p.CreateDate)
                        .ToList();
                                            
            return new AccountResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), list);
        }

        public ErrorInfoBase InsertAccount(AccountInsertData insertData)
        {
            try 
            {
                var inputChecker = new InputChecker(insertData);

                if (!inputChecker.IsCheckPass()) return _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail, inputChecker.GetErrMsg());
                if (!_commonTools.IsMailValid(insertData.Email)) return _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_ParamFail, "Email格式不符");
                if (_repositorySysUser.GetAll().Where(p => p.Account == insertData.Account).Count() > 0)
                {
                    return _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail_Create, "此帳號已存在");
                }

                _repositorySysUser.Insert(new SysUser 
                {
                    UserName = insertData.UserName,
                    Account = insertData.Account,
                    Email = insertData.Email,
                    Permissions = insertData.Permission,
                    State = insertData.State,
                    Password = insertData.Pwd,
                    CreateUserId = insertData.CreateUserID
                });

                return _commonTools.GetErrorInfo_API(ErrAPI.Code_Success);
            }
            catch (Exception e)
            {
                throw _commonTools.GetErrorInfo_Exception(e.Message);
            }
        }

        public ErrorInfoBase UpdateAccount(AccountEditorData editorData)
        {
            try 
            {
                var inputChecker = new InputChecker(editorData);

                if (!inputChecker.IsCheckPass()) return _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail, inputChecker.GetErrMsg());
                if (_repositorySysUser.GetAll().Where(p => p.Account == editorData.Account && p.Id != editorData.ID).Count() > 0)
                {
                    return _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail_Update, "此帳號已存在");
                }

                var item = _repositorySysUser.GetAll()
                                            .Where(p => p.Id == editorData.ID)
                                            .FirstOrDefault();

                if (item == null) return _commonTools.GetErrorInfo_API(ErrAPI.Code_Fail_Update);
                if (IsPermissionAdmin(editorData.UpdateUserID)) 
                {
                    if (item.Account != editorData.Account) item.Account = editorData.Account;
                    item.Permissions = editorData.Permission;
                    item.State = editorData.State;
                }

                item.UserName = editorData.UserName;
                item.Email = editorData.Email;
                item.UpdateUserId = editorData.UpdateUserID;
                item.UpdateTime = DateTime.Now;

                _repositorySysUser.Update(item);

                return _commonTools.GetErrorInfo_API(ErrAPI.Code_Success);
            }
            catch (Exception e)
            {
                throw _commonTools.GetErrorInfo_Exception(e.Message);
            }
        }

        public bool IsPermissionEditor(long actID)
        {
            var _permission = _repositorySysUser.GetAll()
                                                .Where(p => p.Id == actID)
                                                .Select(p => p.Permissions)
                                                .FirstOrDefault();
            return _permission == UserPermission.Editor || _permission == UserPermission.Admin;
        }

        public bool IsPermissionAdmin(long actID)
        {
            var _permission = _repositorySysUser.GetAll()
                                                .Where(p => p.Id == actID)
                                                .Select(p => p.Permissions)
                                                .FirstOrDefault();
            return _permission == UserPermission.Admin;
        }
    }
}