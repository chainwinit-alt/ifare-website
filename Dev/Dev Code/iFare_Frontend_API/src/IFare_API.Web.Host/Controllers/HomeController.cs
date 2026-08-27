using Microsoft.AspNetCore.Mvc;
using IFare_API.Controllers;

namespace IFare_API.Web.Host.Controllers
{
    /// <summary>
    /// 首頁控制器，負責處理根路徑請求。
    /// 根路徑 (/) 會自動重新導向至 Swagger API 文件頁面。
    /// </summary>
    public class HomeController : IFare_APIControllerBase
    {
        /// <summary>
        /// 根路徑處理方法，將使用者重新導向至 Swagger API 文件頁面。
        /// </summary>
        /// <returns>重新導向至 /swagger 的結果</returns>
        public IActionResult Index()
        {
            // 直接重新導向至 Swagger UI 頁面，方便開發者查閱 API 文件
            return Redirect("~/swagger");
        }

        // 已移除示範用的 TestNotification：它是匿名可呼叫的 GET 端點，
        // 任何人都能對管理員帳號灌通知，正式環境不需要也不該保留。
    }
}
