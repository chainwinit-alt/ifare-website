using System.Threading.Tasks;
using Abp.Domain.Repositories;
using Abp;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IFare_BDAPI.TaskManager.Articles.Welfare;
using IFare_BDAPI.Articles.Welfare.Dto;
using IFare_BDAPI.TaskManager.Articles.Welfare.ValueModel;
using Abp.Domain.Uow;
using IFare_BDAPI.Common.Dto;
using Microsoft.AspNetCore.Http;
using System.Linq;
using System.Security.Claims;
using System;

namespace IFare_BDAPI.Articles.Welfare
{
    [Authorize(Policy = "JwtAuth")]
    [IgnoreAntiforgeryToken]
    public class ArticlesWelfareAppService : AbpServiceBase, IArticlesWelfareAppService
    {
        private readonly IArticlesWelfareTaskManager _articlesWelfareTaskManager;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public ArticlesWelfareAppService(IArticlesWelfareTaskManager articlesWelfareTaskManager, IHttpContextAccessor httpContextAccessor)
        {
            _articlesWelfareTaskManager = articlesWelfareTaskManager;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<ArticlesWelfareResultDto> GetDataList(ArticlesWelfareFilterParamDto param)
        {
            var _param = ObjectMapper.Map<ArticlesWelfareFilterParam>(param);
            var result = _articlesWelfareTaskManager.GetDataList(_param);
            return ObjectMapper.Map<ArticlesWelfareResultDto>(result);
        }

        [HttpPost]
        [UnitOfWork(isTransactional: false)]
        public async Task<ErrorInfoBaseDto> InsertArticlesWelfare(ArticlesWelfareInsertDataDto insertData)
        {
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            var _insertData = ObjectMapper.Map<ArticlesWelfareInsertData>(insertData);
            _insertData.CreateUserID = Convert.ToInt64(userID);
            var result = _articlesWelfareTaskManager.InsertArticlesWelfare(_insertData);
            return ObjectMapper.Map<ErrorInfoBaseDto>(result);
        }
        
        [HttpPost]
        [UnitOfWork(isTransactional: false)]
        public async Task<ErrorInfoBaseDto> UpdateArticlesWelfare(ArticlesWelfareEditorDataDto editorData)
        {
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            var _editorData = ObjectMapper.Map<ArticlesWelfareEditorData>(editorData);
            _editorData.UpdateUserID = Convert.ToInt64(userID);
            var result = _articlesWelfareTaskManager.UpdateArticlesWelfare(_editorData);
            return ObjectMapper.Map<ErrorInfoBaseDto>(result);
        }

        [HttpPost]
        public async Task<ErrorInfoBaseDto> DeleteArticlesWelfare(ArticlesWelfareDeleteDataDto deleteData)
        {
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            var _deleteData = ObjectMapper.Map<ArticlesWelfareDeleteData>(deleteData);
            _deleteData.UpdateUserID = Convert.ToInt64(userID);
            var result = _articlesWelfareTaskManager.DeleteArticlesWelfare(_deleteData);
            return ObjectMapper.Map<ErrorInfoBaseDto>(result);
        }
    }
}