using System;
using System.Collections.Generic;
using System.Linq;
using Abp.Domain.Repositories;
using IFare_BDAPI.Common;
using IFare_BDAPI.Common.ValueModel;
using IFare_BDAPI.Constants;
using IFare_BDAPI.TaskManager.Fare.QA.Common;
using IFare_BDAPI.TaskManager.Fare.QA.ValueModel;

namespace IFare_BDAPI.TaskManager.Fare.QA
{
    public class FareQATaskManager : IFareQATaskManager 
    {
        private readonly IRepository<IfareQa> _repositoryIFareQA;
        private readonly ICommonToolsManager _commonTools;
        public FareQATaskManager(IRepository<IfareQa> repositoryIFareQA, ICommonToolsManager commonTools)
        {
            _repositoryIFareQA = repositoryIFareQA;
            _commonTools = commonTools;
        }

        public FareQAResult GetDataList(FareQAFilterParam param)
        {
            var paramChecker = new FilterParamChecker(param);
            var list = new List<FareQAData>();

            if (!paramChecker.IsCheckPass()) return new FareQAResult(_commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_ParamFail, paramChecker.GetErrMsg()), null);

            var query = _repositoryIFareQA.GetAll().Where(p => p.State != DataState.Delete);;

            if (param.IsCreateDateFiltered) query = query.Where(p => p.CreateTime >= param.CreateDateStart && p.CreateTime < param.CreateDateEnd.Value.AddDays(1));
            if (param.IsUpdateDateFiltered) query = query.Where(p => p.UpdateTime >= param.UpdateDateStart && p.UpdateTime < param.UpdateDateEnd.Value.AddDays(1));
            if (param.IsIDsFiltered) query = query.Where(p => param.IDs.Contains(p.Id));
            
            list = query.Select(p => new FareQAData
                        {
                            ID = p.Id,
                            Question = p.Question,
                            Answer = p.Answer,
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
                                            
            return new FareQAResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), list);
        }

        public ErrorInfoBase InsertFareQA(FareQAInsertData insertData)
        {
            try 
            {
                var inputChecker = new InputChecker(insertData);

                if (!inputChecker.IsCheckPass()) return _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail, inputChecker.GetErrMsg());

                _repositoryIFareQA.Insert(new IfareQa
                {
                    Question = insertData.Question,
                    Answer = insertData.Answer,
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

        public ErrorInfoBase UpdateFareQA(FareQAEditorData editorData)
        {
            try 
            {
                var inputChecker = new InputChecker(editorData);

                if (!inputChecker.IsCheckPass()) return _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail, inputChecker.GetErrMsg());

                var item = _repositoryIFareQA.GetAll()
                                        .Where(p => p.Id == editorData.ID)
                                        .FirstOrDefault();

                if (item == null) return _commonTools.GetErrorInfo_API(ErrAPI.Code_Fail_Update);

                item.Question = editorData.Question;
                item.Answer = editorData.Answer;
                item.State = editorData.State;
                item.UpdateUserId = editorData.UpdateUserID;
                item.UpdateTime = DateTime.Now;

                _repositoryIFareQA.Update(item);

                return _commonTools.GetErrorInfo_API(ErrAPI.Code_Success);
            }
            catch (Exception e)
            {
                throw _commonTools.GetErrorInfo_Exception(e.Message);
            }
        }

        public ErrorInfoBase DeleteFareQA(FareQADeleteData deleteData)
        {
            try 
            {
                var item = _repositoryIFareQA.GetAll()
                                        .Where(p => p.Id == deleteData.ID)
                                        .FirstOrDefault();

                if (item == null) return _commonTools.GetErrorInfo_API(ErrAPI.Code_Fail_Update);

                item.State = DataState.Delete;
                item.UpdateUserId = deleteData.UpdateUserID;
                item.UpdateTime = DateTime.Now;

                _repositoryIFareQA.Update(item);

                return _commonTools.GetErrorInfo_API(ErrAPI.Code_Success);
            }
            catch (Exception e)
            {
                throw _commonTools.GetErrorInfo_Exception(e.Message);
            }
        }
    }
}