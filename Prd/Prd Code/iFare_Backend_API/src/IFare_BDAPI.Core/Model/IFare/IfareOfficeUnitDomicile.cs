using System;
using System.Collections.Generic;
using Abp.Domain.Entities;

namespace IFare_BDAPI
{
    public partial class IfareOfficeUnitDomicile : Entity
    {
        public IfareOfficeUnitDomicile()
        {
            IfareOfficeUnitDomicileDetails = new HashSet<IfareOfficeUnitDomicileDetail>();
        }

        public long Id { get; set; }
        public DateTime CreateTime { get; set; }
        public long IfareOfficeUnitId { get; set; }
        public long CodeDomicileId { get; set; }
        public long? CreateUserId { get; set; }

        public virtual CodeDomicile CodeDomicile { get; set; }
        public virtual SysUser CreateUser { get; set; }
        public virtual IfareOfficeUnit IfareOfficeUnit { get; set; }
        public virtual ICollection<IfareOfficeUnitDomicileDetail> IfareOfficeUnitDomicileDetails { get; set; }
    }
}
