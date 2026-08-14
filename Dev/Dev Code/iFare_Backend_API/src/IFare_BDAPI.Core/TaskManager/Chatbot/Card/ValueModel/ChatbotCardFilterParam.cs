using System;
using System.Collections.Generic;

namespace IFare_BDAPI.TaskManager.Chatbot.Card.ValueModel
{
    public class ChatbotCardFilterParam
    {
        public DateTime? CreateDateStart { get; set; }
        public DateTime? CreateDateEnd { get; set; }
        public DateTime? UpdateDateStart { get; set; }
        public DateTime? UpdateDateEnd { get; set; }
        public List<long>? IDs { get; set; }
        public bool IsIDsFiltered { get; set; } = false;
        public bool IsCreateDateFiltered { get; set; } = false;
        public bool IsUpdateDateFiltered { get; set; } = false;
        /// <summary>只取啟用中的卡片，供前台查詢使用</summary>
        public bool OnlyEnabled { get; set; } = false;
    }
}
