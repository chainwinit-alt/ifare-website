using System;
using System.Collections.Generic;
using System.Linq;
using Abp.Domain.Repositories;
using Abp.EntityFrameworkCore.Repositories;
using IFare_BDAPI.Common;
using IFare_BDAPI.Common.ValueModel;
using IFare_BDAPI.Constants;
using IFare_BDAPI.TaskManager.Articles.Welfare.Common;
using IFare_BDAPI.TaskManager.Articles.Welfare.ValueModel;
using IFare_BDAPI.TaskManager.Code.ValueModel;
using Microsoft.EntityFrameworkCore;

namespace IFare_BDAPI.TaskManager.Articles.Welfare 
{
    public class ArticlesWelfareTaskManager : IArticlesWelfareTaskManager
    {
        private readonly IRepository<ArticleWelfare> _repositoryArticleWelfare;
        private readonly IRepository<ArticleWelfareCodeKeyword> _repositoryAWFKeywords;
        private readonly ICommonToolsManager _commonTools;
        public ArticlesWelfareTaskManager(IRepository<ArticleWelfare> repositoryArticleWelfare, IRepository<ArticleWelfareCodeKeyword> repositoryAWFKeywords, ICommonToolsManager commonTools)
        {
            _repositoryArticleWelfare = repositoryArticleWelfare;
            _repositoryAWFKeywords = repositoryAWFKeywords;
            _commonTools = commonTools;
        }

        public ArticlesWelfareResult GetDataList(ArticlesWelfareFilterParam param)
        {
            var paramChecker = new FilterParamChecker(param);
            var list = new List<ArticlesWelfareData>();

            if (!paramChecker.IsCheckPass()) return new ArticlesWelfareResult(_commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_ParamFail, paramChecker.GetErrMsg()), null);

            var query = _repositoryArticleWelfare.GetAll()
                                                .Include(p => p.Policy)
                                                .Where(p => p.Policy.State != DataState.Disabled)
                                                .Include(p => p.ArticleWelfareCodeKeywords.Where(p2 => p2.CodeKeyword.State != DataState.Disabled))
                                                .Where(p => p.State != DataState.Delete);

            if (param.IsCreateDateFiltered) query = query.Where(p => p.CreateTime >= param.CreateDateStart && p.CreateTime < param.CreateDateEnd.Value.AddDays(1));
            if (param.IsUpdateDateFiltered) query = query.Where(p => p.UpdateTime >= param.UpdateDateStart && p.UpdateTime < param.UpdateDateEnd.Value.AddDays(1));
            if (param.IsReleaseTimeFiltered) query = query.Where(p => p.ReleaseTime >= param.ReleaseTimeStart && p.ReleaseTime < param.ReleaseTimeEnd.Value.AddDays(1));
            if (param.IsDiscontinuedFiltered) query = query.Where(p => p.DiscontinuedTime >= param.DiscontinuedTimeStart && p.DiscontinuedTime < param.DiscontinuedTimeEnd.Value.AddDays(1));
            if (param.IsCodePolicyFiltered) query = query.Where(p => p.PolicyId == param.CodePolicy);
            if (param.IsStateFiltered && param.State != DataState.All) query = query.Where(p => p.State == param.State);
            if (param.IsCodeKeywordsFiltered) 
            {
                var queryKeywordsID = _repositoryAWFKeywords.GetAll()
                                                        .Include(p => p.CodeKeyword)
                                                        .Where(p => p.CodeKeyword.State != DataState.Disabled && param.CodeKeywords.Contains(p.CodeKeywordId))
                                                        .Select(p => p.ArticleWelfareId)
                                                        .Distinct();
                query = query.Join(queryKeywordsID, q => q.Id, qkID => qkID, (q, qkID) => q);
            }
            if (param.IsIDsFiltered) query = query.Where(p => param.IDs.Contains(p.Id));
            
            list = query.Select(p => new ArticlesWelfareData
                        {
                            ID = p.Id,
                            Title = p.Title,
                            Detail = p.Detail,
                            State = p.State,
                            CodePolicy_ID = p.PolicyId.Value,
                            CodePolicy_LabelName = p.Policy.LabelName,
                            CodeKeywordList = p.ArticleWelfareCodeKeywords.Select(p2 => new CodeData 
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
                                            
            return new ArticlesWelfareResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), list);
        }

        private void InsertWelfareKeyword(long articlesWelfareID, List<long> insertKeywords)
        {
            using var transaction_Keyword = _repositoryAWFKeywords.GetDbContext().Database.BeginTransaction();

            var itemKeywordList = insertKeywords.Select(_keywordID => new ArticleWelfareCodeKeyword
                {
                    ArticleWelfareId = articlesWelfareID,
                    CodeKeywordId = _keywordID
                })
                .ToList();

            _repositoryAWFKeywords.GetDbContext().AddRange(itemKeywordList);
            _repositoryAWFKeywords.GetDbContext().SaveChanges();

            transaction_Keyword.Commit();
        }

        public ErrorInfoBase InsertArticlesWelfare(ArticlesWelfareInsertData insertData)
        {
            try 
            {
                var inputChecker = new InputChecker(insertData);

                if (!inputChecker.IsCheckPass()) return _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail, inputChecker.GetErrMsg());

                using var transaction = _repositoryArticleWelfare.GetDbContext().Database.BeginTransaction();

                var item = new ArticleWelfare
                {
                    Title = insertData.Title,
                    Detail = insertData.Detail,
                    PolicyId = insertData.CodePolicyID,
                    ReleaseTime = insertData.ReleaseTime,
                    DiscontinuedTime = insertData.DiscontinuedTime,
                    State = insertData.State,
                    CreateUserId = insertData.CreateUserID
                };

                _repositoryArticleWelfare.GetDbContext().Add(item);
                _repositoryArticleWelfare.GetDbContext().SaveChanges();

                transaction.Commit();

                InsertWelfareKeyword(item.Id, insertData.CodeKeywordIDs);

                return _commonTools.GetErrorInfo_API(ErrAPI.Code_Success);
            }
            catch (Exception e)
            {
                throw _commonTools.GetErrorInfo_Exception(e.Message);
            }
        }

        public ErrorInfoBase UpdateArticlesWelfare(ArticlesWelfareEditorData editorData)
        {
            try 
            {
                var inputChecker = new InputChecker(editorData);

                if (!inputChecker.IsCheckPass()) return _commonTools.GetErrorInfo_APIWithMsg(ErrAPI.Code_Fail, inputChecker.GetErrMsg());

                var item = _repositoryArticleWelfare.GetAll()
                                        .Where(p => p.Id == editorData.ID)
                                        .FirstOrDefault();

                if (item == null) return _commonTools.GetErrorInfo_API(ErrAPI.Code_Fail_Update);

                using var transaction = _repositoryArticleWelfare.GetDbContext().Database.BeginTransaction();

                _repositoryArticleWelfare.GetDbContext().Attach(item);

                item.Title = editorData.Title;
                item.Detail = editorData.Detail;
                item.PolicyId = editorData.CodePolicyID;
                item.State = editorData.State;
                item.UpdateUserId = editorData.UpdateUserID;
                item.UpdateTime = DateTime.Now;
                item.ReleaseTime = editorData.ReleaseTime;
                item.DiscontinuedTime = editorData.DiscontinuedTime;

                _repositoryArticleWelfare.GetDbContext().SaveChanges();

                transaction.Commit();

                // Remove Code Keywords.
                var _ArticlesWelfareCodeKeywords = _repositoryAWFKeywords.GetAll()
                                                                    .Where(p => p.ArticleWelfareId == item.Id)
                                                                    .ToList();
                using var transaction_keywords = _repositoryAWFKeywords.GetDbContext().Database.BeginTransaction();
                _repositoryAWFKeywords.GetDbContext().RemoveRange(_ArticlesWelfareCodeKeywords);
                _repositoryAWFKeywords.GetDbContext().SaveChanges();
                transaction_keywords.Commit();

                InsertWelfareKeyword(item.Id, editorData.CodeKeywordIDs);

                return _commonTools.GetErrorInfo_API(ErrAPI.Code_Success);
            }
            catch (Exception e)
            {
                throw _commonTools.GetErrorInfo_Exception(e.Message);
            }
        }

        public ErrorInfoBase DeleteArticlesWelfare(ArticlesWelfareDeleteData deleteData)
        {
            try 
            {
                var item = _repositoryArticleWelfare.GetAll()
                                        .Where(p => p.Id == deleteData.ID)
                                        .FirstOrDefault();

                if (item == null) return _commonTools.GetErrorInfo_API(ErrAPI.Code_Fail_Update);

                item.State = DataState.Delete;
                item.UpdateUserId = deleteData.UpdateUserID;
                item.UpdateTime = DateTime.Now;

                _repositoryArticleWelfare.Update(item);

                return _commonTools.GetErrorInfo_API(ErrAPI.Code_Success);
            }
            catch (Exception e)
            {
                throw _commonTools.GetErrorInfo_Exception(e.Message);
            }
        }
    }
}