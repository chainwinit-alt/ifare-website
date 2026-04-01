using System.Threading.Tasks;
using Abp.Domain.Repositories;
using Abp;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IFare_BDAPI.Fare.QA.Dto;
using IFare_BDAPI.TaskManager.Fare.QA;
using IFare_BDAPI.TaskManager.Fare.QA.ValueModel;
using IFare_BDAPI.Common.Dto;
using Microsoft.AspNetCore.Http;
using System.Linq;
using System.Security.Claims;
using System;

namespace IFare_BDAPI.Fare.QA
{
    [Authorize(Policy = "JwtAuth")]
    [IgnoreAntiforgeryToken]
    public class FareQAAppService : AbpServiceBase, IFareQAAppService
    {
        private readonly IFareQATaskManager _fareQATaskManager;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public FareQAAppService(IFareQATaskManager fareQATaskManager, IHttpContextAccessor httpContextAccessor) 
        {
            _fareQATaskManager = fareQATaskManager;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<FareQAResultDto> GetDataList(FareQAFilterParamDto param)
        {
            var _param = ObjectMapper.Map<FareQAFilterParam>(param);
            var result = _fareQATaskManager.GetDataList(_param);
            return ObjectMapper.Map<FareQAResultDto>(result);
        }

        [HttpPost]
        public async Task<ErrorInfoBaseDto> InsertFareQA(FareQAInsertDataDto insertData)
        {
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            var _insertData = ObjectMapper.Map<FareQAInsertData>(insertData);
            _insertData.CreateUserID = Convert.ToInt64(userID);
            var result = _fareQATaskManager.InsertFareQA(_insertData);
            return ObjectMapper.Map<ErrorInfoBaseDto>(result);
        }

        [HttpPost]
        public async Task<ErrorInfoBaseDto> UpdateFareQA(FareQAEditorDataDto editorData)
        {
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            var _editorData = ObjectMapper.Map<FareQAEditorData>(editorData);
            _editorData.UpdateUserID = Convert.ToInt64(userID);
            var result = _fareQATaskManager.UpdateFareQA(_editorData);
            return ObjectMapper.Map<ErrorInfoBaseDto>(result);
        }

        [HttpPost]
        public async Task<ErrorInfoBaseDto> DeleteFareQA(FareQADeleteDataDto deleteData)
        {
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            var _deleteData = ObjectMapper.Map<FareQADeleteData>(deleteData);
            _deleteData.UpdateUserID = Convert.ToInt64(userID);
            var result = _fareQATaskManager.DeleteFareQA(_deleteData);
            return ObjectMapper.Map<ErrorInfoBaseDto>(result);
        }
    }
}