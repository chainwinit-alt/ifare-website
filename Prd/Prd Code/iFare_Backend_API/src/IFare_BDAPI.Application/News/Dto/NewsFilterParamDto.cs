using System;
using System.Collections.Generic;
using Abp.AutoMapper;
using IFare_BDAPI.TaskManager.News.ValueModel;

namespace IFare_BDAPI.News.Dto 
{
    [AutoMapTo(typeof(NewsFilterParam))]
    public class NewsFilterParamDto
    {
        public DateTime? CreateDateStart { get; set; }
        public DateTime? CreateDateEnd { get; set; }
        public DateTime? UpdateDateStart { get; set; }
        public DateTime? UpdateDateEnd { get; set; }
        public string State { get; set; }
        public List<long>? IDs { get; set; }
    }
}