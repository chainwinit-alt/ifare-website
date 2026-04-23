using System;
using System.Collections.Generic;
using Abp.AutoMapper;
using Abp.Timing;
using IFare_BDAPI.Code.Dto;
using IFare_BDAPI.Common.Dto;
using IFare_BDAPI.Converter;
using IFare_BDAPI.TaskManager.Articles.Welfare.ValueModel;
using Newtonsoft.Json;

namespace IFare_BDAPI.Articles.Welfare.Dto
{
    [AutoMapTo(typeof(ArticlesWelfareResult))]
    [AutoMapFrom(typeof(ArticlesWelfareResult))]
    public class ArticlesWelfareResultDto : ErrorInfoBaseDto
    {
        public List<ArticlesWelfareDataDto> Result { get; set; }
    }

    [AutoMapTo(typeof(ArticlesWelfareData))]
    [AutoMapFrom(typeof(ArticlesWelfareData))]
    public class ArticlesWelfareDataDto : EditorUserBaseDto
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