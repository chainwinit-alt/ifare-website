using System.Collections.Generic;
using Abp.AutoMapper;
using IFare_API.Common.Dto;
using IFare_API.TaskManager.Chatbot.Card.ValueModel;

namespace IFare_API.Chatbot.Card.Dto
{
    [AutoMapTo(typeof(ChatbotCardResult))]
    [AutoMapFrom(typeof(ChatbotCardResult))]
    public class ChatbotCardResultDto : ErrorInfoBaseDto
    {
        public List<ChatbotCardDataDto> Result { get; set; }
    }

    [AutoMapTo(typeof(ChatbotCardData))]
    [AutoMapFrom(typeof(ChatbotCardData))]
    public class ChatbotCardDataDto
    {
        public string Id { get; set; }
        public string Title { get; set; }
        public string Keywords { get; set; }
        public string Answer { get; set; }
        public string LinkKeys { get; set; }
        public decimal Priority { get; set; }
        public int Sort { get; set; }
    }
}
