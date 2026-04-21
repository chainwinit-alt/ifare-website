using System;
using System.Collections.Generic;
using System.Linq;
using Abp.Domain.Repositories;
using IFare_API.Common;
using IFare_API.Common.ValueModel;
using IFare_API.Constants;
using IFare_API.TaskManager.Articles.Lazy;
using IFare_API.TaskManager.Articles.Lazy.ValueModel;
using IFare_API.TaskManager.Code.ValueModel;
using Microsoft.EntityFrameworkCore;

namespace IFare_API.TaskManager.Articles.Lazy
{
    public class ArticlesLazyTaskManager : IArticlesLazyTaskManager
    {
        private readonly IRepository<ArticleLazy> _repositoryArticleLazy;
        private readonly ICommonToolsManager _commonTools;
        public ArticlesLazyTaskManager(IRepository<ArticleLazy> repositoryArticleLazy,
                                ICommonToolsManager commonTools)
        {
            _repositoryArticleLazy = repositoryArticleLazy;
            _commonTools = commonTools;
        }

        public ArticlesLazyResult GetArticlesLazyList()
        {
            var list = _repositoryArticleLazy.GetAll()
                                            .Where(p => p.ReleaseTime != null && p.ReleaseTime <= DateTime.Now && (p.DiscontinuedTime == null || p.DiscontinuedTime > DateTime.Now))
                                            .Include(p => p.Policy)
                                            .Where(p => p.Policy.State != DataState.Disabled)
                                            .Include(p => p.ArticleLazyCodeKeywords.Where(p2 => p2.CodeKeyword.State != DataState.Disabled))
                                            .Where(p => p.State != DataState.Disabled && p.State != DataState.Delete)
                                            .Select(p => new ArticlesLazyData 
                                            {
                                                ID = p.Id,
                                                Title = p.Title,
                                                CodePolicy_ID = p.PolicyId.Value,
                                                CodePolicy_LabelName = p.Policy.LabelName,
                                                CodeKeywordList = p.ArticleLazyCodeKeywords.Select(p2 => new CodeData 
                                                                        {
                                                                            ID = p2.CodeKeyword.Id,
                                                                            CodeName = p2.CodeKeyword.LabelName
                                                                        })
                                                                        .ToList(),
                                                ReleaseTime = p.ReleaseTime.Value,
                                                UpdateTime = p.UpdateTime.Value,
                                                CreateTime = p.CreateTime
                                            })
                                            .OrderByDescending(p => p.UpdateTime)
                                            .ThenByDescending(p => p.CreateTime)
                                            .ToList();
            return new ArticlesLazyResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), list);
        }

        private List<ArticlesLazyData> getArticlesWelfareDataList(IEnumerable<ArticleLazy> queryList, int takeNum = 0, List<ArticlesLazyData> currentList = null, bool isRandom = false)
        {
            var _list = new List<ArticlesLazyData>();
            var _existIDs = new List<long>();
            if (currentList != null) 
            {
                _existIDs.AddRange(currentList.Select(p => p.ID).ToList());
            }
            var _query = queryList.Where(p => !_existIDs.Contains(p.Id))
                                .Select(p => 
                                        {
                                            var _item = new ArticlesLazyData 
                                            {
                                                ID = p.Id,
                                                Title = p.Title,
                                                CodePolicy_ID = p.PolicyId.Value,
                                                CodePolicy_LabelName = p.Policy.LabelName,
                                                CodeKeywordList = p.ArticleLazyCodeKeywords.Select(p2 => new CodeData 
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

        public ArticlesLazyResult GetArticlesLazyRelation(long lazyID)
        {
            var relationKeywordIDs = _repositoryArticleLazy.GetAll()
                                                            .AsNoTracking()
                                                            .Include(p => p.ArticleLazyCodeKeywords.Where(p2 => p2.CodeKeyword.State != DataState.Disabled))
                                                            .ThenInclude(p => p.CodeKeyword)
                                                            .Where(p => p.State != DataState.Disabled && p.State != DataState.Delete && p.Id == lazyID)
                                                            .SelectMany(p => p.ArticleLazyCodeKeywords.Select(p2 => p2.CodeKeyword.Id).ToList())
                                                            .ToList();

            var _query = _repositoryArticleLazy.GetAll()
                                            .AsNoTracking()
                                            .Where(p => p.ReleaseTime != null && p.ReleaseTime <= DateTime.Now && (p.DiscontinuedTime == null || p.DiscontinuedTime > DateTime.Now))
                                            .Include(p => p.Policy)
                                            .Where(p => p.Policy.State != DataState.Disabled)
                                            .Include(p => p.ArticleLazyCodeKeywords.Where(p2 => p2.CodeKeyword.State != DataState.Disabled))
                                            .ThenInclude(p => p.CodeKeyword)
                                            .Where(p => p.State != DataState.Disabled && p.State != DataState.Delete && p.Id != lazyID)
                                            .AsEnumerable();

            // All same.
            var _query_All = _query.Where(p => !p.ArticleLazyCodeKeywords.Any(p2 => !relationKeywordIDs.Contains(p2.CodeKeywordId)));
            // All Contains same.
            var _query_Keyword = _query.Where(p => p.ArticleLazyCodeKeywords.Any(p2 => relationKeywordIDs.Contains(p2.CodeKeywordId)));

            var _relationList = new List<ArticlesLazyData>();
            const int TTLCOUNT = 3;
            var takeNum = TTLCOUNT;

            // All same.
            if (_query_All.Count() > 0 && takeNum > 0)
            {
                _relationList.AddRange(getArticlesWelfareDataList(_query_All, takeNum, currentList: _relationList));
                takeNum = takeNum - _relationList.Count();
            }

            // All Contains same.
            if (_query_Keyword.Count() > 0 && takeNum > 0)
            {
                _relationList.AddRange(getArticlesWelfareDataList(_query_Keyword, takeNum, currentList: _relationList));
                takeNum = takeNum - _relationList.Count();
            }

            // All random.
            if (_query.Count() > 0 && takeNum > 0) 
            {
                _relationList.AddRange(getArticlesWelfareDataList(_query, takeNum, isRandom: true, currentList: _relationList));
                takeNum = takeNum - _relationList.Count();
            }
            
            return new ArticlesLazyResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), _relationList);
        }

        public ArticlesLazyDetail GetArticlesLazyDetail(long lazyID)
        {
            var list = _repositoryArticleLazy.GetAll()
                                            .Where(p => p.ReleaseTime != null && p.ReleaseTime <= DateTime.Now && (p.DiscontinuedTime == null || p.DiscontinuedTime > DateTime.Now))
                                            .Include(p => p.Policy)
                                            .Where(p => p.Policy.State != DataState.Disabled)
                                            .Include(p => p.ArticleLazyImages)
                                            .ThenInclude(p => p.Images)
                                            .Include(p => p.ArticleLazyCodeKeywords.Where(p2 => p2.CodeKeyword.State != DataState.Disabled))
                                            .Where(p => p.State != DataState.Disabled && p.State != DataState.Delete && p.Id == lazyID)
                                            .Select(p => new ArticlesLazyInfo 
                                            {
                                                ID = p.Id,
                                                Title = p.Title,
                                                ImageList = p.ArticleLazyImages.Select(p2 => new ImageInfo
                                                                                    {
                                                                                        ImagePath = p2.Images.ImagePath,
                                                                                        ImageName = p2.Images.ImageName,
                                                                                        ImageExtension = p2.Images.ImageNameExtension
                                                                                    })
                                                                                    .ToList(),
                                                CodePolicy_ID = p.PolicyId.Value,
                                                CodePolicy_LabelName = p.Policy.LabelName,
                                                CodeKeywordList = p.ArticleLazyCodeKeywords.Select(p2 => new CodeData 
                                                                        {
                                                                            ID = p2.CodeKeyword.Id,
                                                                            CodeName = p2.CodeKeyword.LabelName
                                                                        })
                                                                        .ToList(),
                                                ReleaseTime = p.ReleaseTime.Value
                                            })
                                            .FirstOrDefault();
            return new ArticlesLazyDetail(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), list);
        }
    }
}