using System.Collections.Generic;
using IFare_API.Common.ValueModel;

namespace IFare_API.TaskManager.Chatbot.Card.ValueModel
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

    public class ChatbotCardData
    {
        /// <summary>卡片代號，前台以此作為比對與選卡的識別碼</summary>
        public string Id { get; set; }
        public string Title { get; set; }
        public string Keywords { get; set; }
        public string Answer { get; set; }
        public string LinkKeys { get; set; }
        public decimal Priority { get; set; }
        public int Sort { get; set; }
    }
}
