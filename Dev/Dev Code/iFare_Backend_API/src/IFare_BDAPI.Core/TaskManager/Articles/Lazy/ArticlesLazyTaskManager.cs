using System;
using System.Collections.Generic;
using System.Linq;
using Abp.Domain.Repositories;
using Abp.EntityFrameworkCore.Repositories;
using IFare_BDAPI.Common;
using IFare_BDAPI.Common.ValueModel;
using IFare_BDAPI.Constants;
using IFare_BDAPI.TaskManager.Articles.Lazy.Common;
using IFare_BDAPI.TaskManager.Articles.Lazy.ValueModel;
using IFare_BDAPI.TaskManager.Code.ValueModel;
using Microsoft.EntityFrameworkCore;

namespace IFare_BDAPI.TaskManager.Articles.Lazy 
{
    public class ArticlesLazyTaskManager : IArticlesLazyTaskManager
    {
        private readonly IRepository<ArticleLazy> _repositoryArticleLazy;
        private readonly IRepository<ArticleLazyCodeKeyword> _repositoryALKeyword;
        private readonly IRepository<ArticleLazyImage> _repositoryALImage;
        private readonly IRepository<Image> _repositoryImage;
        private readonly ICommonToolsManager _commonTools;
        public ArticlesLazyTaskManager(IRepository<ArticleLazy> repositoryArticleLazy,
                                    IRepository<ArticleLazyCodeKeyword> repositoryALKeyword,
                                    IRepository<ArticleLazyImage> repositoryALImage,
                                    IRepository<Image> repositoryImage,
                                    ICommonToolsManager commonTools)
        {
            _repositoryArticleLazy = repositoryArticleLazy;
            _repositoryALKeyword = repositoryALKeyword;
            _repositoryALImage = repositoryALImage;
            _repositoryImage = repositoryImage;
            _commonTools = commonTools;
        }

        public ArticlesLazyResult GetDataList(ArticlesLazyFilterParam param)
        {
            var paramChecker = new FilterParamChecker(param);
            var list = new List<ArticlesLazyData>();

            if (!paramChecker.IsCheckPass()) return new ArticlesLazyResult(_commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_ParamFail, paramChecker.GetErrMsg()), null);

            var query = _repositoryArticleLazy.GetAll()
                                                .Include(p => p.Policy)
                                                .Where(p => p.Policy.State != DataState.Disabled)
                                                .Include(p => p.ArticleLazyCodeKeywords.Where(p2 => p2.CodeKeyword.State != DataState.Disabled))
                                                .Where(p => p.State != DataState.Delete);

            if (param.IsCreateDateFiltered) query = query.Where(p => p.CreateTime >= param.CreateDateStart && p.CreateTime < param.CreateDateEnd.Value.AddDays(1));
            if (param.IsUpdateDateFiltered) query = query.Where(p => p.UpdateTime >= param.UpdateDateStart && p.UpdateTime < param.UpdateDateEnd.Value.AddDays(1));
            if (param.IsReleaseTimeFiltered) query = query.Where(p => p.ReleaseTime >= param.ReleaseTimeStart && p.ReleaseTime < param.ReleaseTimeEnd.Value.AddDays(1));
            if (param.IsDiscontinuedFiltered) query = query.Where(p => p.DiscontinuedTime >= param.DiscontinuedTimeStart && p.DiscontinuedTime < param.DiscontinuedTimeEnd.Value.AddDays(1));
            if (param.IsStateFiltered && param.State != DataState.All) query = query.Where(p => p.State == param.State);
            if (param.IsCodeKeywordsFiltered) 
            {
                var queryKeywordsID = _repositoryALKeyword.GetAll()
                                                        .Include(p => p.CodeKeyword)
                                                        .Where(p => p.CodeKeyword.State != DataState.Disabled && param.CodeKeywords.Contains(p.CodeKeywordId))
                                                        .Select(p => p.ArticleLazyId)
                                                        .Distinct();
                query = query.Join(queryKeywordsID, q => q.Id, qkID => qkID, (q, qkID) => q);
            }
            if (param.IsIDsFiltered) query = query.Include(p => p.ArticleLazyImages).ThenInclude(p => p.Images).Where(p => param.IDs.Contains(p.Id));
            
            list = query.Select(p => new ArticlesLazyData
                        {
                            ID = p.Id,
                            Title = p.Title,
                            State = p.State,
                            ImageList = param.IsIDsFiltered ? p.ArticleLazyImages.Select(p2 => new ImageInfo
                                                                                    {
                                                                                        ImagePath = p2.Images.ImagePath,
                                                                                        ImageName = p2.Images.ImageName,
                                                                                        ImageExtension = p2.Images.ImageNameExtension
                                                                                    })
                                                                                    .ToList() : null,
                            CodePolicy_ID = p.PolicyId.Value,
                            CodePolicy_LabelName = p.Policy.LabelName,
                            CodeKeywordList = p.ArticleLazyCodeKeywords.Select(p2 => new CodeData 
                                                                        {
                                                                            ID = p2.CodeKeyword.Id,
                                                                            LabelName = p2.CodeKeyword.LabelName,
                                                                            State = p2.CodeKeyword.State
                                                                        })
                                                                        .ToList(),
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
                                            
            return new ArticlesLazyResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), list);
        }

        private List<long> GetInsertImageIDs(List<ImageInfo> insertImages, long createUserID)
        {
            if (insertImages.Count <= 0) return null;
            using var transaction = _repositoryImage.GetDbContext().Database.BeginTransaction();

            var items = insertImages.Select(p => new Image 
            {
                ImagePath = p.ImagePath,
                ImageName = p.ImageName,
                ImageNameExtension = p.ImageExtension,
                CreateUserId = createUserID                
            })
            .ToList();

            _repositoryImage.GetDbContext().AddRange(items);
            _repositoryImage.GetDbContext().SaveChanges();

            transaction.Commit();

            return items.Select(p => p.Id).ToList();
        }

        private void ImageArticleInsert(long articlesLazyID, List<long> ImgListIDs)
        {
            using var transaction = _repositoryALImage.GetDbContext().Database.BeginTransaction();

            var imgItems = ImgListIDs.Select(_id => new ArticleLazyImage()
            {
                ArticleLazyId = articlesLazyID,
                ImagesId = _id
            })
            .ToList();

            _repositoryALImage.GetDbContext().AddRange(imgItems);
            _repositoryALImage.GetDbContext().SaveChanges();

            transaction.Commit();
        }

        private void CodeInsertHandler(long articlesLazyID, List<long> insertKeywordIDs)
        {
            // Code Keywords.
            using var transaction_keyword = _repositoryALKeyword.GetDbContext().Database.BeginTransaction();

            var code_keywordItems = insertKeywordIDs.Select(_id => new ArticleLazyCodeKeyword()
            {
                ArticleLazyId = articlesLazyID,
                CodeKeywordId = _id
            })
            .ToList();

            _repositoryALKeyword.GetDbContext().AddRange(code_keywordItems);
            _repositoryALKeyword.GetDbContext().SaveChanges();

            transaction_keyword.Commit();
        }

        public ErrorInfoBase InsertArticlesLazy(ArticlesLazyInsertData insertData)
        {
            try 
            {
                var inputChecker = new InputChecker(insertData);

                if (!inputChecker.IsCheckPass()) return _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail, inputChecker.GetErrMsg());

                var _imgIDs = GetInsertImageIDs(insertData.ImageList, insertData.CreateUserID);

                using var transaction = _repositoryArticleLazy.GetDbContext().Database.BeginTransaction();

                var item = new ArticleLazy()
                {
                    Title = insertData.Title,
                    PolicyId = insertData.CodePolicyID,
                    ReleaseTime = insertData.ReleaseTime,
                    DiscontinuedTime = insertData.DiscontinuedTime,
                    State = insertData.State,
                    CreateUserId = insertData.CreateUserID
                };

                _repositoryArticleLazy.GetDbContext().Add(item);
                _repositoryArticleLazy.GetDbContext().SaveChanges();

                transaction.Commit();

                CodeInsertHandler(item.Id, insertData.CodeKeywordIDs);
                ImageArticleInsert(item.Id, _imgIDs);

                return _commonTools.GetErrorInfo_API(ErrAPI.Code_Success);
            }
            catch (Exception e)
            {
                throw _commonTools.GetErrorInfo_Exception(e.Message);
            }
        }

        public ErrorInfoBase UpdateArticlesLazy(ArticlesLazyEditorData editorData)
        {
            try 
            {
                var inputChecker = new InputChecker(editorData);

                if (!inputChecker.IsCheckPass()) return _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail, inputChecker.GetErrMsg());

                var item = _repositoryArticleLazy.GetAll()
                                        .Where(p => p.Id == editorData.ID)
                                        .FirstOrDefault();

                if (item == null) return _commonTools.GetErrorInfo_API(ErrAPI.Code_Fail_Update);

                if (editorData.ImageList.Count > 0) 
                {
                    // Remove Image.
                    var _removeALImgQuery = _repositoryALImage.GetAll()
                                                    .Where(p => p.ArticleLazyId == item.Id);
                    var _removeImageQuery = _repositoryImage.GetAll()
                                                            .Join(_removeALImgQuery, img => img.Id, alImg => alImg.ImagesId, (img, alImg) => img);
                                                            
                    using var transaction_img = _repositoryImage.GetDbContext().Database.BeginTransaction();
                    _repositoryImage.GetDbContext().RemoveRange(_removeImageQuery);
                    _repositoryImage.GetDbContext().SaveChanges();
                    transaction_img.Commit();
                }

                // Remove Code Keywords.
                var _IFarePolicyCodeKeywords = _repositoryALKeyword.GetAll()
                                                                    .Where(p => p.ArticleLazyId == item.Id)
                                                                    .ToList();
                using var transaction_keywords = _repositoryALKeyword.GetDbContext().Database.BeginTransaction();
                _repositoryALKeyword.GetDbContext().RemoveRange(_IFarePolicyCodeKeywords);
                _repositoryALKeyword.GetDbContext().SaveChanges();
                transaction_keywords.Commit();

                var _imgIDs = GetInsertImageIDs(editorData.ImageList, editorData.UpdateUserID);

                using var transaction = _repositoryArticleLazy.GetDbContext().Database.BeginTransaction();

                _repositoryArticleLazy.GetDbContext().Attach(item);

                item.Title = editorData.Title;
                item.PolicyId = editorData.CodePolicyID;
                item.ReleaseTime = editorData.ReleaseTime;
                item.DiscontinuedTime = editorData.DiscontinuedTime;
                item.State = editorData.State;
                item.UpdateUserId = editorData.UpdateUserID;
                item.UpdateTime = DateTime.Now;

                _repositoryArticleLazy.GetDbContext().SaveChanges();

                transaction.Commit();

                CodeInsertHandler(item.Id, editorData.CodeKeywordIDs);
                ImageArticleInsert(item.Id, _imgIDs);

                return _commonTools.GetErrorInfo_API(ErrAPI.Code_Success);
            }
            catch (Exception e)
            {
                throw _commonTools.GetErrorInfo_Exception(e.Message);
            }
        }

        public ErrorInfoBase DeleteArticlesLazy(ArticlesLazyDeleteData deleteData)
        {
            try 
            {
                var item = _repositoryArticleLazy.GetAll()
                                        .Where(p => p.Id == deleteData.ID)
                                        .FirstOrDefault();

                if (item == null) return _commonTools.GetErrorInfo_API(ErrAPI.Code_Fail_Update);

                item.State = DataState.Delete;
                item.UpdateUserId = deleteData.UpdateUserID;
                item.UpdateTime = DateTime.Now;

                _repositoryArticleLazy.Update(item);

                return _commonTools.GetErrorInfo_API(ErrAPI.Code_Success);
            }
            catch (Exception e)
            {
                throw _commonTools.GetErrorInfo_Exception(e.Message);
            }
        }
    }
}