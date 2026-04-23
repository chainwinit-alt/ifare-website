using System;
using System.Collections.Generic;

namespace IFare_BDAPI.TaskManager.Fare.QA.ValueModel
{
    public class FareQAFilterParam 
    {
        public DateTime? CreateDateStart { get; set; }
        public DateTime? CreateDateEnd { get; set; }
        public DateTime? UpdateDateStart { get; set; }
        public DateTime? UpdateDateEnd { get; set; }
        public List<long>? IDs { get; set; }
        public bool IsIDsFiltered { get; set; } = false;
        public bool IsCreateDateFiltered { get; set; } = false;
        public bool IsUpdateDateFiltered { get; set;} = false;
    }
}