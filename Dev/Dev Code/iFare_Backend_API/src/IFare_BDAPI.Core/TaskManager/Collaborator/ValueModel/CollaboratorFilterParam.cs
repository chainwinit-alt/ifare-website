using System;
using System.Collections.Generic;

namespace IFare_BDAPI.TaskManager.Collaborator.ValueModel
{
    public class CollaboratorFilterParam 
    {
        public string State { get; set; }
        public DateTime? UpdateDateStart { get; set; }
        public DateTime? UpdateDateEnd { get; set; }
        public string? SearchName { get; set; }
        public List<long>? IDs { get; set; }
        public bool IsIDsFiltered { get; set; } = false;
        public bool IsStateFiltered { get; set; } = false;
        public bool IsUpdateDateFiltered { get; set;} = false;
        public bool IsSearchNameFiltered { get; set; } = false;
    }
}