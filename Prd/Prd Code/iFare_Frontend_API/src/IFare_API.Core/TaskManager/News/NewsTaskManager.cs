using System;
using System.Linq;
using System.Web;
using Abp.Domain.Repositories;
using IFare_API.Common;
using IFare_API.Constants;
using IFare_API.TaskManager.Code.ValueModel;
using IFare_API.TaskManager.News.ValueModel;

namespace IFare_API.TaskManager.News
{
    public class NewsTaskManager : INewsTaskManager
    {
        private readonly IRepository<IFare_API.News> _repositoryNews;
        private readonly ICommonToolsManager _commonTools;
        public NewsTaskManager(IRepository<IFare_API.News> repositoryNews,
                                ICommonToolsManager commonTools)
        {
            _repositoryNews = repositoryNews;
            _commonTools = commonTools;
        }

        public NewsResult GetNewsList()
        {
            var list = _repositoryNews.GetAll()
                                    .Where(p => p.ReleaseTime != null && p.ReleaseTime <= DateTime.Now && (p.DiscontinuedTime == null || p.DiscontinuedTime > DateTime.Now))
                                    .Where(p => p.State != DataState.Disabled && p.State != DataState.Delete)
                                    .Select(p => new NewsData 
                                    {
                                        ID = p.Id,
                                        Title = p.Title,
                                        Content = _commonTools.GetTopsContent(p.Detail, 0),
                                        ReleaseTime = p.ReleaseTime.Value
                                    })
                                    .OrderByDescending(p => p.ReleaseTime)
                                    .ToList();
            return new NewsResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), list);
        }

        public NewsResult GetNewsTops()
        {
            var list = _repositoryNews.GetAll()
                                    .Where(p => p.ReleaseTime != null && p.ReleaseTime <= DateTime.Now && (p.DiscontinuedTime == null || p.DiscontinuedTime > DateTime.Now))
                                    .Where(p => p.State != DataState.Disabled && p.State != DataState.Delete)
                                    .Select(p => new NewsData 
                                    {
                                        ID = p.Id,
                                        Title = p.Title,
                                        Content = _commonTools.GetTopsContent(p.Detail, 100),
                                        ReleaseTime = p.ReleaseTime.Value
                                    })
                                    .OrderByDescending(p => p.ReleaseTime)
                                    .Take(3)
                                    .ToList();
            return new NewsResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), list);
        }

        public NewsResult GetNewsDetail(long newsID) 
        {
            var list = _repositoryNews.GetAll()
                                    .Where(p => p.ReleaseTime != null && p.ReleaseTime <= DateTime.Now && (p.DiscontinuedTime == null || p.DiscontinuedTime > DateTime.Now))
                                    .Where(p => p.State != DataState.Disabled && p.State != DataState.Delete && p.Id == newsID)
                                    .Select(p => new NewsData 
                                    {
                                        ID = p.Id,
                                        Title = p.Title,
                                        Content = p.Detail,
                                        ReleaseTime = p.ReleaseTime.Value
                                    })
                                    .OrderByDescending(p => p.ReleaseTime)
                                    .Take(3)
                                    .ToList();
            return new NewsResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), list);
        }
    }
}