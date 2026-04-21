using System;
using System.Collections.Generic;
using Abp.AutoMapper;
using Abp.Timing;
using IFare_API.Code.Dto;
using IFare_API.Common.Dto;
using IFare_API.Converter;
using IFare_API.TaskManager.Articles.Lazy.ValueModel;
using Newtonsoft.Json;

namespace IFare_API.Articles.Lazy.Dto
{
    [AutoMapTo(typeof(ArticlesLazyDetail))]
    [AutoMapFrom(typeof(ArticlesLazyDetail))]
    public class ArticlesLazyDetailDto : ErrorInfoBaseDto
    {
        public ArticlesLazyInfo Result { get; set; }
    }

    [AutoMapTo(typeof(ArticlesLazyInfo))]
    [AutoMapFrom(typeof(ArticlesLazyInfo))]
    public class ArticlesLazyInfoDto
    {
        public long ID { get; set; }
        public string Title { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public long CodePolicy_ID { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public string CodePolicy_LabelName { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public List<ImageInfoDto> ImageList { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public List<CodeDataDto> CodeKeywordList { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        [Newtonsoft.Json.JsonConverter(typeof(CDateTimeConverter_DotNoTime))]
        [DisableDateTimeNormalization]
        public DateTime? ReleaseTime { get; set; }
    }
}