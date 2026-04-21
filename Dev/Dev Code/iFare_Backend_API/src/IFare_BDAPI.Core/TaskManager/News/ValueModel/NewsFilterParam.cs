using System;
using System.Collections.Generic;

namespace IFare_BDAPI.TaskManager.News.ValueModel
{
    public class NewsFilterParam 
    {
        public DateTime? CreateDateStart { get; set; }
        public DateTime? CreateDateEnd { get; set; }
        public DateTime? UpdateDateStart { get; set; }
        public DateTime? UpdateDateEnd { get; set; }
        public string State { get; set; }
        public List<long>? IDs { get; set; }
        public bool IsIDsFiltered { get; set; } = false;
        public bool IsCreateDateFiltered { get; set; } = false;
        public bool IsUpdateDateFiltered { get; set;} = false;
        public bool IsStateFiltered { get; set; } = false;
    }
}