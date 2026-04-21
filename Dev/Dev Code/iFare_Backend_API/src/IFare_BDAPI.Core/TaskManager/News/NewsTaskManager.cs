using System;
using System.Collections.Generic;
using System.Linq;
using Abp.Domain.Repositories;
using IFare_BDAPI.Common;
using IFare_BDAPI.Common.ValueModel;
using IFare_BDAPI.Constants;
using IFare_BDAPI.TaskManager.News.Common;
using IFare_BDAPI.TaskManager.News.ValueModel;

namespace IFare_BDAPI.TaskManager.News 
{
    public class NewsTaskManager : INewsTaskManager 
    {
        private readonly IRepository<IFare_BDAPI.News> _repositoryNews;
        private readonly ICommonToolsManager _commonTools;
        
        public NewsTaskManager(IRepository<IFare_BDAPI.News> repositoryNews, ICommonToolsManager commonTools)
        {
            _repositoryNews = repositoryNews;
            _commonTools = commonTools;
        }

        public NewsResult GetDataList(NewsFilterParam param)
        {
            var paramChecker = new FilterParamChecker(param);
            var list = new List<NewsData>();

            if (!paramChecker.IsCheckPass()) return new NewsResult(_commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_ParamFail, paramChecker.GetErrMsg()), null);

            var query = _repositoryNews.GetAll().Where(p => p.State != DataState.Delete);

            if (param.IsCreateDateFiltered) query = query.Where(p => p.CreateTime >= param.CreateDateStart && p.CreateTime < param.CreateDateEnd.Value.AddDays(1));
            if (param.IsUpdateDateFiltered) query = query.Where(p => p.UpdateTime >= param.UpdateDateStart && p.UpdateTime < param.UpdateDateEnd.Value.AddDays(1));
            if (param.IsStateFiltered && param.State != DataState.All) query = query.Where(p => p.State == param.State);
            if (param.IsIDsFiltered) query = query.Where(p => param.IDs.Contains(p.Id));
            list = query.Select(p => new NewsData
                        {
                            ID = p.Id,
                            Title = p.Title,
                            Detail = p.Detail,
                            State = p.State,
                            ReleaseTime = p.ReleaseTime.Value,
                            DiscontinuedTime = p.DiscontinuedTime.Value,
                            CreateDate = p.CreateTime,
                            CreateUserID = p.CreateUserId,
                            CreateUserName = p.CreateUser.UserName,
                            UpdateDate = p.UpdateTime,
                            UpdateUserID = p.UpdateUserId,
                            UpdateUserName = p.UpdateUser.UserName
                        })
                        .OrderByDescending(p => p.CreateDate)
                        .ToList();
                                            
            return new NewsResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), list);
        }

        public ErrorInfoBase InsertNews(NewsInsertData insertData)
        {
            try 
            {
                var inputChecker = new InputChecker(insertData);

                if (!inputChecker.IsCheckPass()) return _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail, inputChecker.GetErrMsg());

                _repositoryNews.Insert(new IFare_BDAPI.News 
                {
                    Title = insertData.Title,
                    Detail = insertData.Detail,
                    ReleaseTime = insertData.ReleaseTime,
                    DiscontinuedTime = insertData.DiscontinuedTime,
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

        public ErrorInfoBase UpdateNews(NewsEditorData editorData)
        {
            try 
            {
                var inputChecker = new InputChecker(editorData);

                if (!inputChecker.IsCheckPass()) return _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail, inputChecker.GetErrMsg());

                var item = _repositoryNews.GetAll()
                                        .Where(p => p.Id == editorData.ID)
                                        .FirstOrDefault();

                if (item == null) return _commonTools.GetErrorInfo_API(ErrAPI.Code_Fail_Update);

                item.Title = editorData.Title;
                item.Detail = editorData.Detail;
                item.ReleaseTime = editorData.ReleaseTime;
                item.DiscontinuedTime = editorData.DiscontinuedTime;
                item.State = editorData.State;
                item.UpdateUserId = editorData.UpdateUserID;
                item.UpdateTime = DateTime.Now;

                _repositoryNews.Update(item);

                return _commonTools.GetErrorInfo_API(ErrAPI.Code_Success);
            }
            catch (Exception e)
            {
                throw _commonTools.GetErrorInfo_Exception(e.Message);
            }
        }

        public ErrorInfoBase DeleteNews(NewsDeleteData deleteData)
        {
            try 
            {
                var item = _repositoryNews.GetAll()
                                        .Where(p => p.Id == deleteData.ID)
                                        .FirstOrDefault();

                if (item == null) return _commonTools.GetErrorInfo_API(ErrAPI.Code_Fail_Update);

                item.State = DataState.Delete;
                item.UpdateUserId = deleteData.UpdateUserID;
                item.UpdateTime = DateTime.Now;

                _repositoryNews.Update(item);

                return _commonTools.GetErrorInfo_API(ErrAPI.Code_Success);
            }
            catch (Exception e)
            {
                throw _commonTools.GetErrorInfo_Exception(e.Message);
            }
        }
    }
}