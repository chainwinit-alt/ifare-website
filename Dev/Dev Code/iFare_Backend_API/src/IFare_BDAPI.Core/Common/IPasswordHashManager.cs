using Abp.Domain.Services;

namespace IFare_BDAPI.Common
{
    /// <summary>
    /// 後台帳號密碼雜湊工具。
    /// 舊資料庫的 SysUser.Password 是明文，這層負責「雜湊寫入」與「明文/雜湊皆可驗證」的相容處理。
    /// </summary>
    public interface IPasswordHashManager : IDomainService
    {
        /// <summary>
        /// 將明文密碼轉為可存入資料庫的雜湊字串。
        /// </summary>
        string HashPassword(string password);

        /// <summary>
        /// 驗證輸入的明文密碼是否與資料庫中儲存的值相符。
        /// </summary>
        /// <param name="storedPassword">資料庫中的值（可能是雜湊，也可能是尚未升級的舊明文）</param>
        /// <param name="inputPassword">使用者輸入的明文密碼</param>
        /// <param name="needRehash">驗證通過但儲存值需要重新雜湊（舊明文或舊雜湊版本）時為 true</param>
        bool VerifyPassword(string storedPassword, string inputPassword, out bool needRehash);
    }
}
