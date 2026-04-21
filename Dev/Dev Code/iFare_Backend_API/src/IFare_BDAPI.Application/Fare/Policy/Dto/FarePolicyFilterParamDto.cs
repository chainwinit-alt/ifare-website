using System;
using System.Collections.Generic;
using Abp.AutoMapper;
using IFare_BDAPI.TaskManager.Fare.Policy.ValueModel;

namespace IFare_BDAPI.Fare.Policy.Dto
{
    [AutoMapTo(typeof(FarePolicyFilterParam))]
    public class FarePolicyFilterParamDto
    {
        public DateTime? CreateDateStart { get; set; }
        public DateTime? CreateDateEnd { get; set; }
        public DateTime? UpdateDateStart { get; set; }
        public DateTime? UpdateDateEnd { get; set; }
        public DateTime? ReleaseTimeStart { get; set; }
        public DateTime? ReleaseTimeEnd { get; set; }
        public DateTime? DiscontinuedTimeStart { get; set; }
        public DateTime? DiscontinuedTimeEnd { get; set; }
        public long? CodeDomicile { get; set; }
        public long? CodePolicy {get; set; }
        public List<long>? CodeKeywords {get; set; }
        public string State { get; set; }
        public List<long>? IDs { get; set; }
        public string State_Release { get; set; }
    }
}