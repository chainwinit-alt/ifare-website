using System.Threading.Tasks;
using Abp;
using IFare_BDAPI.TaskManager.News;
using IFare_BDAPI.News.Dto;
using IFare_BDAPI.TaskManager.News.ValueModel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IFare_BDAPI.Common.Dto;
using Microsoft.AspNetCore.Http;
using System.Linq;
using System.Security.Claims;
using System;

namespace IFare_BDAPI.News
{
    [Authorize(Policy = "JwtAuth")]
    [IgnoreAntiforgeryToken]
    public class NewsAppService : AbpServiceBase, INewsAppService
    {
        private readonly INewsTaskManager _newsTaskManager;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public NewsAppService(INewsTaskManager newsTaskManager, IHttpContextAccessor httpContextAccessor) 
        {
            _newsTaskManager = newsTaskManager;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<NewsResultDto> GetDataList(NewsFilterParamDto param)
        {
            var _param = ObjectMapper.Map<NewsFilterParam>(param);
            var result = _newsTaskManager.GetDataList(_param);
            return ObjectMapper.Map<NewsResultDto>(result);
        }

        [HttpPost]
        public async Task<ErrorInfoBaseDto> InsertNews(NewsInsertDataDto insertData)
        {
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            var _insertData = ObjectMapper.Map<NewsInsertData>(insertData);
            _insertData.CreateUserID = Convert.ToInt64(userID);
            var result = _newsTaskManager.InsertNews(_insertData);
            return ObjectMapper.Map<ErrorInfoBaseDto>(result);
        }

        [HttpPost]
        public async Task<ErrorInfoBaseDto> UpdateNews(NewsEditorDataDto editorData)
        {
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            var _editorData = ObjectMapper.Map<NewsEditorData>(editorData);
            _editorData.UpdateUserID = Convert.ToInt64(userID);
            var result = _newsTaskManager.UpdateNews(_editorData);
            return ObjectMapper.Map<ErrorInfoBaseDto>(result);
        }

        [HttpPost]
        public async Task<ErrorInfoBaseDto> DeleteNews(NewsDeleteDataDto deleteData)
        {
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            var _deleteData = ObjectMapper.Map<NewsDeleteData>(deleteData);
            _deleteData.UpdateUserID = Convert.ToInt64(userID);
            var result = _newsTaskManager.DeleteNews(_deleteData);
            return ObjectMapper.Map<ErrorInfoBaseDto>(result);
        }
    }
}