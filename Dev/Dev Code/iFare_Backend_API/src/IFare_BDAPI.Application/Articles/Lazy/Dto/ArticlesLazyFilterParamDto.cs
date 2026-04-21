using System;
using System.Collections.Generic;
using Abp.AutoMapper;
using IFare_BDAPI.TaskManager.Articles.Lazy.ValueModel;

namespace IFare_BDAPI.Articles.Lazy.Dto
{
    [AutoMapTo(typeof(ArticlesLazyFilterParam))]
    public class ArticlesLazyFilterParamDto
    {
        public DateTime? CreateDateStart { get; set; }
        public DateTime? CreateDateEnd { get; set; }
        public DateTime? UpdateDateStart { get; set; }
        public DateTime? UpdateDateEnd { get; set; }
        public DateTime? ReleaseTimeStart { get; set; }
        public DateTime? ReleaseTimeEnd { get; set; }
        public DateTime? DiscontinuedTimeStart { get; set; }
        public DateTime? DiscontinuedTimeEnd { get; set; }
        public List<long>? CodeKeywords {get; set; }
        public string State { get; set; }
        public List<long>? IDs { get; set; }
    }
}