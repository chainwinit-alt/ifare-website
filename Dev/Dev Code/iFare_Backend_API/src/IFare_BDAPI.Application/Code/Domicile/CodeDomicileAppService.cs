using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Abp;
using IFare_BDAPI.Code.Dto;
using IFare_BDAPI.Common.Dto;
using IFare_BDAPI.TaskManager.Code.Domicile;
using IFare_BDAPI.TaskManager.Code.ValueModel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace IFare_BDAPI.Code.Domicile
{
    [Authorize(Policy = "JwtAuth")]
    [IgnoreAntiforgeryToken]
    public class CodeDomicileAppService : AbpServiceBase, ICodeDomicileAppService
    {
        private readonly ICodeDomicileTaskManager _codeDomicileTaskManager;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public CodeDomicileAppService(ICodeDomicileTaskManager codeDomicileTaskManager, IHttpContextAccessor httpContextAccessor) 
        {
            _codeDomicileTaskManager = codeDomicileTaskManager;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<CodeResultDto> GetDataList(CodeFilterParamDto param) 
        {
            var _param = ObjectMapper.Map<CodeFilterParam>(param);
            var result = _codeDomicileTaskManager.GetDataList(_param);
            return ObjectMapper.Map<CodeResultDto>(result);
        }

        [HttpPost]
        public async Task<ErrorInfoBaseDto> InsertCodeDomicile(CodeInsertDataDto insertData)
        {
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            var _insertData = ObjectMapper.Map<CodeInsertData>(insertData);
            _insertData.CreateUserID = Convert.ToInt64(userID);
            var result = _codeDomicileTaskManager.InsertCodeDomicile(_insertData);
            return ObjectMapper.Map<ErrorInfoBaseDto>(result);
        }

        [HttpPost]
        public async Task<ErrorInfoBaseDto> UpdateCodeDomicile(CodeEditorDataDto editorData)
        {
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            var _editorData = ObjectMapper.Map<CodeEditorData>(editorData);
            _editorData.UpdateUserID = Convert.ToInt64(userID);
            var result = _codeDomicileTaskManager.UpdateCodeDomicile(_editorData);
            return ObjectMapper.Map<ErrorInfoBaseDto>(result);
        }
    }
}