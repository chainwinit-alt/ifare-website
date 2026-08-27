using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Abp;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using IFare_BDAPI.Chatbot.Card.Dto;
using IFare_BDAPI.Common.Dto;
using IFare_BDAPI.TaskManager.Chatbot.Card;
using IFare_BDAPI.TaskManager.Chatbot.Card.ValueModel;

namespace IFare_BDAPI.Chatbot.Card
{
    /// <summary>
    /// 芒寶答案卡維護。內容由基金會人員撰寫，聊天機器人只負責挑選卡片、不改寫文字。
    /// </summary>
    [Authorize(Policy = "JwtAuth")]
    [IgnoreAntiforgeryToken]
    public class ChatbotCardAppService : AbpServiceBase, IChatbotCardAppService
    {
        private readonly IChatbotCardTaskManager _chatbotCardTaskManager;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ChatbotCardAppService(IChatbotCardTaskManager chatbotCardTaskManager, IHttpContextAccessor httpContextAccessor)
        {
            _chatbotCardTaskManager = chatbotCardTaskManager;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<ChatbotCardResultDto> GetDataList(ChatbotCardFilterParamDto param)
        {
            var _param = ObjectMapper.Map<ChatbotCardFilterParam>(param);
            var result = _chatbotCardTaskManager.GetDataList(_param);
            return ObjectMapper.Map<ChatbotCardResultDto>(result);
        }

        [TypeFilter(typeof(Filter.IsEditorCheckerFilter))]
        [HttpPost]
        public async Task<ErrorInfoBaseDto> InsertChatbotCard(ChatbotCardInsertDataDto insertData)
        {
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            var _insertData = ObjectMapper.Map<ChatbotCardInsertData>(insertData);
            _insertData.CreateUserID = Convert.ToInt64(userID);
            var result = _chatbotCardTaskManager.InsertChatbotCard(_insertData);
            return ObjectMapper.Map<ErrorInfoBaseDto>(result);
        }

        [TypeFilter(typeof(Filter.IsEditorCheckerFilter))]
        [HttpPost]
        public async Task<ErrorInfoBaseDto> UpdateChatbotCard(ChatbotCardEditorDataDto editorData)
        {
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            var _editorData = ObjectMapper.Map<ChatbotCardEditorData>(editorData);
            _editorData.UpdateUserID = Convert.ToInt64(userID);
            var result = _chatbotCardTaskManager.UpdateChatbotCard(_editorData);
            return ObjectMapper.Map<ErrorInfoBaseDto>(result);
        }

        [TypeFilter(typeof(Filter.IsEditorCheckerFilter))]
        [HttpPost]
        public async Task<ErrorInfoBaseDto> DeleteChatbotCard(ChatbotCardDeleteDataDto deleteData)
        {
            var userID = _httpContextAccessor.HttpContext.User.Claims.First(i => i.Type == ClaimTypes.Sid).Value;
            var _deleteData = ObjectMapper.Map<ChatbotCardDeleteData>(deleteData);
            _deleteData.UpdateUserID = Convert.ToInt64(userID);
            var result = _chatbotCardTaskManager.DeleteChatbotCard(_deleteData);
            return ObjectMapper.Map<ErrorInfoBaseDto>(result);
        }
    }
}
