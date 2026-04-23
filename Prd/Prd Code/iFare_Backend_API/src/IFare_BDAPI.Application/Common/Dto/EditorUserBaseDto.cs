using System;
using Abp.AutoMapper;
using Abp.Timing;
using IFare_BDAPI.Common.ValueModel;
using IFare_BDAPI.Converter;
using Newtonsoft.Json;

namespace IFare_BDAPI.Common.Dto
{
    [AutoMapTo(typeof(EditorUserBase))]
    [AutoMapFrom(typeof(EditorUserBase))]
    public class EditorUserBaseDto
    {
        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public string? CreateUserName { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public long? CreateUserID { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        [Newtonsoft.Json.JsonConverter(typeof(CDateTimeConverter_NoTime))]
        [DisableDateTimeNormalization]
        public DateTime? CreateDate { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public string? UpdateUserName { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public long? UpdateUserID { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        [Newtonsoft.Json.JsonConverter(typeof(CDateTimeConverter_NoTime))]
        [DisableDateTimeNormalization]
        public DateTime? UpdateDate { get; set; }
    }
}
