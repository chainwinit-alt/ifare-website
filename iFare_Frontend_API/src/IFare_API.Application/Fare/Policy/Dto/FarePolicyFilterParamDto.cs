using System.Collections.Generic;
using Abp.AutoMapper;
using IFare_API.TaskManager.Fare.Policy.ValueModel;

namespace IFare_API.Fare.Policy.Dto
{
    [AutoMapTo(typeof(FarePolicyFilterParam))]
    public class FarePolicyFilterParamDto
    {
        public long? CodeDomicile { get; set; }
        public long? CodeRecipient { get; set; }
        public long? CodePolicy {get; set; }
        public long? CodeIncome { get; set; }
        public List<long>? CodeIdentities {get; set; }
        public string? Keyword { get; set; }
        public int? SkipCount { get; set; }
        public int? MaxResultCount { get; set; }
    }
}