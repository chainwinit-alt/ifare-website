using System;
using System.Collections.Generic;

namespace IFare_BDAPI.TaskManager.Articles.Welfare.ValueModel
{
    public class ArticlesWelfareFilterParam 
    {
        public DateTime? CreateDateStart { get; set; }
        public DateTime? CreateDateEnd { get; set; }
        public DateTime? UpdateDateStart { get; set; }
        public DateTime? UpdateDateEnd { get; set; }
        public DateTime? ReleaseTimeStart { get; set; }
        public DateTime? ReleaseTimeEnd { get; set; }
        public DateTime? DiscontinuedTimeStart { get; set; }
        public DateTime? DiscontinuedTimeEnd { get; set; }
        public long? CodePolicy {get; set; }
        public List<long>? CodeKeywords {get; set; }
        public string State { get; set; }
        public List<long>? IDs { get; set; }
        public bool IsIDsFiltered { get; set; } = false;
        public bool IsCreateDateFiltered { get; set; } = false;
        public bool IsUpdateDateFiltered { get; set;} = false;
        public bool IsReleaseTimeFiltered { get; set;} = false;
        public bool IsDiscontinuedFiltered { get; set;} = false;
        public bool IsCodePolicyFiltered { get; set; } = false;
        public bool IsCodeKeywordsFiltered { get; set; } = false;
        public bool IsStateFiltered { get; set;} = false;
    }
}