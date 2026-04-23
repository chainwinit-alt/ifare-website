using System;
using System.Collections.Generic;
using Abp.Domain.Entities;

namespace IFare_BDAPI
{
    public partial class CodeRecipient : Entity
    {
        public CodeRecipient()
        {
            IfarePolicyCodeRecipients = new HashSet<IfarePolicyCodeRecipient>();
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
        public virtual ICollection<IfarePolicyCodeRecipient> IfarePolicyCodeRecipients { get; set; }
    }
}
