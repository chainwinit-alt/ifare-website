using System;
using System.Collections.Generic;
using Abp.AutoMapper;
using IFare_BDAPI.TaskManager.Fare.QA.ValueModel;

namespace IFare_BDAPI.Fare.QA.Dto
{
    [AutoMapTo(typeof(FareQAFilterParam))]
    public class FareQAFilterParamDto
    {
        public DateTime? CreateDateStart { get; set; }
        public DateTime? CreateDateEnd { get; set; }
        public DateTime? UpdateDateStart { get; set; }
        public DateTime? UpdateDateEnd { get; set; }
        public List<long>? IDs { get; set; }
    }
}