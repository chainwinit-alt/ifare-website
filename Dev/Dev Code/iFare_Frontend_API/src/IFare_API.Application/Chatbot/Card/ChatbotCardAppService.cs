using System.Threading.Tasks;
using Abp;
using IFare_API.Chatbot.Card.Dto;
using IFare_API.TaskManager.Chatbot.Card;

namespace IFare_API.Chatbot.Card
{
    /// <summary>
    /// 供前台聊天機器人取用啟用中的芒寶答案卡。
    /// 對應 Nuxt server route：server/utils/chatbot/cardStore.ts
    /// </summary>
    public class ChatbotCardAppService : AbpServiceBase, IChatbotCardAppService
    {
        private readonly IChatbotCardTaskManager _taskManager;

        public ChatbotCardAppService(IChatbotCardTaskManager taskManager)
        {
            _taskManager = taskManager;
        }

        public async Task<ChatbotCardResultDto> GetEnabledCards()
        {
            var result = _taskManager.GetEnabledCards();
            return ObjectMapper.Map<ChatbotCardResultDto>(result);
        }
    }
}
