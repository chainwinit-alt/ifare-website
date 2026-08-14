using Abp.Domain.Services;
using IFare_API.TaskManager.Chatbot.Card.ValueModel;

namespace IFare_API.TaskManager.Chatbot.Card
{
    public interface IChatbotCardTaskManager : IDomainService
    {
        ChatbotCardResult GetEnabledCards();
    }
}
