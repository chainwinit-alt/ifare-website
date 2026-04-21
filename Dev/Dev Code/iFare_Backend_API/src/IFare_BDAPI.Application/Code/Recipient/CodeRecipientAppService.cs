using System.Threading.Tasks;
using Abp;
using IFare_BDAPI.TaskManager.Code.Recipient;
using IFare_BDAPI.Code.Dto;
using Microsoft.AspNetCore.Authorization;
using IFare_BDAPI.TaskManager.Code.ValueModel;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using IFare_BDAPI.Common.Dto;
using System.Linq;
using System.Security.Claims;
using System;

namespace IFare_BDAPI.Code.Recipient
{
    [Authorize(Policy = "JwtAuth")]
    [IgnoreAntiforgeryToken]
    public class CodeRecipientAppService : AbpServiceBase, ICodeRecipientAppService
    {
        private readonly ICodeRecipientTaskManager _codeRecipientTaskManager;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public CodeRecipientAppService(ICodeRecipientTaskManager codeRecipientTaskManager, IHttpContextAccessor httpContextAccessor) 
        {
            _codeRecipientTaskManager = codeRecipientTaskManager;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<CodeResultDto> GetDataList(CodeFilterParamDto param) 
        {
            var _param = ObjectMapper.Map<CodeFilterParam>(param);
            var result = _codeRecipientTaskManager.GetDataList(_param);
            return ObjectMapper.Map<CodeResultDto>(result);
        }

        [HttpPost]
        public async Task<ErrorInfoBaseDto> InsertCodeRecipient(CodeInsertDataDto insertData)
        {
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            var _insertData = ObjectMapper.Map<CodeInsertData>(insertData);
            _insertData.CreateUserID = Convert.ToInt64(userID);
            var result = _codeRecipientTaskManager.InsertCodeRecipient(_insertData);
            return ObjectMapper.Map<ErrorInfoBaseDto>(result);
        }

        [HttpPost]
        public async Task<ErrorInfoBaseDto> UpdateCodeRecipient(CodeEditorDataDto editorData)
        {
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            var _editorData = ObjectMapper.Map<CodeEditorData>(editorData);
            _editorData.UpdateUserID = Convert.ToInt64(userID);
            var result = _codeRecipientTaskManager.UpdateCodeRecipient(_editorData);
            return ObjectMapper.Map<ErrorInfoBaseDto>(result);
        }
    }
}