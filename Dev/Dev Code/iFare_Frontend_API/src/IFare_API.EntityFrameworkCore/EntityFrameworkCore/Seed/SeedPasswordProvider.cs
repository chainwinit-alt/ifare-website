using System;

namespace IFare_API.EntityFrameworkCore.Seed
{
    /// <summary>
    /// seed 建立管理者帳號時使用的初始密碼來源。
    ///
    /// 原本直接把 "123qwe" 寫死在 seed 程式碼裡，等於所有跑過 seed 的環境
    /// （含正式站）都有一組公開在版控裡的 admin 密碼。
    /// 改為「環境變數優先」：部署前設 IFARE_API_SEED_ADMIN_PASSWORD 即可指定初始密碼；
    /// 沒設時仍回退為原本的預設值，既有的本機／開發 seed 流程行為不變。
    ///
    /// TODO（待人工確認）：正式環境務必設定 IFARE_API_SEED_ADMIN_PASSWORD，
    /// 或於 seed 完成後立即改掉 admin 密碼；長期建議把回退預設值移除。
    /// </summary>
    public static class SeedPasswordProvider
    {
        public const string EnvironmentVariableName = "IFARE_API_SEED_ADMIN_PASSWORD";

        private const string FallbackPassword = "123qwe";

        public static string GetInitialAdminPassword()
        {
            var fromEnvironment = Environment.GetEnvironmentVariable(EnvironmentVariableName);
            return string.IsNullOrWhiteSpace(fromEnvironment) ? FallbackPassword : fromEnvironment;
        }
    }
}
