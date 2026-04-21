using Newtonsoft.Json.Converters;

namespace IFare_BDAPI.Converter 
{
    public class CDateTimeConverter_NoTime : IsoDateTimeConverter
    {
        public CDateTimeConverter_NoTime() 
        {
            base.DateTimeFormat = "yyyy/MM/dd";
        }
    }
}