using Abp.Configuration.Startup;
using Abp.Localization.Dictionaries;
using Abp.Localization.Dictionaries.Xml;
using Abp.Reflection.Extensions;

namespace IFare_BDAPI.Localization
{
    public static class IFare_BDAPILocalizationConfigurer
    {
        public static void Configure(ILocalizationConfiguration localizationConfiguration)
        {
            localizationConfiguration.Sources.Add(
                new DictionaryBasedLocalizationSource(IFare_BDAPIConsts.LocalizationSourceName,
                    new XmlEmbeddedFileLocalizationDictionaryProvider(
                        typeof(IFare_BDAPILocalizationConfigurer).GetAssembly(),
                        "IFare_BDAPI.Localization.SourceFiles"
                    )
                )
            );
        }
    }
}
