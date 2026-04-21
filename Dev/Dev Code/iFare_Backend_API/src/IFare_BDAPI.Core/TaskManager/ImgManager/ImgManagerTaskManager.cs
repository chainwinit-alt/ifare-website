using System;
using System.Collections.Generic;
using System.Linq;
using Abp.Domain.Repositories;
using IFare_BDAPI.Common;
using IFare_BDAPI.Common.ValueModel;
using IFare_BDAPI.Constants;
using IFare_BDAPI.TaskManager.ImgManager.Common;
using IFare_BDAPI.TaskManager.ImgManager.ValueModel;
using Microsoft.EntityFrameworkCore;

namespace IFare_BDAPI.TaskManager.ImgManager
{
    public class ImgManagerTaskManager : IImgManagerTaskManager
    {
        private readonly IRepository<ImgManage> _repositoryImgManage;
        private readonly ICommonToolsManager _commonTools;
        public ImgManagerTaskManager(IRepository<ImgManage> repositoryImgManage,
                                    ICommonToolsManager commonTools)
        {
            _repositoryImgManage = repositoryImgManage;
            _commonTools = commonTools;
        }

        public ErrorInfoBase InsertImg(ImgManagerInsertData insertData)
        {
            try 
            {
                var inputChecker = new InputChecker(insertData);

                if (!inputChecker.IsCheckPass()) return _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail, inputChecker.GetErrMsg());

                _repositoryImgManage.Insert(new ImgManage
                {
                    Title = insertData.Title,
                    ImgPath = insertData.ImgPath,
                    ImgExtension = insertData.ImgExtension,
                    Type = insertData.Type,
                    Size = insertData.Size,
                    UpdateUserId = insertData.UpdateUserID
                });

                return _commonTools.GetErrorInfo_API(ErrAPI.Code_Success);
            } 
            catch(Exception e)
            {
                throw _commonTools.GetErrorInfo_Exception(e.Message);
            }
        }

        public ErrorInfoBase EditImg(ImgManagerEditData editData)
        {
            try 
            {
                var inputChecker = new InputChecker(editData);

                if (!inputChecker.IsCheckPass()) return _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail, inputChecker.GetErrMsg());

                var item = _repositoryImgManage.GetAll()
                                                .Where(p => p.Id == editData.ID)
                                                .FirstOrDefault();

                if (item == null) return _commonTools.GetErrorInfo_API(ErrAPI.Code_Fail_Update);

                item.Title = editData.Title;
                item.Type = editData.Type;
                item.Size = editData.Size;
                item.ImgPath = editData.ImgPath;
                item.ImgExtension = editData.ImgExtension;
                item.UpdateUserId = editData.UpdateUserID;
                item.UpdateTime = DateTime.Now;

                _repositoryImgManage.Update(item);

                return _commonTools.GetErrorInfo_API(ErrAPI.Code_Success);
            } 
            catch(Exception e)
            {
                throw _commonTools.GetErrorInfo_Exception(e.Message);
            }
        }

        public ErrorInfoBase DeleteImg(long imgID)
        {
            try 
            {
                var item = _repositoryImgManage.GetAll()
                                                .Where(p => p.Id == imgID)
                                                .FirstOrDefault();

                if (item == null) return _commonTools.GetErrorInfo_API(ErrAPI.Code_Fail_Update);

                _repositoryImgManage.Delete(item);

                return _commonTools.GetErrorInfo_API(ErrAPI.Code_Success);
            } 
            catch(Exception e)
            {
                throw _commonTools.GetErrorInfo_Exception(e.Message);
            }
        }

        public ImgManagerResult GetImgManageList(ImgManagerFilterParam param)
        {
            var paramChecker = new FilterParamChecker(param);
            var list = new List<ImgManagerData>();

            if (!paramChecker.IsCheckPass()) return new ImgManagerResult(_commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_ParamFail, paramChecker.GetErrMsg()), null);

            var query = _repositoryImgManage.GetAll()
                                            .Include(p => p.UpdateUser)
                                            .AsQueryable();

            if (param.IsUpdateDateFiltered) query = query.Where(p => p.UpdateTime >= param.UpdateDateStart && p.UpdateTime < param.UpdateDateEnd.Value.AddDays(1));
            if (param.IsTypeFiltered) query = query.Where(p => p.Type == param.Type);
            if (param.IsSearchNameFiltered) query = query.Where(p => p.Title == param.SearchName);
            
            list = query.Select(p => new ImgManagerData
                        {
                            ID = p.Id,
                            Title = p.Title,
                            ImgPath = p.ImgPath,
                            ImgExtension = p.ImgExtension,
                            Type = p.Type,
                            Size = p.Size,
                            UpdateUserID = p.UpdateUserId,
                            UpdateUserName = p.UpdateUser.UserName,
                            UpdateTime = p.UpdateTime
                        })
                        .OrderByDescending(p => p.UpdateTime)
                        .ToList();
                                            
            return new ImgManagerResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), list);
        }
    }
}