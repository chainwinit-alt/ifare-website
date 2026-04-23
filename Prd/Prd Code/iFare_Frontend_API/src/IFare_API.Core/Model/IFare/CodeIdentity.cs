using System;
using System.Collections.Generic;
using Abp.Domain.Entities;

namespace IFare_API
{
    public partial class CodeIdentity : Entity
    {
        public CodeIdentity()
        {
            IfarePolicyCodeIdentities = new HashSet<IfarePolicyCodeIdentity>();
        }

        public long Id { get; set; }
        public DateTime CreateTime { get; set; }
        public DateTime? UpdateTime { get; set; }
        public string LabelName { get; set; }
        public string State { get; set; }
        public long? CreateUserId { get; set; }
        public long? UpdateUserId { get; set; }

        public virtual SysUser CreateUser { get; set; }
        public virtual SysUser UpdateUser { get; set; }
        public virtual ICollection<IfarePolicyCodeIdentity> IfarePolicyCodeIdentities { get; set; }
    }
}
