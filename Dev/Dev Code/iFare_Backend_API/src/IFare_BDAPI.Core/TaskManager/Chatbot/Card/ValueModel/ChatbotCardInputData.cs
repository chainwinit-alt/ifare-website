using IFare_BDAPI.Constants;

namespace IFare_BDAPI.TaskManager.Chatbot.Card.ValueModel
{
    public class ChatbotCardInputData
    {
        public string CardKey { get; set; }
        public string Title { get; set; }
        public string Keywords { get; set; }
        public string Answer { get; set; }
        public string LinkKeys { get; set; }
        public decimal Priority { get; set; } = 1;
        public int Sort { get; set; } = 0;
        public bool IsEnabled { get; set; }
        public string State { get; set; } = DataState.Disabled;
    }

    public class ChatbotCardInsertData : ChatbotCardInputData
    {
        public long CreateUserID { get; set; }
    }

    public class ChatbotCardEditorData : ChatbotCardInputData
    {
        public long ID { get; set; }
        public long UpdateUserID { get; set; }
    }

    public class ChatbotCardDeleteData
    {
        public long ID { get; set; }
        public long UpdateUserID { get; set; }
    }
}
