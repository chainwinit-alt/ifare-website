using System.Threading.Tasks;
using Abp.Domain.Repositories;
using Abp;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IFare_BDAPI.Articles.Lazy.Dto;
using IFare_BDAPI.TaskManager.Articles.Lazy;
using IFare_BDAPI.TaskManager.Articles.Lazy.ValueModel;
using Abp.Domain.Uow;
using IFare_BDAPI.Common.Dto;
using Microsoft.AspNetCore.Http;
using System.Linq;
using System.Security.Claims;
using System;

namespace IFare_BDAPI.Articles.Lazy
{
    [Authorize(Policy = "JwtAuth")]
    [IgnoreAntiforgeryToken]
    public class ArticlesLazyAppService : AbpServiceBase, IArticlesLazyAppService
    {
        private readonly IArticlesLazyTaskManager _articlesLazyTaskManager;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public ArticlesLazyAppService(IArticlesLazyTaskManager articlesLazyTaskManager, IHttpContextAccessor httpContextAccessor) 
        {
            _articlesLazyTaskManager = articlesLazyTaskManager;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<ArticlesLazyResultDto> GetDataList(ArticlesLazyFilterParamDto param)
        {
            var _param = ObjectMapper.Map<ArticlesLazyFilterParam>(param);
            var result = _articlesLazyTaskManager.GetDataList(_param);
            return ObjectMapper.Map<ArticlesLazyResultDto>(result);
        }

        [HttpPost]
        [UnitOfWork(isTransactional: false)]
        public async Task<ErrorInfoBaseDto> InsertArticlesLazy(ArticlesLazyInsertDataDto insertData)
        {
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            var _insertData = ObjectMapper.Map<ArticlesLazyInsertData>(insertData);
            _insertData.CreateUserID = Convert.ToInt64(userID);
            var result = _articlesLazyTaskManager.InsertArticlesLazy(_insertData);
            return ObjectMapper.Map<ErrorInfoBaseDto>(result);
        }

        [HttpPost]
        [UnitOfWork(isTransactional: false)]
        public async Task<ErrorInfoBaseDto> UpdateArticlesLazy(ArticlesLazyEditorDataDto editorData)
        {
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            var _editorData = ObjectMapper.Map<ArticlesLazyEditorData>(editorData);
            _editorData.UpdateUserID = Convert.ToInt64(userID);
            var result = _articlesLazyTaskManager.UpdateArticlesLazy(_editorData);
            return ObjectMapper.Map<ErrorInfoBaseDto>(result);
        }

        [HttpPost]
        public async Task<ErrorInfoBaseDto> DeleteArticlesLazy(ArticlesLazyDeleteDataDto deleteData)
        {
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            var _deleteData = ObjectMapper.Map<ArticlesLazyDeleteData>(deleteData);
            _deleteData.UpdateUserID = Convert.ToInt64(userID);
            var result = _articlesLazyTaskManager.DeleteArticlesLazy(_deleteData);
            return ObjectMapper.Map<ErrorInfoBaseDto>(result);
        }
    }
}