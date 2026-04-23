using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Abp;
using Abp.Extensions;
using Abp.Notifications;
using Abp.Timing;
using Abp.Web.Security.AntiForgery;
using IFare_API.Controllers;

namespace IFare_API.Web.Host.Controllers
{
    /// <summary>
    /// 首頁控制器，負責處理根路徑請求及開發測試用通知功能。
    /// 根路徑 (/) 會自動重新導向至 Swagger API 文件頁面。
    /// </summary>
    public class HomeController : IFare_APIControllerBase
    {
        /// <summary>通知發布服務，用於向指定使用者發送系統通知</summary>
        private readonly INotificationPublisher _notificationPublisher;

        /// <summary>
        /// 建構子，透過依賴注入初始化通知發布服務。
        /// </summary>
        /// <param name="notificationPublisher">通知發布服務</param>
        public HomeController(INotificationPublisher notificationPublisher)
        {
            _notificationPublisher = notificationPublisher;
        }

        /// <summary>
        /// 根路徑處理方法，將使用者重新導向至 Swagger API 文件頁面。
        /// </summary>
        /// <returns>重新導向至 /swagger 的結果</returns>
        public IActionResult Index()
        {
            // 直接重新導向至 Swagger UI 頁面，方便開發者查閱 API 文件
            return Redirect("~/swagger");
        }

        /// <summary>
        /// 這是示範程式碼，用於展示如何對預設租戶管理員及 Host 管理員發送通知。
        /// 請勿在正式環境中使用此方法！
        /// </summary>
        /// <param name="message">要發送的通知訊息內容，若為空則使用預設測試訊息</param>
        /// <returns>確認訊息，表示通知已成功發送</returns>
        public async Task<ActionResult> TestNotification(string message = "")
        {
            // 若未提供訊息，則使用包含目前時間的預設測試訊息
            if (message.IsNullOrEmpty())
            {
                message = "This is a test notification, created at " + Clock.Now;
            }

            // 設定目標使用者：預設租戶（TenantId=1）的管理員（UserId=2）
            var defaultTenantAdmin = new UserIdentifier(1, 2);
            // 設定 Host 端管理員（TenantId=null，UserId=1）
            var hostAdmin = new UserIdentifier(null, 1);

            // 發布 App.SimpleMessage 類型的通知至指定使用者
            await _notificationPublisher.PublishAsync(
                "App.SimpleMessage",
                new MessageNotificationData(message),
                severity: NotificationSeverity.Info, // 通知等級：資訊
                userIds: new[] { defaultTenantAdmin, hostAdmin } // 通知目標使用者
            );

            return Content("Sent notification: " + message);
        }
    }
}
