using System;
using System.Collections.Generic;
using Abp.AutoMapper;
using IFare_BDAPI.TaskManager.Fare.OfficeUnit.ValueModel;

namespace IFare_BDAPI.Fare.OfficeUnit.Dto
{
    [AutoMapTo(typeof(FareOfficeUnitFilterParam))]
    public class FareOfficeUnitFilterParamDto
    {
        public DateTime? CreateDateStart { get; set; }
        public DateTime? CreateDateEnd { get; set; }
        public DateTime? UpdateDateStart { get; set; }
        public DateTime? UpdateDateEnd { get; set; }
        public string? SearchName { get; set; }
        public List<long>? IDs { get; set; }
        public bool IsContainElse { get; set; }
    }
}