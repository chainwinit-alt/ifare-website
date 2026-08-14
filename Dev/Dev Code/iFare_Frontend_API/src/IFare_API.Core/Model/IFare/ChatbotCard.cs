using Abp.Domain.Entities;

namespace IFare_API
{
    /// <summary>
    /// 芒寶答案卡（前台唯讀）。
    /// 只映射前台比對所需的欄位，維護用的建立者、修改時間等欄位由後台 API 負責。
    /// </summary>
    public partial class ChatbotCard : Entity
    {
        public long Id { get; set; }
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
