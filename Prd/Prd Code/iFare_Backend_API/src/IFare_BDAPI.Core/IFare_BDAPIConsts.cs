using IFare_BDAPI.Debugging;

namespace IFare_BDAPI
{
    public class IFare_BDAPIConsts
    {
        public const string LocalizationSourceName = "IFare_BDAPI";

        public const string ConnectionStringName = "Default";

        public const bool MultiTenancyEnabled = true;


        /// <summary>
        /// Default pass phrase for SimpleStringCipher decrypt/encrypt operations
        /// </summary>
        public static readonly string DefaultPassPhrase =
            DebugHelper.IsDebug ? "gsKxGZ012HLL3MI5" : "7630e1529d89490e91527de73bac26e3";
    }
}
