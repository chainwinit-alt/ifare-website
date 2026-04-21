using System;
using System.Collections.Generic;
using Abp.AutoMapper;
using Abp.Timing;
using IFare_BDAPI.Common.Dto;
using IFare_BDAPI.Converter;
using IFare_BDAPI.TaskManager.News.ValueModel;
using Newtonsoft.Json;

namespace IFare_BDAPI.News.Dto 
{
    [AutoMapTo(typeof(NewsResult))]
    [AutoMapFrom(typeof(NewsResult))]
    public class NewsResultDto : ErrorInfoBaseDto
    {
        public List<NewsDataDto> Result { get; set; }
    }

    [AutoMapTo(typeof(NewsData))]
    [AutoMapFrom(typeof(NewsData))]
    public class NewsDataDto : EditorUserBaseDto
    {
        public long ID { get; set; }
        public string Title { get; set; }
        public string Detail { get; set; }
        public string State { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        [Newtonsoft.Json.JsonConverter(typeof(CDateTimeConverter_NoSec))]
        [DisableDateTimeNormalization]
        public DateTime? ReleaseTime { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        [Newtonsoft.Json.JsonConverter(typeof(CDateTimeConverter_NoSec))]
        [DisableDateTimeNormalization]
        public DateTime? DiscontinuedTime { get; set; }
    }
}