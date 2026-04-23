using System.Collections.Generic;

namespace IFare_BDAPI.TaskManager.Account.ValueModel
{
    public class AccountFilterParam
    {
        public string Permission { get; set; }
        public string State { get; set; }
        public string Account { get; set; }
        public List<long>? IDs { get; set; }
        public bool IsIDsFiltered { get; set; } = false;
        public bool IsPermissionFiltered { get; set; } = false;
        public bool IsStateFiltered { get; set;} = false;
        public bool IsAccountFiltered { get; set; } = false;
    }
}