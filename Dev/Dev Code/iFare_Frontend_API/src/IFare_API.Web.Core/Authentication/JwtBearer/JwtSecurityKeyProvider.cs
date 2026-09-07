using System;
using Microsoft.Extensions.Configuration;

namespace IFare_API.Authentication.JwtBearer
{
    /// <summary>
    /// JWT 簽章金鑰的取得來源。
    ///
    /// 金鑰原本只寫在 appsettings.json 裡，而設定檔會進版控、也會隨部署包一起散佈，
    /// 等同把簽章金鑰公開；任何拿到它的人都能自行簽出被本站信任的 token。
    /// 因此改為「環境變數優先」：部署環境設 IFARE_API_JWT_KEY 即可覆蓋，
    /// 沒設（本機開發、既有環境）時仍沿用設定檔現值，行為與原本完全相同。
    /// 金鑰值本身不在程式碼裡更動，輪替由維運在環境變數上處理。
    /// </summary>
    public static class JwtSecurityKeyProvider
    {
        /// <summary>存放 JWT 簽章金鑰的環境變數名稱。</summary>
        public const string EnvironmentVariableName = "IFARE_API_JWT_KEY";

        private const string ConfigurationKey = "Authentication:JwtBearer:SecurityKey";

        /// <summary>
        /// 取得 JWT 簽章金鑰：環境變數優先，未設定（或為空白）時回退設定檔的現有值。
        /// </summary>
        /// <param name="configuration">應用程式組態</param>
        /// <returns>簽章金鑰字串</returns>
        public static string Resolve(IConfiguration configuration)
        {
            var fromEnvironment = Environment.GetEnvironmentVariable(EnvironmentVariableName);
            if (!string.IsNullOrWhiteSpace(fromEnvironment))
            {
                return fromEnvironment.Trim();
            }

            return configuration?[ConfigurationKey];
        }
    }
}
