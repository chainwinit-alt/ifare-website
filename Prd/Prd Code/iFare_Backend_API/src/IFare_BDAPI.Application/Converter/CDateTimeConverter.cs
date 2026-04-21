using Newtonsoft.Json.Converters;

namespace IFare_BDAPI.Converter 
{
    public class CDateTimeConverter : IsoDateTimeConverter
    {
        public CDateTimeConverter() 
        {
            base.DateTimeFormat = "yyyy/MM/ddTHH:mm:ss";
        }
    }
}