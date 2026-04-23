using System;
using System.Collections.Generic;
using Abp.AutoMapper;
using Abp.Timing;
using IFare_API.Articles.Lazy.Dto;
using IFare_API.Code.Dto;
using IFare_API.Common.Dto;
using IFare_API.Converter;
using IFare_API.TaskManager.Articles.Welfare.ValueModel;
using Newtonsoft.Json;

namespace IFare_API.Articles.Welfare.Dto
{
    [AutoMapTo(typeof(ArticlesWelfareResult))]
    [AutoMapFrom(typeof(ArticlesWelfareResult))]
    public class ArticlesWelfareResultDto : ErrorInfoBaseDto
    {
        public List<ArticlesWelfareDataDto> Result { get; set; }
    }

    [AutoMapTo(typeof(ArticlesWelfareData))]
    [AutoMapFrom(typeof(ArticlesWelfareData))]
    public class ArticlesWelfareDataDto
    {
        public long ID { get; set; }
        public string Title { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public string Detail { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public long CodePolicy_ID { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public string CodePolicy_LabelName { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public List<CodeDataDto> CodeKeywordList { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        [Newtonsoft.Json.JsonConverter(typeof(CDateTimeConverter_DotNoTime))]
        [DisableDateTimeNormalization]
        public DateTime? ReleaseTime { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        [Newtonsoft.Json.JsonConverter(typeof(CDateTimeConverter_DotNoTime))]
        [DisableDateTimeNormalization]
        public DateTime CreateTime { get; set; }
    }
}