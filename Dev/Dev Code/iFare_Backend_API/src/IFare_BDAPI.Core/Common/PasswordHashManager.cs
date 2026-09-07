using System;

namespace IFare_BDAPI.Common
{
    /// <summary>
    /// 與目前正式後台共用資料庫時，維持既有 SysUser.Password 明文格式。
    /// 登入不會更新密碼；新增帳號與修改密碼也維持舊格式，確保舊版後台相容。
    /// </summary>
    public class PasswordHashManager : IPasswordHashManager
    {
        public string HashPassword(string password)
        {
            return password;
        }

        public bool VerifyPassword(string storedPassword, string inputPassword, out bool needRehash)
        {
            needRehash = false;
            return !string.IsNullOrEmpty(storedPassword)
                && !string.IsNullOrEmpty(inputPassword)
                && string.Equals(storedPassword, inputPassword, StringComparison.Ordinal);
        }
    }
}
