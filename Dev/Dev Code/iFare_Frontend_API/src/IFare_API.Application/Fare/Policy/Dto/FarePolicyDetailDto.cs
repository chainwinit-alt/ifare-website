using System;
using System.Collections.Generic;
using Abp.AutoMapper;
using Abp.Timing;
using IFare_API.Code.Dto;
using IFare_API.Common.Dto;
using IFare_API.Converter;
using IFare_API.TaskManager.Fare.Policy.ValueModel;
using Newtonsoft.Json;

namespace IFare_API.Fare.Policy.Dto
{
    [AutoMapTo(typeof(FarePolicyDetail))]
    [AutoMapFrom(typeof(FarePolicyDetail))]
    public class FarePolicyDetailDto : ErrorInfoBaseDto
    {
        public FarePolicyDetailDataDto Result { get; set; }
    }

    [AutoMapTo(typeof(FarePolicyDetailData))]
    [AutoMapFrom(typeof(FarePolicyDetailData))]
    public class FarePolicyDetailDataDto
    {
        public long ID { get; set; }
        public string Title { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public string Qualification { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public string WelfareInfo { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public string Evidence { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public long IFareOfficeUnitID { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public string OfficeUnitInfo { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public string OfficeUnitTel { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public long CodeDomicile_ID { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public string CodeDomicile_LabelName { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public long CodePolicy_ID { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public string CodePolicy_LabelName { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public List<CodeDataDto> CodeKeywordList { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public List<CodeDataDto> CodeIdentityList { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public List<CodeDataDto> CodeIncomeList { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public List<CodeDataDto> CodeRecipientList { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public string CompetentAuthority { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        [Newtonsoft.Json.JsonConverter(typeof(CDateTimeConverter_DotNoTime))]
        [DisableDateTimeNormalization]
        public DateTime? ReleaseTime { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        [Newtonsoft.Json.JsonConverter(typeof(CDateTimeConverter_DotNoTime))]
        [DisableDateTimeNormalization]
        public DateTime? DiscontinuedTime { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        [Newtonsoft.Json.JsonConverter(typeof(CDateTimeConverter_DotNoTime))]
        [DisableDateTimeNormalization]
        public DateTime? UpdateTime { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        public string Remark { get; set; }
    }
}