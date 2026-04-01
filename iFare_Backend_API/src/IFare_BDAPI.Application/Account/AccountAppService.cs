using System.Threading.Tasks;
using Abp.Domain.Repositories;
using Abp;
using IFare_BDAPI.Account.Dto;
using IFare_BDAPI.TaskManager.Account;
using IFare_BDAPI.TaskManager.Account.ValueModel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IFare_BDAPI.Common.Dto;
using Microsoft.AspNetCore.Http;
using System.Linq;
using System.Security.Claims;
using System;

namespace IFare_BDAPI.Account
{
    [Authorize(Policy = "JwtAuth")]
    [IgnoreAntiforgeryToken]
    public class AccountAppService : AbpServiceBase, IAccountAppService
    {
        private readonly IAccountTaskManager _accountTaskManager;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public AccountAppService(IAccountTaskManager accountTaskManager, IHttpContextAccessor httpContextAccessor) 
        {
            _accountTaskManager = accountTaskManager;
            _httpContextAccessor = httpContextAccessor;
        }

        [TypeFilter(typeof(Filter.IsEditorCheckerFilter))]
        public async Task<AccountResultDto> GetAccountList(AccountFilterParamDto param)
        {
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            var _param = ObjectMapper.Map<AccountFilterParam>(param);
            var result = _accountTaskManager.GetAccountList(_param, Convert.ToInt64(userID));
            return ObjectMapper.Map<AccountResultDto>(result);
        }

        [TypeFilter(typeof(Filter.IsEditorCheckerFilter))]
        [HttpPost]
        public async Task<ErrorInfoBaseDto> InsertAccount(AccountInsertDataDto insertData)
        {
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            var _insertData = ObjectMapper.Map<AccountInsertData>(insertData);
            _insertData.CreateUserID = Convert.ToInt64(userID);
            var result = _accountTaskManager.InsertAccount(_insertData);
            return ObjectMapper.Map<ErrorInfoBaseDto>(result);
        }

        [TypeFilter(typeof(Filter.IsEditorCheckerFilter))]
        [HttpPost]
        public async Task<ErrorInfoBaseDto> UpdateAccount(AccountEditorDataDto editorData)
        {
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            var _editorData = ObjectMapper.Map<AccountEditorData>(editorData);
            _editorData.UpdateUserID = Convert.ToInt64(userID);
            var result = _accountTaskManager.UpdateAccount(_editorData);
            return ObjectMapper.Map<ErrorInfoBaseDto>(result);
        }
    }
}