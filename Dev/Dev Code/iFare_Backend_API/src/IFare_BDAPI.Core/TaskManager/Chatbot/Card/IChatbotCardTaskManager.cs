using Abp.Domain.Services;
using IFare_BDAPI.Common.ValueModel;
using IFare_BDAPI.TaskManager.Chatbot.Card.ValueModel;

namespace IFare_BDAPI.TaskManager.Chatbot.Card
{
    public interface IChatbotCardTaskManager : IDomainService
    {
        ChatbotCardResult GetDataList(ChatbotCardFilterParam param);
        ErrorInfoBase InsertChatbotCard(ChatbotCardInsertData insertData);
        ErrorInfoBase UpdateChatbotCard(ChatbotCardEditorData editorData);
        ErrorInfoBase DeleteChatbotCard(ChatbotCardDeleteData deleteData);
    }
}
