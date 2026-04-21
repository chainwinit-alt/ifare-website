using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Abp;
using IFare_BDAPI.Code.Dto;
using IFare_BDAPI.Common.Dto;
using IFare_BDAPI.TaskManager.Code.Income;
using IFare_BDAPI.TaskManager.Code.ValueModel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace IFare_BDAPI.Code.Income
{
    [Authorize(Policy = "JwtAuth")]
    [IgnoreAntiforgeryToken]
    public class CodeIncomeAppService : AbpServiceBase, ICodeIncomeAppService
    {
        private readonly ICodeIncomeTaskManager _codeIncomeTaskManager;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public CodeIncomeAppService(ICodeIncomeTaskManager codeIncomeTaskManager, IHttpContextAccessor httpContextAccessor) 
        {
            _codeIncomeTaskManager = codeIncomeTaskManager;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<CodeResultDto> GetDataList(CodeFilterParamDto param) 
        {
            var _param = ObjectMapper.Map<CodeFilterParam>(param);
            var result = _codeIncomeTaskManager.GetDataList(_param);
            return ObjectMapper.Map<CodeResultDto>(result);
        }

        [HttpPost]
        public async Task<ErrorInfoBaseDto> InsertCodeIncome(CodeInsertDataDto insertData)
        {
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            var _insertData = ObjectMapper.Map<CodeInsertData>(insertData);
            _insertData.CreateUserID = Convert.ToInt64(userID);
            var result = _codeIncomeTaskManager.InsertCodeIncome(_insertData);
            return ObjectMapper.Map<ErrorInfoBaseDto>(result);
        }

        [HttpPost]
        public async Task<ErrorInfoBaseDto> UpdateCodeIncome(CodeEditorDataDto editorData)
        {
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            var _editorData = ObjectMapper.Map<CodeEditorData>(editorData);
            _editorData.UpdateUserID = Convert.ToInt64(userID);
            var result = _codeIncomeTaskManager.UpdateCodeIncome(_editorData);
            return ObjectMapper.Map<ErrorInfoBaseDto>(result);
        }
    }
}