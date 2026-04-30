using System.Collections.Generic;

namespace IFare_API.TaskManager.Fare.Policy.ValueModel
{
    public class FarePolicyFilterParam 
    {
        public string Query { get; set; }
        public long? CodeDomicile { get; set; }
        public long? CodeRecipient { get; set; }
        public long? CodePolicy {get; set; }
        public long? CodeIncome { get; set; }
        public List<long>? CodeIdentities {get; set; }
        public bool IsQueryFiltered { get; set; } = false;
        public bool IsCodeDomicileFiltered { get; set; } = false;
        public bool IsCodeRecipientFiltered { get; set; } = false;
        public bool IsCodePolicyFiltered { get; set; } = false;
        public bool IsCodeIncomeFiltered { get; set; } = false;
        public bool IsCodeIdentitiesFiltered { get; set; } = false;
    }
}
