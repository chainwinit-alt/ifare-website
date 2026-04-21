using System;
using System.Collections.Generic;
using Abp.Domain.Entities;

namespace IFare_API
{
    public partial class IfarePolicyCodeRecipient : Entity
    {
        public long Id { get; set; }
        public DateTime CreateTime { get; set; }
        public long IfarePolicyId { get; set; }
        public long CodeRecipientId { get; set; }

        public virtual CodeRecipient CodeRecipient { get; set; }
        public virtual IfarePolicy IfarePolicy { get; set; }
    }
}
