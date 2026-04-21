using System.Threading.Tasks;
using Abp;
using IFare_BDAPI.TaskManager.Personal;
using IFare_BDAPI.Personal.Dto;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IFare_BDAPI.Common.Dto;
using IFare_BDAPI.TaskManager.Personal.ValueModel;
using Microsoft.AspNetCore.Http;
using System.Linq;
using System.Security.Claims;
using System;

namespace IFare_BDAPI.Personal
{
    [Authorize(Policy = "JwtAuth")]
    [IgnoreAntiforgeryToken]
    public class PersonalAppService : AbpServiceBase, IPersonalAppService
    {
        private readonly IPersonalTaskManager _personalTask;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public PersonalAppService(IPersonalTaskManager personalTask, IHttpContextAccessor httpContextAccessor) 
        {
            _personalTask = personalTask;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<PersonalResultDto> GetPersonalInfo()
        {
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            var result = _personalTask.GetPersonalInfo(Convert.ToInt64(userID));
            return ObjectMapper.Map<PersonalResultDto>(result);
        }

        [HttpPost]
        public async Task<ErrorInfoBaseDto> UpdatePersonalInfo(PersonalReqDto personalReq)
        {
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            var _updateData = ObjectMapper.Map<PersonalReq>(personalReq);
            _updateData.UpdateUserID = Convert.ToInt64(userID);
            var result = _personalTask.UpdatePersonalInfo(_updateData);
            
            return ObjectMapper.Map<ErrorInfoBaseDto>(result);
        }

        [HttpPost]
        public async Task<ErrorInfoBaseDto> UpdatePersonalPwd(PersonalReqDto personalReq)
        {
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            var _updateData = ObjectMapper.Map<PersonalReq>(personalReq);
            _updateData.UpdateUserID = Convert.ToInt64(userID);
            var result = _personalTask.UpdatePersonalPwd(_updateData);
            
            return ObjectMapper.Map<ErrorInfoBaseDto>(result);
        }

        // public async Task<ErrorInfoBaseDto> SetChangePwd()
        // {

        // }
    }
}