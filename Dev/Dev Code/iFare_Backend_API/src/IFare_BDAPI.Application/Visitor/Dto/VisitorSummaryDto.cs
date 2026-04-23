using System;
using Abp.AutoMapper;
using Abp.Timing;
using IFare_BDAPI.Common.Dto;
using IFare_BDAPI.Converter;
using IFare_BDAPI.TaskManager.Visitor.ValueModel;
using Newtonsoft.Json;

namespace IFare_BDAPI.Visitor.Dto
{
    [AutoMapTo(typeof(VisitorSummary))]
    [AutoMapFrom(typeof(VisitorSummary))]
    public class VisitorSummaryDto : ErrorInfoBaseDto 
    {
        public SummaryInfoDto Result { get; set; }
    } 

    [AutoMapTo(typeof(SummaryInfo))]
    [AutoMapFrom(typeof(SummaryInfo))]
    public class SummaryInfoDto
    {
        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        [Newtonsoft.Json.JsonConverter(typeof(CDateTimeConverter_NoTime))]
        [DisableDateTimeNormalization]
        public DateTime CurrentDate { get; set; }
        public int CurrentPeople { get; set; }
        public int CurrentVisits { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        [Newtonsoft.Json.JsonConverter(typeof(CDateTimeConverter_NoTime))]
        [DisableDateTimeNormalization]
        public DateTime TTLStartDate { get; set; }
        public int TTLPeople { get; set; }
        public int TTLVisits { get; set; }
    }
}