using System.Linq;
using Abp.Domain.Repositories;
using IFare_API.Common;
using IFare_API.Constants;
using IFare_API.TaskManager.Chatbot.Card.ValueModel;

namespace IFare_API.TaskManager.Chatbot.Card
{
    public class ChatbotCardTaskManager : IChatbotCardTaskManager
    {
        private readonly IRepository<ChatbotCard> _repositoryChatbotCard;
        private readonly ICommonToolsManager _commonTools;

        public ChatbotCardTaskManager(IRepository<ChatbotCard> repositoryChatbotCard,
                                      ICommonToolsManager commonTools)
        {
            _repositoryChatbotCard = repositoryChatbotCard;
            _commonTools = commonTools;
        }

        public ChatbotCardResult GetEnabledCards()
        {
            var list = _repositoryChatbotCard.GetAll()
                                    .Where(p => p.State != DataState.Disabled && p.State != DataState.Delete)
                                    .OrderBy(p => p.Sort)
                                    .Select(p => new ChatbotCardData
                                    {
                                        Id = p.CardKey,
                                        Title = p.Title,
                                        Keywords = p.Keywords,
                                        Answer = p.Answer,
                                        LinkKeys = p.LinkKeys,
                                        Priority = p.Priority,
                                        Sort = p.Sort
                                    })
                                    .ToList();
            return new ChatbotCardResult(_commonTools.GetErrorInfo_API(ErrAPI.Code_Success), list);
        }
    }
}
