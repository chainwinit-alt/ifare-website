using System.Collections.Generic;
using IFare_BDAPI.Common.ValueModel;

namespace IFare_BDAPI.TaskManager.Chatbot.Card.ValueModel
{
    public class ChatbotCardResult : ErrorInfoBase
    {
        public ChatbotCardResult(ErrorInfoBase errorInfo, List<ChatbotCardData> result)
        {
            ErrCode = errorInfo.ErrCode;
            ErrMsg = errorInfo.ErrMsg;
            Result = result;
        }
        public List<ChatbotCardData> Result { get; set; }
    }

    public class ChatbotCardData : EditorUserBase
    {
        public long ID { get; set; }
        public string CardKey { get; set; }
        public string Title { get; set; }
        public string Keywords { get; set; }
        public string Answer { get; set; }
        public string LinkKeys { get; set; }
        public decimal Priority { get; set; }
        public int Sort { get; set; }
        public string State { get; set; }
    }
}
