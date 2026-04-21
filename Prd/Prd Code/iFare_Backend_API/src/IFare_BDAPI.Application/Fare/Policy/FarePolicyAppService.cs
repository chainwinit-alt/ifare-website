using System.Threading.Tasks;
using Abp;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IFare_BDAPI.Fare.Policy.Dto;
using IFare_BDAPI.TaskManager.Fare.Policy;
using IFare_BDAPI.TaskManager.Fare.Policy.ValueModel;
using Abp.Domain.Uow;
using IFare_BDAPI.Common.Dto;
using Microsoft.AspNetCore.Http;
using System.Linq;
using System.Security.Claims;
using System;

namespace IFare_BDAPI.Fare.Policy
{
    [Authorize(Policy = "JwtAuth")]
    [IgnoreAntiforgeryToken]
    public class FarePolicyAppService : AbpServiceBase, IFarePolicyAppService
    {
        private readonly IFarePolicyTaskManager _farePolicyTaskManager;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public FarePolicyAppService(IFarePolicyTaskManager farePolicyTaskManager, IHttpContextAccessor httpContextAccessor) 
        {
            _farePolicyTaskManager = farePolicyTaskManager;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<FarePolicyResultDto> GetDataList(FarePolicyFilterParamDto param)
        {
            var _param = ObjectMapper.Map<FarePolicyFilterParam>(param);
            var result = _farePolicyTaskManager.GetDataList(_param);
            return ObjectMapper.Map<FarePolicyResultDto>(result);
        }

        [HttpPost]
        [UnitOfWork(isTransactional: false)]
        public async Task<ErrorInfoBaseDto> InsertFarePolicy(FarePolicyInsertDataDto insertData)
        {
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            var _insertData = ObjectMapper.Map<FarePolicyInsertData>(insertData);
            _insertData.CreateUserID = Convert.ToInt64(userID);
            var result = _farePolicyTaskManager.InsertFarePolicy(_insertData);
            return ObjectMapper.Map<ErrorInfoBaseDto>(result);
        }

        [HttpPost]
        [UnitOfWork(isTransactional: false)]
        public async Task<ErrorInfoBaseDto> UpdateFarePolicy(FarePolicyEditorDataDto editorData)
        {
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            var _editorData = ObjectMapper.Map<FarePolicyEditorData>(editorData);
            _editorData.UpdateUserID = Convert.ToInt64(userID);
            var result = _farePolicyTaskManager.UpdateFarePolicy(_editorData);
            return ObjectMapper.Map<ErrorInfoBaseDto>(result);
        }

        [HttpPost]
        public async Task<ErrorInfoBaseDto> DeleteFarePolicy(FarePolicyDeleteDataDto deleteData)
        {
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            var _deleteData = ObjectMapper.Map<FarePolicyDeleteData>(deleteData);
            _deleteData.UpdateUserID = Convert.ToInt64(userID);
            var result = _farePolicyTaskManager.DeleteFarePolicy(_deleteData);
            return ObjectMapper.Map<ErrorInfoBaseDto>(result);
        }
    }
}