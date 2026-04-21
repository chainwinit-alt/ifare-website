using System;
using System.Collections.Generic;
using Abp.AutoMapper;
using Abp.Timing;
using IFare_BDAPI.Code.Dto;
using IFare_BDAPI.Common.Dto;
using IFare_BDAPI.Converter;
using IFare_BDAPI.TaskManager.Articles.Lazy.ValueModel;
using Newtonsoft.Json;

namespace IFare_BDAPI.Articles.Lazy.Dto
{
    [AutoMapTo(typeof(ArticlesLazyResult))]
    [AutoMapFrom(typeof(ArticlesLazyResult))]
    public class ArticlesLazyResultDto : ErrorInfoBaseDto
    {
        public List<ArticlesLazyDataDto> Result { get; set; }
    }

    [AutoMapTo(typeof(ArticlesLazyData))]
    [AutoMapFrom(typeof(ArticlesLazyData))]
    public class ArticlesLazyDataDto : EditorUserBaseDto
    {
        public long ID { get; set; }
        public string Title { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public List<ImageInfoDto> ImageList { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public long CodePolicy_ID { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public string CodePolicy_LabelName { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public List<CodeDataDto> CodeKeywordList { get; set; }
        
        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        [Newtonsoft.Json.JsonConverter(typeof(CDateTimeConverter_NoSec))]
        [DisableDateTimeNormalization]
        public DateTime? ReleaseTime { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        [Newtonsoft.Json.JsonConverter(typeof(CDateTimeConverter_NoSec))]
        [DisableDateTimeNormalization]
        public DateTime? DiscontinuedTime { get; set; }
        public string State { get; set; }
    }
}