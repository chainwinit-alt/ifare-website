using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Abp;
using Abp.Extensions;
using Abp.Notifications;
using Abp.Timing;
using Abp.Web.Security.AntiForgery;
using IFare_BDAPI.Controllers;

namespace IFare_BDAPI.Web.Host.Controllers
{
    /// <summary>
    /// 首頁控制器。
    /// 提供 API 根路徑的導向（自動跳轉至 Swagger UI），以及測試用的通知發送端點。
    /// </summary>
    public class HomeController : IFare_BDAPIControllerBase
    {
        // ABP 框架的通知發布服務，用於向使用者發送系統通知
        private readonly INotificationPublisher _notificationPublisher;

        /// <summary>
        /// 建構子，透過相依性注入初始化通知發布服務。
        /// </summary>
        /// <param name="notificationPublisher">ABP 通知發布服務</param>
        public HomeController(INotificationPublisher notificationPublisher)
        {
            _notificationPublisher = notificationPublisher;
        }

        /// <summary>
        /// API 根路徑（GET /）。
        /// 自動將使用者導向 Swagger API 文件頁面，方便開發人員瀏覽與測試 API。
        /// </summary>
        /// <returns>重新導向至 Swagger UI 的結果</returns>
        public IActionResult Index()
        {
            // 自動重新導向至 Swagger UI 介面
            return Redirect("~/swagger");
        }

        /// <summary>
        /// 測試通知發送端點（僅供開發測試使用，請勿在正式環境啟用）。
        /// 向預設租戶管理員（TenantId=1, UserId=2）及 Host 管理員（UserId=1）發送測試通知。
        /// </summary>
        /// <param name="message">通知訊息內容，若未提供則自動產生含時間戳的預設訊息</param>
        /// <returns>包含已發送訊息內容的純文字回應</returns>
        public async Task<ActionResult> TestNotification(string message = "")
        {
            // 若未提供訊息，使用目前時間產生預設測試訊息
            if (message.IsNullOrEmpty())
            {
                message = "This is a test notification, created at " + Clock.Now;
            }

            // 預設租戶管理員（TenantId=1, UserId=2）
            var defaultTenantAdmin = new UserIdentifier(1, 2);
            // Host 管理員（無租戶限制, UserId=1）
            var hostAdmin = new UserIdentifier(null, 1);

            // 發布簡訊型通知至指定的使用者，嚴重程度為 Info
            await _notificationPublisher.PublishAsync(
                "App.SimpleMessage",
                new MessageNotificationData(message),
                severity: NotificationSeverity.Info,
                userIds: new[] { defaultTenantAdmin, hostAdmin }
            );

            return Content("Sent notification: " + message);
        }
    }
}
