using System.Threading.Tasks;
using Abp;
using IFare_API.News.Dto;
using IFare_API.TaskManager.News;

namespace IFare_API.News
{
    /// <summary>
    /// 最新消息應用服務，提供前台公開網站查詢最新消息的功能。
    /// 透過 TaskManager 存取資料來源，並使用 AutoMapper 轉換為 DTO 回傳前端。
    /// </summary>
    public class NewsAppService : AbpServiceBase, INewsAppService
    {
        /// <summary>最新消息 TaskManager，負責執行資料查詢業務邏輯</summary>
        private readonly INewsTaskManager _taskManager;

        /// <summary>
        /// 建構子，透過依賴注入初始化最新消息 TaskManager。
        /// </summary>
        /// <param name="taskManager">最新消息 TaskManager</param>
        public NewsAppService(INewsTaskManager taskManager)
        {
            _taskManager = taskManager;
        }

        /// <summary>
        /// 取得全部最新消息列表（依系統預設排序）。
        /// </summary>
        /// <returns>最新消息結果 DTO，包含消息列表及錯誤資訊</returns>
        public async Task<NewsResultDto> GetNewsList()
        {
            // 透過 TaskManager 查詢全部最新消息
            var result = _taskManager.GetNewsList();
            // 將 TaskManager 回傳的資料模型對應至 DTO
            return ObjectMapper.Map<NewsResultDto>(result);
        }

        /// <summary>
        /// 取得置頂（精選）最新消息列表。
        /// </summary>
        /// <returns>置頂最新消息結果 DTO，包含消息列表及錯誤資訊</returns>
        public async Task<NewsResultDto> GetTopsNewsList()
        {
            // 透過 TaskManager 查詢置頂最新消息
            var result = _taskManager.GetNewsTops();
            // 對應至 DTO
            return ObjectMapper.Map<NewsResultDto>(result);
        }

        /// <summary>
        /// 根據消息 ID 取得單筆最新消息的詳細內容。
        /// </summary>
        /// <param name="newsID">最新消息的唯一識別碼</param>
        /// <returns>最新消息詳細結果 DTO，包含完整內容及錯誤資訊</returns>
        public async Task<NewsResultDto> GetNewsDetail(long newsID)
        {
            // 透過 TaskManager 查詢指定 ID 的消息詳細內容
            var result = _taskManager.GetNewsDetail(newsID);
            // 對應至 DTO
            return ObjectMapper.Map<NewsResultDto>(result);
        }
    }
}
