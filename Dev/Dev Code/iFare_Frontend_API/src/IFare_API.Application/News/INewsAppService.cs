using System.Threading.Tasks;
using Abp.Application.Services;
using IFare_API.News.Dto;

namespace IFare_API.News
{
    /// <summary>
    /// 最新消息應用服務介面，定義前台公開網站查詢最新消息的操作合約。
    /// 實作類別為 <see cref="NewsAppService"/>。
    /// </summary>
    public interface INewsAppService : IApplicationService
    {
        /// <summary>
        /// 取得置頂（精選）最新消息列表。
        /// </summary>
        /// <returns>置頂最新消息結果 DTO</returns>
        Task<NewsResultDto> GetTopsNewsList();

        /// <summary>
        /// 取得全部最新消息列表。
        /// </summary>
        /// <returns>全部最新消息結果 DTO</returns>
        Task<NewsResultDto> GetNewsList();

        /// <summary>
        /// 根據消息 ID 取得單筆最新消息的詳細內容。
        /// </summary>
        /// <param name="newsID">最新消息的唯一識別碼</param>
        /// <returns>最新消息詳細結果 DTO</returns>
        Task<NewsResultDto> GetNewsDetail(long newsID);
    }
}
