using System;
using System.Collections.Generic;
using System.Linq;
using Abp.Domain.Repositories;
using IFare_BDAPI.Common;
using IFare_BDAPI.Common.ValueModel;
using IFare_BDAPI.Constants;
using IFare_BDAPI.TaskManager.Code.Common;
using IFare_BDAPI.TaskManager.Code.ValueModel;
using Microsoft.EntityFrameworkCore;

namespace IFare_BDAPI.TaskManager.Code.Domicile
{
    public class CodeDomicileTaskManager : ICodeDomicileTaskManager
    {
        private readonly IRepository<CodeDomicile> _repositoryCodeDomicile;
        private readonly ICommonToolsManager _commonTools;
        public CodeDomicileTaskManager(IRepository<CodeDomicile> repositoryCodeDomicile, ICommonToolsManager commonTools)
        {
            _repositoryCodeDomicile = repositoryCodeDomicile;
            _commonTools = commonTools;
        }
        
        public CodeResult GetDataList(CodeFilterParam param)
        {
            var paramChecker = new FilterParamChecker(param);
            var list = new List<CodeData>();

            if (!paramChecker.IsCheckPass()) return new CodeResult(_commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_ParamFail, paramChecker.GetErrMsg()), null);

            var query = _repositoryCodeDomicile.GetAll();
            
            if (!param.IsContainAll) query = query.Where(p => p.LabelName != CodeConst.DomicileAll);
            if (param.IsCreateDateFiltered) query = query.Where(p => p.CreateTime >= param.CreateDateStart && p.CreateTime < param.CreateDateEnd.Value.AddDays(1));
            if (param.IsUpdateDateFiltered) query = query.Where(p => p.UpdateTime >= param.UpdateDateStart && p.UpdateTime < param.UpdateDateEnd.Value.AddDays(1));
            if (param.IsSearchNameFiltered) query = query.Where(p => p.LabelName.Contains(param.SearchName));
            if (param.IsIDsFiltered) query = query.Where(p => param.IDs.Contains(p.Id));

            list = query.Select(p => new CodeData 
                        {
                            ID = p.Id,
                            LabelName = p.LabelName,
                            State = p.State,
                            CreateDate = p.CreateTime,
                            CreateUserID = p.CreateUserId,
                            CreateUserName = p.CreateUser.UserName,
                            UpdateDate = p.UpdateTime,
                            UpdateUserID = p.UpdateUserId,
                            UpdateUserName = p.UpdateUser.UserName
                        })
                        .OrderByDescending(p => p.CreateDate)
                        .ToList();
                                            
            return new CodeResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), list);
        }

        public ErrorInfoBase InsertCodeDomicile(CodeInsertData insertData)
        {
            try 
            {
                var inputChecker = new InputChecker(insertData);

                if (!inputChecker.IsCheckPass()) return _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail, inputChecker.GetErrMsg());

                _repositoryCodeDomicile.Insert(new CodeDomicile 
                {
                    LabelName = insertData.LabelName,
                    State = insertData.State,
                    CreateUserId = insertData.CreateUserID
                });

                return _commonTools.GetErrorInfo_API(ErrAPI.Code_Success);
            }
            catch (Exception e)
            {
                throw _commonTools.GetErrorInfo_Exception(e.Message);
            }
        }

        public ErrorInfoBase UpdateCodeDomicile(CodeEditorData editorData)
        {
            try 
            {
                var inputChecker = new InputChecker(editorData);

                if (!inputChecker.IsCheckPass()) return _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail, inputChecker.GetErrMsg());

                var item = _repositoryCodeDomicile.GetAll()
                                                    .Where(p => p.Id == editorData.ID)
                                                    .FirstOrDefault();

                if (item == null) return _commonTools.GetErrorInfo_API(ErrAPI.Code_Fail_Update);

                item.LabelName = editorData.LabelName;
                item.State = editorData.State;
                item.UpdateUserId = editorData.UpdateUserID;
                item.UpdateTime = DateTime.Now;

                _repositoryCodeDomicile.Update(item);

                return _commonTools.GetErrorInfo_API(ErrAPI.Code_Success);
            }
            catch (Exception e)
            {
                throw _commonTools.GetErrorInfo_Exception(e.Message);
            }
        }
    }
}