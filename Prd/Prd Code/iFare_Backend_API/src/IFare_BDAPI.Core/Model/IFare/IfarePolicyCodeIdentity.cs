using System;
using System.Collections.Generic;
using Abp.Domain.Entities;

namespace IFare_BDAPI
{
    public partial class IfarePolicyCodeIdentity : Entity
    {
        public long Id { get; set; }
        public DateTime CreateTime { get; set; }
        public long IfarePolicyId { get; set; }
        public long CodeIdentityId { get; set; }

        public virtual CodeIdentity CodeIdentity { get; set; }
        public virtual IfarePolicy IfarePolicy { get; set; }
    }
}
