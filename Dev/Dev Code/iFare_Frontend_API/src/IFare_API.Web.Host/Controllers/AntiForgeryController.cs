using System.Threading.Tasks;
using Abp.Web.Security.AntiForgery;
using Microsoft.AspNetCore.Antiforgery;
using IFare_API.Controllers;
using Microsoft.AspNetCore.Mvc;

namespace IFare_API.Web.Host.Controllers
{
    /// <summary>
    /// 防偽造 Token 控制器，負責產生並設定 CSRF（跨站請求偽造）防護所需的 Token。
    /// 前端應用程式在送出表單或非 GET 請求前，必須先呼叫此控制器取得有效的防偽造 Token。
    /// </summary>
    public class AntiForgeryController : IFare_APIControllerBase
    {
        /// <summary>ASP.NET Core 內建防偽造服務，負責產生及驗證 CSRF Token</summary>
        private readonly IAntiforgery _antiforgery;

        /// <summary>ABP 框架的防偽造管理員，負責將 Token 寫入 Cookie</summary>
        private readonly IAbpAntiForgeryManager _antiForgeryManager;

        /// <summary>
        /// 建構子，透過依賴注入初始化 ASP.NET Core 防偽造服務及 ABP 防偽造管理員。
        /// </summary>
        /// <param name="antiforgery">ASP.NET Core 防偽造服務</param>
        /// <param name="antiForgeryManager">ABP 防偽造管理員</param>
        public AntiForgeryController(IAntiforgery antiforgery, IAbpAntiForgeryManager antiForgeryManager)
        {
            _antiforgery = antiforgery;
            _antiForgeryManager = antiForgeryManager;
        }

        /// <summary>
        /// 產生 CSRF 防偽造 Token 並透過 Cookie 和 HTTP Header 傳送至前端。
        /// 前端 SPA 應用程式通常在初始載入時呼叫此方法以取得 Token。
        /// </summary>
        public void GetToken()
        {
            // 產生防偽造 Token 並寫入 Cookie 及 Response Header
            _antiforgery.SetCookieTokenAndHeader(HttpContext);
        }

        /// <summary>
        /// 使用 ABP 框架的方式將防偽造 Token 寫入 Cookie。
        /// 此方法與 GetToken 功能類似，但使用 ABP 的實作方式。
        /// </summary>
        public void SetCookie()
        {
            // 透過 ABP 防偽造管理員將 Token 寫入 HTTP Cookie
            _antiForgeryManager.SetCookie(HttpContext);
        }
    }
}
