using System;
using Microsoft.AspNetCore.Identity;

namespace IFare_BDAPI.Common
{
    /// <summary>
    /// 以 ASP.NET Core Identity 內建的 <see cref="PasswordHasher{TUser}"/>（PBKDF2）實作密碼雜湊。
    ///
    /// 【相容層說明】
    /// 現有資料庫中的 SysUser.Password 全部是明文，若直接改成只認雜湊，所有既有帳號都會登不進來。
    /// 因此驗證流程為：
    ///   1. 先判斷儲存值是否為 Identity 的雜湊格式（Base64 且首位元組為版本標記 0x00 / 0x01）。
    ///   2. 是雜湊 → 走雜湊驗證。
    ///   3. 不是雜湊 → 視為舊明文，改以字串比對；通過後回報 needRehash，由呼叫端即時改存雜湊。
    /// 這樣舊帳號第一次登入就會自動升級，不需要另外做資料轉檔。
    ///
    /// ⚠️【尚未實機驗證｜2026-08-27】
    /// 這段相容層只通過編譯與單元層級測試，**從未對執行中的後台實際登入過一次**。
    /// 原因是 Context/IFareContext.cs 有既有的 HasMaxLength(-1) 問題（見該檔註解），
    /// 後台 API 目前起得來但任何請求都回 500，無從驗證。
    ///
    /// 上線前務必按這個順序做，否則風險是「全部後台帳號都登不進去」：
    ///   1. 先修掉 IFareContext 的 HasMaxLength(-1)
    ///   2. 用既有的明文帳號登入一次 → 應該成功
    ///   3. 查 DB 確認該筆 Password 已變成 84 字元的雜湊
    ///   4. 用同一組密碼再登入一次 → 應該成功（這次走雜湊驗證路徑）
    ///   5. 用錯誤密碼登入 → 應該失敗
    /// 已確認：SysUser.Password 是 nvarchar(max)，84 字元的雜湊放得下，不必改欄位。
    /// </summary>
    public class PasswordHashManager : IPasswordHashManager
    {
        // PasswordHasher 本身無狀態，共用一個實體即可；泛型參數在預設實作中未被使用，故以 object 帶入。
        private static readonly PasswordHasher<object> _hasher = new PasswordHasher<object>();

        // PasswordHasher 的 user 參數在預設實作中用不到，但仍給一個非 null 物件以免將來版本改為必填。
        private static readonly object _hashUserPlaceholder = new object();

        // Identity 雜湊還原後的位元組長度：v2 為 49、v3 為 84，取下限作為判斷門檻。
        private const int _minHashedByteLength = 49;

        public string HashPassword(string password)
        {
            if (string.IsNullOrEmpty(password)) return password;

            return _hasher.HashPassword(_hashUserPlaceholder, password);
        }

        public bool VerifyPassword(string storedPassword, string inputPassword, out bool needRehash)
        {
            needRehash = false;

            if (string.IsNullOrEmpty(storedPassword) || string.IsNullOrEmpty(inputPassword)) return false;

            if (!IsHashed(storedPassword))
            {
                // 舊資料為明文：比對成功後要求呼叫端升級成雜湊
                if (!string.Equals(storedPassword, inputPassword, StringComparison.Ordinal)) return false;

                needRehash = true;
                return true;
            }

            var result = _hasher.VerifyHashedPassword(_hashUserPlaceholder, storedPassword, inputPassword);

            if (result == PasswordVerificationResult.Failed) return false;

            needRehash = result == PasswordVerificationResult.SuccessRehashNeeded;
            return true;
        }

        /// <summary>
        /// 判斷儲存值看起來是否為 Identity 產生的雜湊字串。
        /// </summary>
        private static bool IsHashed(string value)
        {
            try
            {
                var bytes = Convert.FromBase64String(value);
                return bytes.Length >= _minHashedByteLength && (bytes[0] == 0x00 || bytes[0] == 0x01);
            }
            catch (FormatException)
            {
                // 不是合法 Base64 → 一定是舊明文
                return false;
            }
        }
    }
}
