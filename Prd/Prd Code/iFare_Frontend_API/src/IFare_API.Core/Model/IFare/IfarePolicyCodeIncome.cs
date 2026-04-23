using System;
using System.Collections.Generic;
using Abp.Domain.Entities;

namespace IFare_API
{
    public partial class IfarePolicyCodeIncome : Entity
    {
        public long Id { get; set; }
        public DateTime CreateTime { get; set; }
        public long IfarePolicyId { get; set; }
        public long CodeIncomeId { get; set; }

        public virtual CodeIncome CodeIncome { get; set; }
        public virtual IfarePolicy IfarePolicy { get; set; }
    }
}
