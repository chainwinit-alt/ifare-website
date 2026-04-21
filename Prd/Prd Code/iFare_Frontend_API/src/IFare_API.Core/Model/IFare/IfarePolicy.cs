using System;
using System.Collections.Generic;
using Abp.Domain.Entities;

namespace IFare_API
{
    public partial class IfarePolicy : Entity
    {
        public IfarePolicy()
        {
            IfarePolicyCodeIdentities = new HashSet<IfarePolicyCodeIdentity>();
            IfarePolicyCodeIncomes = new HashSet<IfarePolicyCodeIncome>();
            IfarePolicyCodeKeywords = new HashSet<IfarePolicyCodeKeyword>();
            IfarePolicyCodeRecipients = new HashSet<IfarePolicyCodeRecipient>();
        }

        public long Id { get; set; }
        public DateTime CreateTime { get; set; }
        public DateTime? UpdateTime { get; set; }
        public string Title { get; set; }
        public long? CodePolicyId { get; set; }
        public long? CodeDomicileId { get; set; }
        public long? IfareOfficeUnitId { get; set; }
        public string OfficeUnitInfo { get; set; }
        public string OfficeUnitTel { get; set; }
        public string CompetentAuthority { get; set; }
        public string Qualification { get; set; }
        public string WelfareInfo { get; set; }
        public string Evidence { get; set; }
        public string Remark { get; set; }
        public string State { get; set; }
        public DateTime? ReleaseTime { get; set; }
        public DateTime? DiscontinuedTime { get; set; }
        public long? CreateUserId { get; set; }
        public long? UpdateUserId { get; set; }

        public virtual CodeDomicile CodeDomicile { get; set; }
        public virtual CodePolicy CodePolicy { get; set; }
        public virtual SysUser CreateUser { get; set; }
        public virtual IfareOfficeUnit IfareOfficeUnit { get; set; }
        public virtual SysUser UpdateUser { get; set; }
        public virtual ICollection<IfarePolicyCodeIdentity> IfarePolicyCodeIdentities { get; set; }
        public virtual ICollection<IfarePolicyCodeIncome> IfarePolicyCodeIncomes { get; set; }
        public virtual ICollection<IfarePolicyCodeKeyword> IfarePolicyCodeKeywords { get; set; }
        public virtual ICollection<IfarePolicyCodeRecipient> IfarePolicyCodeRecipients { get; set; }
    }
}
