using System;
using System.Collections.Generic;
using Abp.AutoMapper;
using Abp.Timing;
using IFare_API.Common.Dto;
using IFare_API.Converter;
using IFare_API.TaskManager.Fare.Policy.ValueModel;
using Newtonsoft.Json;

namespace IFare_API.Fare.Policy.Dto
{
    [AutoMapTo(typeof(FarePolicySuggestionResult))]
    [AutoMapFrom(typeof(FarePolicySuggestionResult))]
    public class FarePolicySuggestionResultDto : ErrorInfoBaseDto
    {
        public FarePolicySuggestionPayloadDto Result { get; set; }
    }

    [AutoMapTo(typeof(FarePolicySuggestionPayload))]
    [AutoMapFrom(typeof(FarePolicySuggestionPayload))]
    public class FarePolicySuggestionPayloadDto
    {
        public List<string> HotKeywords { get; set; }
        public List<FarePolicySuggestionItemDto> Suggestions { get; set; }
    }

    [AutoMapTo(typeof(FarePolicySuggestionItem))]
    [AutoMapFrom(typeof(FarePolicySuggestionItem))]
    public class FarePolicySuggestionItemDto
    {
        public string Text { get; set; }
        public string Type { get; set; }
        public int MatchCount { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        [Newtonsoft.Json.JsonConverter(typeof(CDateTimeConverter_DotNoTime))]
        [DisableDateTimeNormalization]
        public DateTime? LatestReleaseTime { get; set; }
    }
}
