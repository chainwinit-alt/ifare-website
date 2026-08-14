using System;
using System.Collections.Generic;
using Abp.AutoMapper;
using IFare_BDAPI.TaskManager.Chatbot.Card.ValueModel;

namespace IFare_BDAPI.Chatbot.Card.Dto
{
    [AutoMapTo(typeof(ChatbotCardFilterParam))]
    public class ChatbotCardFilterParamDto
    {
        public DateTime? CreateDateStart { get; set; }
        public DateTime? CreateDateEnd { get; set; }
        public DateTime? UpdateDateStart { get; set; }
        public DateTime? UpdateDateEnd { get; set; }
        public List<long>? IDs { get; set; }
        public bool OnlyEnabled { get; set; } = false;
    }
}
