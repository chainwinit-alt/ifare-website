using System;
using System.Collections.Generic;
using Abp.AutoMapper;
using Abp.Timing;
using IFare_API.Common.Dto;
using IFare_API.Converter;
using IFare_API.TaskManager.Fare.OfficeUnit.ValueModel;
using Newtonsoft.Json;

namespace IFare_API.Fare.OfficeUnit.Dto 
{
    [AutoMapTo(typeof(FareOfficeUnitResult))]
    [AutoMapFrom(typeof(FareOfficeUnitResult))]
    public class FareOfficeUnitResultDto : ErrorInfoBaseDto
    {
        public List<FareOfficeUnitDataDto> Result { get; set; }
    }

    [AutoMapTo(typeof(FareOfficeUnitData))]
    [AutoMapFrom(typeof(FareOfficeUnitData))]
    public class FareOfficeUnitDataDto
    {
        public long ID { get; set; }
        public string Title { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        [Newtonsoft.Json.JsonConverter(typeof(CDateTimeConverter_DotNoTime))]
        [DisableDateTimeNormalization]
        public DateTime ReleaseTime { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        [Newtonsoft.Json.JsonConverter(typeof(CDateTimeConverter_DotNoTime))]
        [DisableDateTimeNormalization]
        public DateTime? UpdateTime { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public List<FareOfficeDomicileDataDto> OfficeList { get; set; }
    }

    [AutoMapTo(typeof(FareOfficeDomicileData))]
    [AutoMapFrom(typeof(FareOfficeDomicileData))]
    public class FareOfficeDomicileDataDto 
    {
        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public long CodeDomicile_ID { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public string CodeDomicile_LabelName { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public List<FareOfficeDetailDataDto> UnitList { get; set; }
        
    }

    [AutoMapTo(typeof(FareOfficeDetailData))]
    [AutoMapFrom(typeof(FareOfficeDetailData))]
    public class FareOfficeDetailDataDto
    {
        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public string UnitName { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public string Tel { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public string Address { get; set; }
    }
}