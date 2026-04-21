using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using Abp.Domain.Repositories;
using Abp.Json;
using Castle.Core.Logging;
using IFare_API.Common;
using IFare_API.Common.ValueModel;
using IFare_API.Constants;
using IFare_API.TaskManager.Articles.Lazy;
using IFare_API.TaskManager.Articles.Lazy.ValueModel;
using IFare_API.TaskManager.Articles.Welfare.ValueModel;
using IFare_API.TaskManager.Code.ValueModel;
using log4net;
using Microsoft.EntityFrameworkCore;

namespace IFare_API.TaskManager.Articles.Welfare
{
    public class ArticlesWelfareTaskManager : IArticlesWelfareTaskManager
    {
        private readonly IRepository<ArticleWelfare> _repositoryArticleWelfare;
        private readonly ICommonToolsManager _commonTools;
        private readonly ILog logs_db = LogManager.GetLogger("DbLogs");
        public ILogger Logger { get; set; }
        public ArticlesWelfareTaskManager(IRepository<ArticleWelfare> repositoryArticleWelfare,
                                ICommonToolsManager commonTools)
        {
            _repositoryArticleWelfare = repositoryArticleWelfare;
            _commonTools = commonTools;
            Logger = NullLogger.Instance;
        }

        public ArticlesWelfareResult GetArticlesWelfareList()
        {
            var list = _repositoryArticleWelfare.GetAll()
                                            .Where(p => p.ReleaseTime != null && p.ReleaseTime <= DateTime.Now && (p.DiscontinuedTime == null || p.DiscontinuedTime > DateTime.Now))
                                            .Include(p => p.Policy)
                                            .Where(p => p.Policy.State != DataState.Disabled)
                                            .Include(p => p.ArticleWelfareCodeKeywords.Where(p2 => p2.CodeKeyword.State != DataState.Disabled))
                                            .Where(p => p.State != DataState.Disabled && p.State != DataState.Delete)
                                            .Select(p => new ArticlesWelfareData 
                                            {
                                                ID = p.Id,
                                                Title = p.Title,
                                                Detail = _commonTools.GetTopsContent(p.Detail, 0),
                                                CodePolicy_ID = p.PolicyId.Value,
                                                CodePolicy_LabelName = p.Policy.LabelName,
                                                CodeKeywordList = p.ArticleWelfareCodeKeywords.Select(p2 => new CodeData 
                                                                        {
                                                                            ID = p2.CodeKeyword.Id,
                                                                            CodeName = p2.CodeKeyword.LabelName
                                                                        })
                                                                        .ToList(),
                                                ReleaseTime = p.ReleaseTime.Value,
                                                CreateTime = p.CreateTime
                                            })
                                            .OrderByDescending(p => p.ReleaseTime)
                                            .ThenByDescending(p => p.CreateTime)
                                            .ToList();
            return new ArticlesWelfareResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), list);
        }

        public ArticlesWelfareResult GetArticlesWelfareTops(long policyId)
        {
            var list = _repositoryArticleWelfare.GetAll()
                                            .Where(p => p.ReleaseTime != null && p.ReleaseTime <= DateTime.Now && (p.DiscontinuedTime == null || p.DiscontinuedTime > DateTime.Now))
                                            .Include(p => p.Policy)
                                            .Where(p => p.Policy.State != DataState.Disabled)
                                            .Include(p => p.ArticleWelfareCodeKeywords.Where(p2 => p2.CodeKeyword.State != DataState.Disabled))
                                            .Where(p => p.State != DataState.Disabled && p.State != DataState.Delete && p.PolicyId == policyId)
                                            .Select(p => new ArticlesWelfareData 
                                            {
                                                ID = p.Id,
                                                Title = p.Title,
                                                Detail = _commonTools.GetTopsContent(p.Detail, 0),
                                                CodePolicy_ID = p.PolicyId.Value,
                                                CodePolicy_LabelName = p.Policy.LabelName,
                                                CodeKeywordList = p.ArticleWelfareCodeKeywords.Select(p2 => new CodeData 
                                                                        {
                                                                            ID = p2.CodeKeyword.Id,
                                                                            CodeName = p2.CodeKeyword.LabelName
                                                                        })
                                                                        .ToList(),
                                                ReleaseTime = p.ReleaseTime.Value
                                            })
                                            .Take(3)
                                            .ToList();
            return new ArticlesWelfareResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), list);
        }

        private List<ArticlesWelfareData> getArticlesWelfareDataList(IEnumerable<ArticleWelfare> queryList, int takeNum = 0, List<ArticlesWelfareData> currentList = null, bool isRandom = false)
        {
            var _list = new List<ArticlesWelfareData>();
            var _existIDs = new List<long>();
            if (currentList != null) 
            {
                _existIDs.AddRange(currentList.Select(p => p.ID).ToList());
            }
            var _query = queryList.Where(p => !_existIDs.Contains(p.Id))
                                .Select(p => 
                                {
                                    var _item = new ArticlesWelfareData 
                                    {
                                        ID = p.Id,
                                        Title = p.Title,
                                        Detail = p.Detail,
                                        CodePolicy_ID = p.PolicyId.Value,
                                        CodePolicy_LabelName = p.Policy.LabelName,
                                        CodeKeywordList = p.ArticleWelfareCodeKeywords.Select(p2 => new CodeData 
                                                                {
                                                                    ID = p2.CodeKeyword.Id,
                                                                    CodeName = p2.CodeKeyword.LabelName
                                                                })
                                                                .ToList(),
                                        ReleaseTime = p.ReleaseTime.Value,
                                        CreateTime = p.CreateTime
                                    };
                                    return _item;
                                });

            if (isRandom) 
            {
                Random rand = new Random();
                var ttlCount = _query.Count();
                var maxNum = ttlCount > 3 ? ttlCount - 3 : ttlCount;
                int toSkip = rand.Next(0, ttlCount);
                _list = _query.OrderBy(r => Guid.NewGuid())
                            .Skip(toSkip)
                            .Take(takeNum)
                            .ToList();
            }
            else 
            {
                _list = _query.OrderByDescending(p => p.ReleaseTime)
                            .ThenByDescending(p => p.CreateTime)
                            .Take(takeNum)
                            .ToList();
            }

            return _list;
        }

        public ArticlesWelfareResult GetArticlesWelfareRelation(long welfareID)
        {
            var welfareItem = _repositoryArticleWelfare.GetAll()
                                                .AsNoTracking()
                                                .Include(p => p.Policy)
                                                .Where(p => p.Policy.State != DataState.Disabled)
                                                .Include(p => p.ArticleWelfareCodeKeywords.Where(p2 => p2.CodeKeyword.State != DataState.Disabled))
                                                .ThenInclude(p => p.CodeKeyword)
                                                .Where(p => p.Id == welfareID)
                                                .FirstOrDefault();
            var _relationKeywords = welfareItem.ArticleWelfareCodeKeywords.Select(p => p.CodeKeywordId).ToList();

            var _query = _repositoryArticleWelfare.GetAll()
                                            .AsNoTracking()
                                            .Where(p => p.ReleaseTime != null && p.ReleaseTime <= DateTime.Now && (p.DiscontinuedTime == null || p.DiscontinuedTime > DateTime.Now))
                                            .Where(p => p.State != DataState.Disabled && 
                                                        p.State != DataState.Delete && 
                                                        p.Id != welfareItem.Id )
                                            .Include(p => p.Policy)
                                            .Where(p => p.Policy.State != DataState.Disabled)
                                            .Include(p => p.ArticleWelfareCodeKeywords.Where(p2 => p2.CodeKeyword.State != DataState.Disabled))
                                            .ThenInclude(p => p.CodeKeyword)
                                            .AsEnumerable();

            // All same.
            var _query_All = _query.Where(p => p.PolicyId == welfareItem.PolicyId &&
                                            !p.ArticleWelfareCodeKeywords.Any(p2 => !_relationKeywords.Contains(p2.CodeKeywordId)));
            // All Contains same.
            var _quer_All_Contains = _query.Where(p => p.PolicyId == welfareItem.PolicyId &&
                                            p.ArticleWelfareCodeKeywords.Any(p2 => _relationKeywords.Contains(p2.CodeKeywordId)));
            // All or
            var _query_or = _query.Where(p => p.PolicyId == welfareItem.PolicyId ||
                                        p.ArticleWelfareCodeKeywords.Any(p2 => _relationKeywords.Contains(p2.CodeKeywordId)));

            var _relationList = new List<ArticlesWelfareData>();
            const int TTLCOUNT = 3;
            var takeNum = TTLCOUNT;

            // All same.
            if (_query_All.Count() > 0 && takeNum > 0)
            {
                _relationList.AddRange(getArticlesWelfareDataList(_query_All, takeNum, currentList: _relationList));
                takeNum = takeNum - _relationList.Count();
            }

            // All Contains same.
            if (_quer_All_Contains.Count() > 0 && takeNum > 0)
            {
                _relationList.AddRange(getArticlesWelfareDataList(_quer_All_Contains, takeNum, currentList: _relationList));
                takeNum = takeNum - _relationList.Count();
            }

            // All Or.
            if (_query_or.Count() > 0 && takeNum > 0)
            {
                _relationList.AddRange(getArticlesWelfareDataList(_query_or, takeNum, currentList: _relationList));
                takeNum = takeNum - _relationList.Count();
            }

            // All random.
            if (_query.Count() > 0 && takeNum > 0) 
            {
                _relationList.AddRange(getArticlesWelfareDataList(_query, takeNum, currentList: _relationList, isRandom: true));
                takeNum = takeNum - _relationList.Count();
            }

            return new ArticlesWelfareResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), _relationList);
        }

        public ArticlesWelfareDetail GetArticlesWelfareDetail(long welfareID)
        {
            var list = _repositoryArticleWelfare.GetAll()
                                            .Where(p => p.ReleaseTime != null && p.ReleaseTime <= DateTime.Now && (p.DiscontinuedTime == null || p.DiscontinuedTime > DateTime.Now))
                                            .Include(p => p.Policy)
                                            .Where(p => p.Policy.State != DataState.Disabled)
                                            .Include(p => p.ArticleWelfareCodeKeywords.Where(p2 => p2.CodeKeyword.State != DataState.Disabled))
                                            .Where(p => p.State != DataState.Disabled && p.State != DataState.Delete && p.Id == welfareID)
                                            .Select(p => new ArticlesWelfareInfo 
                                            {
                                                ID = p.Id,
                                                Title = p.Title,
                                                Detail = p.Detail,
                                                CodePolicy_ID = p.PolicyId.Value,
                                                CodePolicy_LabelName = p.Policy.LabelName,
                                                CodeKeywordList = p.ArticleWelfareCodeKeywords.Select(p2 => new CodeData 
                                                                        {
                                                                            ID = p2.CodeKeyword.Id,
                                                                            CodeName = p2.CodeKeyword.LabelName
                                                                        })
                                                                        .ToList(),
                                                ReleaseTime = p.ReleaseTime.Value
                                            })
                                            .FirstOrDefault();
            return new ArticlesWelfareDetail(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), list);
        }
    }
}