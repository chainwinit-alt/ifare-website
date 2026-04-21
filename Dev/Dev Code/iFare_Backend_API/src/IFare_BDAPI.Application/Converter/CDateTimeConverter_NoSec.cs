using Newtonsoft.Json.Converters;

namespace IFare_BDAPI.Converter 
{
    public class CDateTimeConverter_NoSec : IsoDateTimeConverter
    {
        public CDateTimeConverter_NoSec() 
        {
            base.DateTimeFormat = "yyyy/MM/ddTHH:mm";
        }
    }
}