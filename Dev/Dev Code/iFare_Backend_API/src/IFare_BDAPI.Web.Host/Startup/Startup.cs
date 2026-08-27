using System;
using System.Linq;
using System.Reflection;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Castle.Facilities.Logging;
using Abp.AspNetCore;
using Abp.AspNetCore.Mvc.Antiforgery;
using Abp.Castle.Logging.Log4Net;
using Abp.Extensions;
using IFare_BDAPI.Configuration;
using IFare_BDAPI.Identity;
using Abp.AspNetCore.SignalR.Hubs;
using Abp.Dependency;
using Abp.Json;
using Microsoft.Extensions.Hosting;
using Microsoft.OpenApi.Models;
using Newtonsoft.Json.Serialization;
using System.IO;
using Newtonsoft.Json;
using Microsoft.AspNetCore.Http;
using AspNetCore.Swagger.Themes;

namespace IFare_BDAPI.Web.Host.Startup
{
    /// <summary>
    /// IFare_BDAPI Web Host 啟動類別。
    ///
    /// 這個類別是 ASP.NET Core 站台的組態進入點，主要負責：
    /// 1. 註冊 MVC / JSON / 認證授權 / CORS / SignalR / Swagger 等服務。
    /// 2. 啟用 ABP Framework 與 Log4Net。
    /// 3. 建立 HTTP Middleware 管線，決定請求進入系統後的處理順序。
    /// </summary>
    public class Startup
    {
        // 預設 CORS Policy 名稱，後續在 Configure 階段會以同名 policy 啟用
        private const string _defaultCorsPolicyName = "localhost";

        // Swagger 顯示的 API 版本；若設定檔有 Ver，會在建構子內改寫
        private string _apiVersion = "v1";

        // 站台組態根物件，集中讀取 appsettings 與環境設定
        private readonly IConfigurationRoot _appConfiguration;
        // 目前執行中的主機環境（Development / Production 等）
        private readonly IWebHostEnvironment _hostingEnvironment;

        /// <summary>
        /// 建構子，初始化環境資訊與組態設定。
        /// </summary>
        /// <param name="env">目前執行中的 Web Host 環境</param>
        public Startup(IWebHostEnvironment env)
        {
            _hostingEnvironment = env;
            _appConfiguration = env.GetAppConfiguration();
            // 若設定檔有指定版本號，Swagger 顯示版本會跟著調整
            _apiVersion = _appConfiguration["Ver"] != null ? $"v{_appConfiguration["Ver"]}" : _apiVersion;
        }

        /// <summary>
        /// 註冊應用程式所需服務。
        /// 這個階段只建立服務與設定，不會真正處理 HTTP 請求。
        /// </summary>
        /// <param name="services">DI 容器服務集合</param>
        public void ConfigureServices(IServiceCollection services)
        {
            // Rollout
            RolloutConfigurer.Configure(_appConfiguration, _hostingEnvironment);

            //MVC
            services.AddControllersWithViews(
                options => { options.Filters.Add(new AbpAutoValidateAntiforgeryTokenAttribute()); }
            ).AddNewtonsoftJson(options =>
            {
                options.SerializerSettings.ContractResolver = new AbpMvcContractResolver(IocManager.Instance)
                {
                    NamingStrategy = new CamelCaseNamingStrategy()
                };
                options.SerializerSettings.NullValueHandling = NullValueHandling.Ignore;
            });

            IdentityRegistrar.Register(services);
            AuthConfigurer.Configure(services, _appConfiguration);

            services.AddSignalR();

            // Configure CORS for angular2 UI
            services.AddCors(
                options => options.AddPolicy(
                    _defaultCorsPolicyName,
                    builder => builder
                        .WithOrigins(GetCorsOrigins())
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials()
                )
            );

            // Swagger - Enable this line and the related lines in Configure method to enable swagger UI
            ConfigureSwagger(services);

            // Configure Abp and Dependency Injection
            services.AddAbpWithoutCreatingServiceProvider<IFare_BDAPIWebHostModule>(
                // Configure Log4Net logging
                options => options.IocManager.IocContainer.AddFacility<LoggingFacility>(
                    f => f.UseAbpLog4Net().WithConfig(_hostingEnvironment.IsDevelopment()
                        ? "log4net.config"
                        : "log4net.Production.config"
                    )
                )
            );
        }

        /// <summary>
        /// 建立 HTTP Middleware 管線。
        /// Middleware 的順序會直接影響請求能否正確完成驗證、授權、路由與回應。
        /// </summary>
        /// <param name="app">應用程式建置器</param>
        /// <param name="env">目前執行環境</param>
        /// <param name="loggerFactory">Logger 工廠</param>
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env, ILoggerFactory loggerFactory)
        {
            app.UseAbp(options => { options.UseAbpRequestLocalization = false; }); // Initializes ABP framework.

            app.UseCors(_defaultCorsPolicyName); // Enable CORS!

            app.UseStaticFiles();

            app.UseRouting();

            app.UseAuthentication();
            app.UseAuthorization();

            app.UseAbpRequestLocalization();

            // 啟用 Request Body 緩衝，讓後續元件或過濾器在需要時可重複讀取本文內容
            app.Use(next => context =>
            {
                context.Request.EnableBuffering();
                return next(context);
            });

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapHub<AbpCommonHub>("/signalr");
                endpoints.MapControllerRoute("default", "{controller=Home}/{action=Index}/{id?}");
                endpoints.MapControllerRoute("defaultWithArea", "{area}/{controller=Home}/{action=Index}/{id?}");
            });

            // Enable middleware to serve generated Swagger as a JSON endpoint
            app.UseSwagger(c => { c.RouteTemplate = "swagger/{documentName}/swagger.json"; });

            // Enable middleware to serve swagger-ui assets (HTML, JS, CSS etc.)
            app.UseSwaggerUI(ModernStyle.Dark, options =>
            {
                // specifying the Swagger JSON endpoint.
                options.SwaggerEndpoint($"./{_apiVersion}/swagger.json", $"IFare_BDAPI API {_apiVersion}");
                options.IndexStream = () => Assembly.GetExecutingAssembly()
                    .GetManifestResourceStream("IFare_BDAPI.Web.Host.wwwroot.swagger.ui.index.html");
                options.DisplayRequestDuration(); // Controls the display of the request duration (in milliseconds) for "Try it out" requests.
                options.EnableFilter();
            }); // URL: /swagger
        }
        
        /// <summary>
        /// 取得 CORS 白名單來源。
        ///
        /// 目前的來源仍以 App:CorsOrigins 為主，內容混雜多個 localhost 開發網域；
        /// 這在正式環境等於把開發用來源一起放行。為了不影響本機開發，這裡改成「依環境挑設定鍵」：
        ///   - 非 Development 且設定檔有 App:CorsOrigins_Production → 只採用該清單（正式網域）。
        ///   - 其餘情況維持原本的 App:CorsOrigins，行為與修改前完全相同。
        ///
        /// ⚠️【待確認】App:CorsOrigins_Production 目前尚未建立，需由部署方在
        /// appsettings.Production.json 或環境變數 App__CorsOrigins_Production 補上正式網域清單，
        /// 補上之後正式站才會真正收斂 CORS 白名單。
        /// </summary>
        /// <returns>可跨來源呼叫本 API 的網域陣列</returns>
        private string[] GetCorsOrigins()
        {
            // App:CorsOrigins in appsettings.json can contain more than one address separated by comma.
            var origins = _appConfiguration["App:CorsOrigins"];

            if (!_hostingEnvironment.IsDevelopment())
            {
                var productionOrigins = _appConfiguration["App:CorsOrigins_Production"];
                if (!productionOrigins.IsNullOrWhiteSpace()) origins = productionOrigins;
            }

            if (origins.IsNullOrWhiteSpace()) return new string[0];

            return origins
                    .Split(",", StringSplitOptions.RemoveEmptyEntries)
                    .Select(o => o.Trim().RemovePostFix("/"))
                    .Where(o => !o.IsNullOrWhiteSpace())
                    .ToArray();
        }

        /// <summary>
        /// 設定 Swagger / OpenAPI 文件。
        /// 集中維護 API 文件版本、JWT 安全性定義，以及 XML 註解匯入規則。
        /// </summary>
        /// <param name="services">DI 容器服務集合</param>
        private void ConfigureSwagger(IServiceCollection services)
        {
            services.AddSwaggerGen(options =>
            {
                options.SwaggerDoc(_apiVersion, new OpenApiInfo
                {
                    Version = _apiVersion,
                    Title = "IFare_BDAPI API",
                    Description = "IFare_BDAPI",
                    // uncomment if needed TermsOfService = new Uri("https://example.com/terms"),
                    // Contact = new OpenApiContact
                    // {
                    //     Name = "IFare_BDAPI",
                    //     Email = string.Empty,
                    //     Url = new Uri("https://twitter.com/aspboilerplate"),
                    // },
                    // License = new OpenApiLicense
                    // {
                    //     Name = "MIT License",
                    //     Url = new Uri("https://github.com/aspnetboilerplate/aspnetboilerplate/blob/dev/LICENSE"),
                    // }
                });
                options.DocInclusionPredicate((docName, description) => true);

                // Define the BearerAuth scheme that's in use
                options.AddSecurityDefinition("bearerAuth", new OpenApiSecurityScheme()
                {
                    Description =
                        "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
                    Name = "Authorization",
                    In = ParameterLocation.Header,
                    Type = SecuritySchemeType.ApiKey
                });

                //add summaries to swagger
                bool canShowSummaries = _appConfiguration.GetValue<bool>("Swagger:ShowSummaries");
                if (canShowSummaries)
                {
                    // 匯入 Host、Application 與 Web.Core 的 XML 註解，讓 Swagger 顯示摘要說明
                    var hostXmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
                    var hostXmlPath = Path.Combine(AppContext.BaseDirectory, hostXmlFile);
                    options.IncludeXmlComments(hostXmlPath);

                    var applicationXml = $"IFare_BDAPI.Application.xml";
                    var applicationXmlPath = Path.Combine(AppContext.BaseDirectory, applicationXml);
                    options.IncludeXmlComments(applicationXmlPath, true);   // true => open the controller comment.

                    var webCoreXmlFile = $"IFare_BDAPI.Web.Core.xml";
                    var webCoreXmlPath = Path.Combine(AppContext.BaseDirectory, webCoreXmlFile);
                    options.IncludeXmlComments(webCoreXmlPath);
                }
            });
        }
    }
}
