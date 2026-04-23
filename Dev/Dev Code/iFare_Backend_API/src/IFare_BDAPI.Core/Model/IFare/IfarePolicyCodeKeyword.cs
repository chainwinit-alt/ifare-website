using System;
using System.Collections.Generic;
using Abp.Domain.Entities;

namespace IFare_BDAPI
{
    public partial class IfarePolicyCodeKeyword : Entity
    {
        public long Id { get; set; }
        public DateTime CreateTime { get; set; }
        public long IfarePolicyId { get; set; }
        public long CodeKeywordId { get; set; }

        public virtual CodeKeyword CodeKeyword { get; set; }
        public virtual IfarePolicy IfarePolicy { get; set; }
    }
}
