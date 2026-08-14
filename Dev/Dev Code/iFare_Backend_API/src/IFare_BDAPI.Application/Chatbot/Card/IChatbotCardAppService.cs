using System.Threading.Tasks;
using Abp.Application.Services;
using IFare_BDAPI.Common.Dto;
using IFare_BDAPI.Chatbot.Card.Dto;

namespace IFare_BDAPI.Chatbot.Card
{
    public interface IChatbotCardAppService : IApplicationService
    {
        Task<ChatbotCardResultDto> GetDataList(ChatbotCardFilterParamDto param);
        Task<ErrorInfoBaseDto> InsertChatbotCard(ChatbotCardInsertDataDto insertData);
        Task<ErrorInfoBaseDto> UpdateChatbotCard(ChatbotCardEditorDataDto editorData);
        Task<ErrorInfoBaseDto> DeleteChatbotCard(ChatbotCardDeleteDataDto deleteData);
    }
}
