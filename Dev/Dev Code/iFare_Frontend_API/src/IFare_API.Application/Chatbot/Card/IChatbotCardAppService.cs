using System.Threading.Tasks;
using Abp.Application.Services;
using IFare_API.Chatbot.Card.Dto;

namespace IFare_API.Chatbot.Card
{
    public interface IChatbotCardAppService : IApplicationService
    {
        Task<ChatbotCardResultDto> GetEnabledCards();
    }
}
