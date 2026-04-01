using Newtonsoft.Json.Converters;

namespace IFare_API.Converter
{
    public class CDateTimeConverter_DotNoTime : IsoDateTimeConverter
    {
        public CDateTimeConverter_DotNoTime() 
        {
            base.DateTimeFormat = "yyyy.MM.dd";
        }
    }
}