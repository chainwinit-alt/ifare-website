using System.Threading.Tasks;
using Abp;
using IFare_BDAPI.TaskManager.Code.Keyword;
using IFare_BDAPI.Code.Dto;
using Microsoft.AspNetCore.Authorization;
using IFare_BDAPI.TaskManager.Code.ValueModel;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using IFare_BDAPI.Common.Dto;
using System.Linq;
using System.Security.Claims;
using System;

namespace IFare_BDAPI.Code.Keyword
{
    [Authorize(Policy = "JwtAuth")]
    [IgnoreAntiforgeryToken]
    public class CodeKeywordAppService : AbpServiceBase, ICodeKeywordAppService
    {
        private readonly ICodeKeywordTaskManager _codeKeywordTaskManager;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public CodeKeywordAppService(ICodeKeywordTaskManager codeKeywordTaskManager, IHttpContextAccessor httpContextAccessor) 
        {
            _codeKeywordTaskManager = codeKeywordTaskManager;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<CodeResultDto> GetDataList(CodeFilterParamDto param) 
        {
            var _param = ObjectMapper.Map<CodeFilterParam>(param);
            var result = _codeKeywordTaskManager.GetDataList(_param);
            return ObjectMapper.Map<CodeResultDto>(result);
        }

        [HttpPost]
        public async Task<ErrorInfoBaseDto> InsertCodeKeyword(CodeInsertDataDto insertData)
        {
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            var _insertData = ObjectMapper.Map<CodeInsertData>(insertData);
            _insertData.CreateUserID = Convert.ToInt64(userID);
            var result = _codeKeywordTaskManager.InsertCodeKeyword(_insertData);
            return ObjectMapper.Map<ErrorInfoBaseDto>(result);
        }

        [HttpPost]
        public async Task<ErrorInfoBaseDto> UpdateCodeKeyword(CodeEditorDataDto editorData)
        {
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            var _editorData = ObjectMapper.Map<CodeEditorData>(editorData);
            _editorData.UpdateUserID = Convert.ToInt64(userID);
            var result = _codeKeywordTaskManager.UpdateCodeKeyword(_editorData);
            return ObjectMapper.Map<ErrorInfoBaseDto>(result);
        }
    }
}