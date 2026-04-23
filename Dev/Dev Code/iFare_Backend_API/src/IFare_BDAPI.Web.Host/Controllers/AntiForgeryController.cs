using System.Threading.Tasks;
using Abp.Web.Security.AntiForgery;
using Microsoft.AspNetCore.Antiforgery;
using IFare_BDAPI.Controllers;
using Microsoft.AspNetCore.Mvc;

namespace IFare_BDAPI.Web.Host.Controllers
{
    /// <summary>
    /// 防偽造請求（CSRF/XSRF）控制器。
    /// 提供設定 Anti-Forgery Token 至 Cookie 的端點，用於保護 POST 請求免受跨站請求偽造攻擊。
    /// </summary>
    public class AntiForgeryController : IFare_BDAPIControllerBase
    {
        // ASP.NET Core 內建防偽造服務，負責產生與驗證 Token
        private readonly IAntiforgery _antiforgery;
        // ABP 框架的防偽造管理器，整合 ABP 生態系的 CSRF 防護機制
        private readonly IAbpAntiForgeryManager _antiForgeryManager;

        /// <summary>
        /// 建構子，透過相依性注入初始化防偽造服務。
        /// </summary>
        /// <param name="antiforgery">ASP.NET Core 防偽造服務</param>
        /// <param name="antiForgeryManager">ABP 防偽造管理器</param>
        public AntiForgeryController(IAntiforgery antiforgery, IAbpAntiForgeryManager antiForgeryManager)
        {
            _antiforgery = antiforgery;
            _antiForgeryManager = antiForgeryManager;
        }

        /// <summary>
        /// 產生並設定 ASP.NET Core 原生的 Anti-Forgery Token 至 HTTP 回應的 Cookie 及 Header 中。
        /// 前端 SPA 應用程式應在發出 POST 請求前呼叫此端點以取得 Token。
        /// </summary>
        public void GetToken()
        {
            // 將 Anti-Forgery Token 寫入 Cookie 與 Response Header
            _antiforgery.SetCookieTokenAndHeader(HttpContext);
        }

        /// <summary>
        /// 使用 ABP 框架的防偽造管理器，將 XSRF Token 設定至 Cookie 中。
        /// 適用於使用 ABP 框架驗證機制的前端整合場景。
        /// </summary>
        public void SetCookie()
        {
            // 透過 ABP 管理器設定 XSRF-TOKEN Cookie
            _antiForgeryManager.SetCookie(HttpContext);
        }
    }
}
