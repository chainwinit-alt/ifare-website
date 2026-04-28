using System.Collections.Generic;

namespace IFare_API.TaskManager.Fare.Policy.ValueModel
{
    public class FarePolicyFilterParam
    {
        public const int DefaultMaxResultCount = 20;
        public const int HardMaxResultCount = 50;

        public long? CodeDomicile { get; set; }
        public long? CodeRecipient { get; set; }
        public long? CodePolicy {get; set; }
        public long? CodeIncome { get; set; }
        public List<long>? CodeIdentities {get; set; }
        public string? Keyword { get; set; }
        public int? SkipCount { get; set; }
        public int? MaxResultCount { get; set; }
        public bool IsCodeDomicileFiltered { get; set; } = false;
        public bool IsCodeRecipientFiltered { get; set; } = false;
        public bool IsCodePolicyFiltered { get; set; } = false;
        public bool IsCodeIncomeFiltered { get; set; } = false;
        public bool IsCodeIdentitiesFiltered { get; set; } = false;
        public bool IsKeywordFiltered { get; set; } = false;

        public int GetEffectiveSkip() => SkipCount.GetValueOrDefault(0) < 0 ? 0 : SkipCount.GetValueOrDefault(0);

        public int GetEffectiveTake()
        {
            var take = MaxResultCount.GetValueOrDefault(DefaultMaxResultCount);
            if (take <= 0) return DefaultMaxResultCount;
            if (take > HardMaxResultCount) return HardMaxResultCount;
            return take;
        }
    }
}