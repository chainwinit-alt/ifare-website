using System;
using System.Collections.Generic;
using Abp.AutoMapper;
using Abp.Timing;
using IFare_API.Common.Dto;
using IFare_API.Converter;
using IFare_API.TaskManager.News.ValueModel;
using Newtonsoft.Json;

namespace IFare_API.News.Dto 
{
    [AutoMapTo(typeof(NewsResult))]
    [AutoMapFrom(typeof(NewsResult))]
    public class NewsResultDto : ErrorInfoBaseDto
    {
        public List<NewsDataDto> Result { get; set; }
    }

    [AutoMapTo(typeof(NewsData))]
    [AutoMapFrom(typeof(NewsData))]
    public class NewsDataDto
    {
        public long ID { get; set; }
        public string Title { get; set; }
        
        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public string Content { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        [Newtonsoft.Json.JsonConverter(typeof(CDateTimeConverter_DotNoTime))]
        [DisableDateTimeNormalization]
        public DateTime ReleaseTime { get; set; }
    }
}