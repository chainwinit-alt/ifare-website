using System;
using System.Collections.Generic;
using System.Linq;
using Abp.Domain.Repositories;
using Abp.EntityFrameworkCore.Repositories;
using IFare_BDAPI.Common;
using IFare_BDAPI.Common.ValueModel;
using IFare_BDAPI.Constants;
using IFare_BDAPI.TaskManager.Collaborator;
using IFare_BDAPI.TaskManager.Collaborator.Common;
using IFare_BDAPI.TaskManager.Collaborator.ValueModel;
using Microsoft.EntityFrameworkCore;

namespace IFare_BDAPI.TaskManager.News 
{
    public class CollaboratorTaskManager : ICollaboratorTaskManager 
    {
        private readonly IRepository<IFare_BDAPI.Collaborator> _repositoryCollaborator;
        private readonly IRepository<Image> _repositoryImage;
        private readonly ICommonToolsManager _commonTools;
        public CollaboratorTaskManager(IRepository<IFare_BDAPI.Collaborator> repositoryCollaborator, IRepository<Image> repositoryImage, ICommonToolsManager commonTools)
        {
            _repositoryCollaborator = repositoryCollaborator;
            _repositoryImage = repositoryImage;
            _commonTools = commonTools;
        }

        public CollaboratorResult GetDataList(CollaboratorFilterParam param)
        {
            var paramChecker = new FilterParamChecker(param);
            var list = new List<CollaboratorData>();

            if (!paramChecker.IsCheckPass()) return new CollaboratorResult(_commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_ParamFail, paramChecker.GetErrMsg()), null);

            var query = _repositoryCollaborator.GetAll().Where(p => p.State != DataState.Delete);;

            if (param.IsStateFiltered && param.State != DataState.All) query = query.Where(p => p.State == param.State);
            if (param.IsUpdateDateFiltered) query = query.Where(p => p.UpdateTime >= param.UpdateDateStart && p.UpdateTime < param.UpdateDateEnd.Value.AddDays(1));
            if (param.IsSearchNameFiltered) query = query.Where(p => p.Title.Contains(param.SearchName));
            if (param.IsIDsFiltered) query = query.Include(p => p.Images).Where(p => param.IDs.Contains(p.Id));
            list = query.Select(p => new CollaboratorData
                        {
                            ID = p.Id,
                            Title = p.Title,
                            ServiceItem = p.ServiceItem,
                            Tel = p.Tel,
                            Url = p.Url,
                            ImageFile = param.IsIDsFiltered ? p.Images.ImagePath : null,
                            ImageName = param.IsIDsFiltered ? p.Images.ImageName : null,
                            ImageExtension = param.IsIDsFiltered ? p.Images.ImageNameExtension : null,
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
                                            
            return new CollaboratorResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), list);
        }

        private long? GetInsertImageID(string imgPath, string imgName, string imgExtension, long createUserID)
        {
            if (imgPath == null || imgName == null || imgExtension == null) return null;
            using var transaction = _repositoryImage.GetDbContext().Database.BeginTransaction();

            var item = new Image()
            {
                ImagePath = imgPath,
                ImageName = imgName,
                ImageNameExtension = imgExtension,
                CreateUserId = createUserID,
            };

            _repositoryImage.GetDbContext().Add(item);
            _repositoryImage.GetDbContext().SaveChanges();

            transaction.Commit();

            return item.Id;
        }

        public ErrorInfoBase InsertCollaborator(CollaboratorInsertData insertData)
        {
            try 
            {
                var inputChecker = new InputChecker(insertData);

                if (!inputChecker.IsCheckPass()) return _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail, inputChecker.GetErrMsg());

                var _imgID = GetInsertImageID(insertData.ImageFile, insertData.ImageName, insertData.ImageExtension, insertData.CreateUserID);

                using var transaction = _repositoryCollaborator.GetDbContext().Database.BeginTransaction();

                var item = new IFare_BDAPI.Collaborator()
                {
                    Title = insertData.Title,
                    State = insertData.State,
                    CreateUserId = insertData.CreateUserID,
                    ServiceItem = insertData.ServiceItem,
                    Tel = insertData.Tel,
                    Url = insertData.Url,
                    ImagesId = _imgID
                };

                _repositoryCollaborator.GetDbContext().Add(item);
                _repositoryCollaborator.GetDbContext().SaveChanges();

                transaction.Commit();

                return _commonTools.GetErrorInfo_API(ErrAPI.Code_Success);
            }
            catch (Exception e)
            {
                throw _commonTools.GetErrorInfo_Exception(e.Message);
            }
        }

        public ErrorInfoBase UpdateCollaborator(CollaboratorEditorData editorData)
        {
            try 
            {
                var inputChecker = new InputChecker(editorData);

                if (!inputChecker.IsCheckPass()) return _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail, inputChecker.GetErrMsg());

                var item = _repositoryCollaborator.GetAll()
                                        .Where(p => p.Id == editorData.ID)
                                        .FirstOrDefault();

                if (item == null) return _commonTools.GetErrorInfo_API(ErrAPI.Code_Fail_Update);

                if (editorData.ImageFile != null) 
                {
                    // Remove Image.
                    var _removeImage = _repositoryImage.GetAll()
                                                    .Where(p => p.Id == item.ImagesId)
                                                    .ToList();
                    using var transaction_keywords = _repositoryImage.GetDbContext().Database.BeginTransaction();
                    _repositoryImage.GetDbContext().RemoveRange(_removeImage);
                    _repositoryImage.GetDbContext().SaveChanges();
                    transaction_keywords.Commit();
                }

                var _imgID = GetInsertImageID(editorData.ImageFile, editorData.ImageName, editorData.ImageExtension, editorData.UpdateUserID);

                using var transaction = _repositoryCollaborator.GetDbContext().Database.BeginTransaction();

                _repositoryCollaborator.GetDbContext().Attach(item);

                item.Title = editorData.Title;
                item.ServiceItem = editorData.ServiceItem;
                item.Tel = editorData.Tel;
                item.Url = editorData.Url;
                item.ImagesId = _imgID != null ? _imgID : item.ImagesId;
                item.State = editorData.State;
                item.UpdateUserId = editorData.UpdateUserID;
                item.UpdateTime = DateTime.Now;

                _repositoryCollaborator.GetDbContext().SaveChanges();

                transaction.Commit();

                return _commonTools.GetErrorInfo_API(ErrAPI.Code_Success);
            }
            catch (Exception e)
            {
                throw _commonTools.GetErrorInfo_Exception(e.Message);
            }
        }

        public ErrorInfoBase DeleteCollaborator(CollaboratorDeleteData deleteData)
        {
            try 
            {
                var item = _repositoryCollaborator.GetAll()
                                        .Where(p => p.Id == deleteData.ID)
                                        .FirstOrDefault();

                if (item == null) return _commonTools.GetErrorInfo_API(ErrAPI.Code_Fail_Update);

                item.State = DataState.Delete;
                item.UpdateUserId = deleteData.UpdateUserID;
                item.UpdateTime = DateTime.Now;

                _repositoryCollaborator.Update(item);

                return _commonTools.GetErrorInfo_API(ErrAPI.Code_Success);
            }
            catch (Exception e)
            {
                throw _commonTools.GetErrorInfo_Exception(e.Message);
            }
        }
    }
}