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
using IFare_API.Configuration;
using IFare_API.Identity;
using Abp.AspNetCore.SignalR.Hubs;
using Abp.Dependency;
using Abp.Json;
using Microsoft.Extensions.Hosting;
using Microsoft.OpenApi.Models;
using Newtonsoft.Json.Serialization;
using System.IO;
using Newtonsoft.Json;

namespace IFare_API.Web.Host.Startup
{
    /// <summary>
    /// IFare_API Web Host 啟動類別。
    ///
    /// 這裡負責前台 API 站台的服務註冊與 Middleware 管線建立，
    /// 包含 MVC、驗證授權、CORS、SignalR、Swagger 與 ABP Framework 啟動。
    /// </summary>
    public class Startup
    {
        // 預設 CORS Policy 名稱
        private const string _defaultCorsPolicyName = "localhost";

        // 前台 API 的固定版本號
        private const string _apiVersion = "v1";

        // 站台組態根物件
        private readonly IConfigurationRoot _appConfiguration;
        // 目前執行環境資訊
        private readonly IWebHostEnvironment _hostingEnvironment;

        /// <summary>
        /// 建構子，初始化環境與組態。
        /// </summary>
        /// <param name="env">目前執行中的 Web Host 環境</param>
        public Startup(IWebHostEnvironment env)
        {
            _hostingEnvironment = env;
            _appConfiguration = env.GetAppConfiguration();
        }

        /// <summary>
        /// 註冊站台執行所需服務。
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
                        .WithOrigins(
                            // App:CorsOrigins in appsettings.json can contain more than one address separated by comma.
                            _appConfiguration["App:CorsOrigins"]
                                .Split(",", StringSplitOptions.RemoveEmptyEntries)
                                .Select(o => o.RemovePostFix("/"))
                                .ToArray()
                        )
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials()
                )
            );

            // Swagger - Enable this line and the related lines in Configure method to enable swagger UI
            ConfigureSwagger(services);

            // Configure Abp and Dependency Injection
            services.AddAbpWithoutCreatingServiceProvider<IFare_APIWebHostModule>(
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


            app.UseEndpoints(endpoints =>
            {
                endpoints.MapHub<AbpCommonHub>("/signalr");
                endpoints.MapControllerRoute("default", "{controller=Home}/{action=Index}/{id?}");
                endpoints.MapControllerRoute("defaultWithArea", "{area}/{controller=Home}/{action=Index}/{id?}");
            });

            // Enable middleware to serve generated Swagger as a JSON endpoint
            app.UseSwagger(c => { c.RouteTemplate = "swagger/{documentName}/swagger.json"; });

            // Enable middleware to serve swagger-ui assets (HTML, JS, CSS etc.)
            app.UseSwaggerUI(options =>
            {
                // specifying the Swagger JSON endpoint.
                options.SwaggerEndpoint($"./{_apiVersion}/swagger.json", $"IFare_API API {_apiVersion}");
                options.IndexStream = () => Assembly.GetExecutingAssembly()
                    .GetManifestResourceStream("IFare_API.Web.Host.wwwroot.swagger.ui.index.html");
                options.DisplayRequestDuration(); // Controls the display of the request duration (in milliseconds) for "Try it out" requests.  
                options.EnableFilter();  
            }); // URL: /swagger
        }
        
        /// <summary>
        /// 設定 Swagger / OpenAPI 文件。
        /// </summary>
        /// <param name="services">DI 容器服務集合</param>
        private void ConfigureSwagger(IServiceCollection services)
        {
            services.AddSwaggerGen(options =>
            {
                options.SwaggerDoc(_apiVersion, new OpenApiInfo
                {
                    Version = _apiVersion,
                    Title = "IFare_API API",
                    Description = "IFare_API",
                    // uncomment if needed TermsOfService = new Uri("https://example.com/terms"),
                    // Contact = new OpenApiContact
                    // {
                    //     Name = "IFare_API",
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
                    // 匯入多個專案輸出的 XML 註解，讓 Swagger 能顯示方法摘要
                    var hostXmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
                    var hostXmlPath = Path.Combine(AppContext.BaseDirectory, hostXmlFile);
                    options.IncludeXmlComments(hostXmlPath);

                    var applicationXml = $"IFare_API.Application.xml";
                    var applicationXmlPath = Path.Combine(AppContext.BaseDirectory, applicationXml);
                    options.IncludeXmlComments(applicationXmlPath);

                    var webCoreXmlFile = $"IFare_API.Web.Core.xml";
                    var webCoreXmlPath = Path.Combine(AppContext.BaseDirectory, webCoreXmlFile);
                    options.IncludeXmlComments(webCoreXmlPath);
                }
            });
        }
    }
}
