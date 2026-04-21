using IFare_API.Debugging;

namespace IFare_API
{
    public class IFare_APIConsts
    {
        public const string LocalizationSourceName = "IFare_API";

        public const string ConnectionStringName = "Default";

        public const bool MultiTenancyEnabled = true;


        /// <summary>
        /// Default pass phrase for SimpleStringCipher decrypt/encrypt operations
        /// </summary>
        public static readonly string DefaultPassPhrase =
            DebugHelper.IsDebug ? "gsKxGZ012HLL3MI5" : "e366358f8eb94949adae4b18f18eac05";
    }
}
