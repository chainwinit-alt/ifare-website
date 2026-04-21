using System;
using System.Collections.Generic;
using Abp.AutoMapper;
using Abp.Timing;
using IFare_BDAPI.Code.Dto;
using IFare_BDAPI.Common.Dto;
using IFare_BDAPI.Converter;
using IFare_BDAPI.TaskManager.Fare.Policy.ValueModel;
using Newtonsoft.Json;

namespace IFare_BDAPI.Fare.Policy.Dto
{
    [AutoMapTo(typeof(FarePolicyResult))]
    [AutoMapFrom(typeof(FarePolicyResult))]
    public class FarePolicyResultDto : ErrorInfoBaseDto
    {
        public List<FarePolicyDataDto> Result { get; set; }
    }

    [AutoMapTo(typeof(FarePolicyData))]
    [AutoMapFrom(typeof(FarePolicyData))]
    public class FarePolicyDataDto : EditorUserBaseDto
    {
        public long ID { get; set; }
        public string Title { get; set; }
        public string? Qualification { get; set; }
        public string? WelfareInfo { get; set; }
        public string? Evidence { get; set; }
        public long IFareOfficeUnitID { get; set; }
        public string IFareOfficeUnit { get; set; }
        public string OfficeUnitInfo { get; set; }
        public string OfficeUnitTel { get; set; }
        public long CodeDomicile_ID { get; set; }
        public string CodeDomicile_LabelName { get; set; }
        public long CodePolicy_ID { get; set; }
        public string CodePolicy_LabelName { get; set; }
        public List<CodeDataDto> CodeKeywordList { get; set; }
        public List<CodeDataDto> CodeIdentityList { get; set; }
        public List<CodeDataDto> CodeIncomeList { get; set; }
        public List<CodeDataDto> CodeRecipientList { get; set; }
        public string CompetentAuthority { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        [Newtonsoft.Json.JsonConverter(typeof(CDateTimeConverter_NoSec))]
        [DisableDateTimeNormalization]
        public DateTime? ReleaseTime { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Include)]
        [Newtonsoft.Json.JsonConverter(typeof(CDateTimeConverter_NoSec))]
        [DisableDateTimeNormalization]
        public DateTime? DiscontinuedTime { get; set; }
        public string Remark { get; set; }
        public string State { get; set; }
        public string State_Release { get; set; }
    }
}