using System;
using System.Collections.Generic;
using Abp.AutoMapper;
using IFare_BDAPI.TaskManager.Articles.Welfare.ValueModel;

namespace IFare_BDAPI.Articles.Welfare.Dto 
{
    [AutoMapTo(typeof(ArticlesWelfareFilterParam))]
    public class ArticlesWelfareFilterParamDto
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
    }
}