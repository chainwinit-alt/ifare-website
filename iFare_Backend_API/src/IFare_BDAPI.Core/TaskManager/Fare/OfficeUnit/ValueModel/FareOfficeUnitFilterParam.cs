using System;
using System.Collections.Generic;

namespace IFare_BDAPI.TaskManager.Fare.OfficeUnit.ValueModel
{
    public class FareOfficeUnitFilterParam 
    {
        public DateTime? CreateDateStart { get; set; }
        public DateTime? CreateDateEnd { get; set; }
        public DateTime? UpdateDateStart { get; set; }
        public DateTime? UpdateDateEnd { get; set; }
        public string? SearchName { get; set; }
        public List<long>? IDs { get; set; }
        public bool IsContainElse { get; set; } = false;
        public bool IsIDsFiltered { get; set; } = false;
        public bool IsCreateDateFiltered { get; set; } = false;
        public bool IsUpdateDateFiltered { get; set;} = false;
        public bool IsSearchNameFiltered { get; set; } = false;
    }
}