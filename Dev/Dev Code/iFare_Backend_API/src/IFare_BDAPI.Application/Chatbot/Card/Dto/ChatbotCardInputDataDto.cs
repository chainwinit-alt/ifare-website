using Abp.AutoMapper;
using IFare_BDAPI.TaskManager.Chatbot.Card.ValueModel;

namespace IFare_BDAPI.Chatbot.Card.Dto
{
    [AutoMapTo(typeof(ChatbotCardInputData))]
    public class ChatbotCardInputDataDto
    {
        public string CardKey { get; set; }
        public string Title { get; set; }
        public string Keywords { get; set; }
        public string Answer { get; set; }
        public string LinkKeys { get; set; }
        public decimal Priority { get; set; } = 1;
        public int Sort { get; set; } = 0;
        public bool IsEnabled { get; set; }
    }

    [AutoMapTo(typeof(ChatbotCardInsertData))]
    public class ChatbotCardInsertDataDto : ChatbotCardInputDataDto
    {

    }

    [AutoMapTo(typeof(ChatbotCardEditorData))]
    public class ChatbotCardEditorDataDto : ChatbotCardInputDataDto
    {
        public long ID { get; set; }
    }

    [AutoMapTo(typeof(ChatbotCardDeleteData))]
    public class ChatbotCardDeleteDataDto
    {
        public long ID { get; set; }
    }
}
