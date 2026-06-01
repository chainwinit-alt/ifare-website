using System;
using System.Security.Cryptography;

namespace IFare_BDAPI.Security
{
    public enum SysUserPasswordVerificationResult
    {
        Failed = 0,
        Success = 1,
        SuccessRehashNeeded = 2
    }

    public static class SysUserPasswordHasher
    {
        private const string Marker = "IFARE_PBKDF2_V1";
        private const char Separator = '$';
        private const int SaltSize = 16;
        private const int HashSize = 32;
        private const int Iterations = 100000;

        public static string HashPassword(string password)
        {
            if (string.IsNullOrEmpty(password))
            {
                throw new ArgumentException("Password is required.", nameof(password));
            }

            var salt = RandomNumberGenerator.GetBytes(SaltSize);
            var hash = Rfc2898DeriveBytes.Pbkdf2(
                password,
                salt,
                Iterations,
                HashAlgorithmName.SHA256,
                HashSize);

            return string.Join(
                Separator,
                Marker,
                Iterations.ToString(),
                Convert.ToBase64String(salt),
                Convert.ToBase64String(hash));
        }

        public static SysUserPasswordVerificationResult VerifyPassword(string storedPassword, string providedPassword)
        {
            if (string.IsNullOrEmpty(storedPassword) || string.IsNullOrEmpty(providedPassword))
            {
                return SysUserPasswordVerificationResult.Failed;
            }

            if (!IsHashedPassword(storedPassword))
            {
                return storedPassword == providedPassword
                    ? SysUserPasswordVerificationResult.SuccessRehashNeeded
                    : SysUserPasswordVerificationResult.Failed;
            }

            try
            {
                var parts = storedPassword.Split(Separator);
                if (parts.Length != 4 || !int.TryParse(parts[1], out var iterations))
                {
                    return SysUserPasswordVerificationResult.Failed;
                }

                var salt = Convert.FromBase64String(parts[2]);
                var expectedHash = Convert.FromBase64String(parts[3]);
                var actualHash = Rfc2898DeriveBytes.Pbkdf2(
                    providedPassword,
                    salt,
                    iterations,
                    HashAlgorithmName.SHA256,
                    expectedHash.Length);

                if (!CryptographicOperations.FixedTimeEquals(actualHash, expectedHash))
                {
                    return SysUserPasswordVerificationResult.Failed;
                }

                return iterations < Iterations
                    ? SysUserPasswordVerificationResult.SuccessRehashNeeded
                    : SysUserPasswordVerificationResult.Success;
            }
            catch (FormatException)
            {
                return SysUserPasswordVerificationResult.Failed;
            }
            catch (ArgumentException)
            {
                return SysUserPasswordVerificationResult.Failed;
            }
        }

        public static bool IsHashedPassword(string storedPassword)
        {
            return !string.IsNullOrEmpty(storedPassword)
                && storedPassword.StartsWith(Marker + Separator, StringComparison.Ordinal);
        }
    }
}
