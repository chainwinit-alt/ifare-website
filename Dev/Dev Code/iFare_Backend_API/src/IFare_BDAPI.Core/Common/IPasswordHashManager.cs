using Abp.Domain.Services;

namespace IFare_BDAPI.Common
{
    /// <summary>
    /// 後台帳號密碼相容工具。
    /// 目前與舊版後台共用資料庫，因此維持 SysUser.Password 明文格式且不自動轉換。
    /// </summary>
    public interface IPasswordHashManager : IDomainService
    {
        /// <summary>
        /// 依舊系統格式回傳要寫入資料庫的密碼。
        /// </summary>
        string HashPassword(string password);

        /// <summary>
        /// 驗證輸入的明文密碼是否與資料庫中儲存的值相符。
        /// </summary>
        /// <param name="storedPassword">資料庫中的既有明文值</param>
        /// <param name="inputPassword">使用者輸入的明文密碼</param>
        /// <param name="needRehash">共用舊資料庫模式固定為 false</param>
        bool VerifyPassword(string storedPassword, string inputPassword, out bool needRehash);
    }
}
