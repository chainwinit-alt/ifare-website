using System;
using System.Collections.Generic;
using Abp.Domain.Entities;

namespace IFare_BDAPI
{
    /// <summary>
    /// 芒寶答案卡。
    /// 回覆文字由基金會人員撰寫並固定不變，聊天機器人只負責挑選卡片，
    /// 因此語氣不會隨模型生成而變動。
    /// </summary>
    public partial class ChatbotCard : Entity
    {
        public long Id { get; set; }
        /// <summary>卡片代號，供比對與 LLM 選卡使用（例如 ifare-search），全站唯一</summary>
        public string CardKey { get; set; }
        /// <summary>後台顯示用主題名稱</summary>
        public string Title { get; set; }
        /// <summary>可能的問法，以逗號或換行分隔</summary>
        public string Keywords { get; set; }
        /// <summary>芒寶的回答，前台原文輸出不做改寫</summary>
        public string Answer { get; set; }
        /// <summary>附帶的站內連結代號，以逗號分隔（home/about/news/articles/collaborator/ifare）</summary>
        public string LinkKeys { get; set; }
        /// <summary>比對權重，語意較廣的卡片可調低以免蓋過更具體的卡片</summary>
        public decimal Priority { get; set; }
        public int Sort { get; set; }
        public string State { get; set; }
        public DateTime CreateTime { get; set; }
        public DateTime? UpdateTime { get; set; }
        public long? CreateUserId { get; set; }
        public long? UpdateUserId { get; set; }

        public virtual SysUser CreateUser { get; set; }
        public virtual SysUser UpdateUser { get; set; }
    }
}
